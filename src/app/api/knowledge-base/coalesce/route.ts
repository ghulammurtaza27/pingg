import { NextResponse } from 'next/server'
import { getServerSession } from "next-auth/next"
import { nextAuthConfig } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { geminiModel } from "@/lib/gemini"

function cleanMarkdownJSON(text: string): string {
  // Remove markdown code blocks and clean up the text
  const cleaned = text
    .replace(/```json\s*|\s*```/g, '')
    .replace(/```javascript\s*|\s*```/g, '')
    .trim()
  
  // If the text doesn't start with {, try to find the first {
  if (!cleaned.startsWith('{')) {
    const jsonStart = cleaned.indexOf('{')
    if (jsonStart !== -1) {
      return cleaned.slice(jsonStart)
    }
  }
  return cleaned
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(nextAuthConfig)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { knowledgeBaseId, agentId } = await request.json()

    if (!knowledgeBaseId || !agentId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get knowledge base entries
    const knowledgeBase = await prisma.knowledgeBase.findUnique({
      where: { id: knowledgeBaseId },
      include: {
        entries: true,
        agent: true
      }
    })

    if (!knowledgeBase) {
      return NextResponse.json({ error: "Knowledge base not found" }, { status: 404 })
    }

    // Create context from entries
    const context = knowledgeBase.entries.map(entry => 
      `Q: ${entry.question}\nA: ${entry.answer}`
    ).join('\n\n')

    const prompt = `Analyze this knowledge base and create a comprehensive summary.
Return ONLY a JSON object in this exact format:
{
  "summary": "Brief overview of the knowledge base content and purpose",
  "capabilities": ["List of key capabilities identified"],
  "useCases": ["List of primary use cases"],
  "limitations": ["List of identified limitations or constraints"],
  "additionalContext": "Any other relevant insights"
}

Knowledge Base Content:
${context}

Agent Type: ${knowledgeBase.agent.type}
Industry: ${knowledgeBase.industry}
Use Case: ${knowledgeBase.useCase}
Goals: ${knowledgeBase.mainGoals?.join(', ')}

Remember to:
1. Return ONLY valid JSON
2. Include all required fields
3. Make lists specific and actionable
4. Keep the summary concise but comprehensive`

    const result = await geminiModel.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    try {
      // Clean and parse the response
      const cleanedResponse = cleanMarkdownJSON(text)
      const parsedResponse = JSON.parse(cleanedResponse)

      // Validate response structure
      if (!parsedResponse.summary || !parsedResponse.capabilities || 
          !parsedResponse.useCases || !parsedResponse.limitations) {
        throw new Error('Invalid response structure')
      }

      // Update or create coalesced summary
      const updatedKnowledgeBase = await prisma.knowledgeBase.update({
        where: { id: knowledgeBaseId },
        data: {
          coalesced: true,
          coalescedSummary: {
            upsert: {
              create: {
                summary: parsedResponse.summary,
                capabilities: parsedResponse.capabilities,
                useCases: parsedResponse.useCases,
                limitations: parsedResponse.limitations,
                additionalContext: parsedResponse.additionalContext
              },
              update: {
                summary: parsedResponse.summary,
                capabilities: parsedResponse.capabilities,
                useCases: parsedResponse.useCases,
                limitations: parsedResponse.limitations,
                additionalContext: parsedResponse.additionalContext
              }
            }
          }
        },
        include: {
          entries: true,
          coalescedSummary: true
        }
      })

      return NextResponse.json({
        success: true,
        data: {
          knowledgeBase: updatedKnowledgeBase
        }
      })

    } catch (parseError) {
      console.error('Failed to parse AI response:', {
        error: parseError,
        rawResponse: text,
        cleanedResponse: cleanMarkdownJSON(text)
      })
      
      return NextResponse.json({
        error: {
          message: "Failed to parse AI response",
          details: parseError instanceof Error ? parseError.message : 'Unknown error'
        }
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Coalesce error:', error)
    return NextResponse.json({
      error: {
        message: "Failed to coalesce knowledge base",
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 })
  }
} 