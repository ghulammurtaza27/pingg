import { NextResponse } from 'next/server'
import { getServerSession } from "next-auth/next"
import { nextAuthConfig } from "@/lib/auth"
import { GoogleGenerativeAI } from "@google/generative-ai"
import prisma from "@/lib/prisma"

const apiKey = process.env.GOOGLE_AI_API_KEY
const genAI = new GoogleGenerativeAI(apiKey || '')

interface CoalescedData {
  summary: string;
  capabilities: string[];
  useCases: string[];
  limitations: string[];
  additionalContext: string;
}

function cleanResponse(text: string): string {
  const jsonMatch = text.match(/```(?:json|JSON)?\n?([\s\S]*?)\n?```/)
  if (jsonMatch) {
    return jsonMatch[1].trim()
  }
  return text.trim()
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(nextAuthConfig)
    if (!session?.user) {
      return new Response(
        JSON.stringify({ success: false, error: { message: "Unauthorized" } }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const body = await request.json()
    const { knowledgeBaseId } = body

    if (!knowledgeBaseId) {
      return new Response(
        JSON.stringify({ success: false, error: { message: "Knowledge base ID is required" } }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const knowledgeBase = await prisma.knowledgeBase.findUnique({
      where: { id: knowledgeBaseId },
      include: { 
        entries: true,
        agent: true
      }
    })

    if (!knowledgeBase) {
      return new Response(
        JSON.stringify({ success: false, error: { message: "Knowledge base not found" } }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const conversationContext = knowledgeBase.entries
      .map(entry => `Q: ${entry.question}\nA: ${entry.answer}`)
      .join('\n\n')

    const prompt = `Analyze this Q&A conversation and create a structured summary:
${conversationContext}

Consider the following context:
Industry: ${knowledgeBase.industry}
Use Case: ${knowledgeBase.useCase}
Main Goals: ${knowledgeBase.mainGoals.join(', ')}

Respond with a JSON object containing:
{
  "summary": "Brief overview of purpose",
  "capabilities": ["Key functionalities"],
  "useCases": ["Specific use cases"],
  "limitations": ["Known limitations"],
  "additionalContext": "Other important details"
}`

    const model = genAI.getGenerativeModel({ model: "gemini-pro" })
    const result = await model.generateContent(prompt)
    
    if (!result.response) {
      throw new Error('No response from AI model')
    }
    
    const response = result.response.text()
    const cleanedResponse = cleanResponse(response)
    const parsedResponse = JSON.parse(cleanedResponse)

    const coalescedData = {
      summary: String(parsedResponse.summary || ''),
      capabilities: Array.isArray(parsedResponse.capabilities) ? parsedResponse.capabilities : [],
      useCases: Array.isArray(parsedResponse.useCases) ? parsedResponse.useCases : [],
      limitations: Array.isArray(parsedResponse.limitations) ? parsedResponse.limitations : [],
      additionalContext: String(parsedResponse.additionalContext || '')
    }

    try {
      // Create or update the coalesced summary
      const updatedKnowledgeBase = await prisma.knowledgeBase.update({
        where: { id: knowledgeBaseId },
        data: {
          coalesced: true,
          updatedAt: new Date(),
          coalescedSummary: {
            upsert: {
              create: coalescedData,
              update: coalescedData
            }
          }
        },
        include: {
          entries: true,
          agent: true,
          coalescedSummary: true
        }
      })

      return new Response(
        JSON.stringify({
          success: true,
          data: { 
            knowledgeBase: {
              ...updatedKnowledgeBase,
              coalescedData
            }
          }
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )

    } catch (error) {
      if (error instanceof Error) {
        console.error('Database update error:', error.message)
      }
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: { message: "Failed to update knowledge base" } 
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    if (error instanceof Error) {
      console.error('API Error:', error.message)
    }
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: { 
          message: "Server error",
          details: error instanceof Error ? error.message : 'Unknown error'
        } 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
} 