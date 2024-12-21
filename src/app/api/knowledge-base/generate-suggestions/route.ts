import { NextResponse } from 'next/server'
import { getServerSession } from "next-auth/next"
import { nextAuthConfig } from "@/lib/auth"
import { GoogleGenerativeAI } from "@google/generative-ai"

const apiKey = process.env.GOOGLE_API_KEY
const genAI = new GoogleGenerativeAI(apiKey || '')

function cleanMarkdownJSON(text: string): string {
  // First try to extract JSON from markdown code blocks
  const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/)
  if (jsonMatch) {
    return jsonMatch[1].trim()
  }
  
  // If no code blocks, try to find JSON-like content
  const jsonContent = text.match(/\{[\s\S]*?\}/)
  if (jsonContent) {
    return jsonContent[0].trim()
  }
  
  // If all else fails, return cleaned text
  return text.replace(/```[a-z]*\n?|\n?```/g, '').trim()
}

export async function POST(request: Request) {
  const session = await getServerSession(nextAuthConfig)

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { question } = await request.json()


    if (!question) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      )
    }

    const prompt = `Generate 3-5 possible answers for this question: "${question}"
    
    Return ONLY a JSON object with a "suggestions" array containing the answers as strings.
    Example format: {"suggestions": ["Answer 1", "Answer 2", "Answer 3"]}
    Do not include any markdown formatting or code block syntax.
    
    Make the answers specific and relevant to the question.`

    const model = genAI.getGenerativeModel({ model: "gemini-pro" })
    const result = await model.generateContent(prompt)
    
    if (!result.response) {
      throw new Error('No response from AI model')
    }
    
    const response = result.response.text()


    try {
      const cleanedResponse = cleanMarkdownJSON(response)
     
      
      let parsedResponse
      try {
        parsedResponse = JSON.parse(cleanedResponse)
      } catch (jsonError) {
        console.error('JSON parse error:', jsonError)
        // Attempt to create a valid JSON structure
        const fallbackJson = {
          suggestions: [cleanedResponse.split('\n')
            .filter(line => line.trim())
            .map(line => line.replace(/^["-\s]+|["-\s]+$/g, ''))]
            .flat()
            .slice(0, 5)
        }
        parsedResponse = fallbackJson
      }
      
  
      
      if (!parsedResponse.suggestions || !Array.isArray(parsedResponse.suggestions)) {
        throw new Error('Invalid response format')
      }
      
      return NextResponse.json({ suggestions: parsedResponse.suggestions })
    } catch (parseError) {
      console.error('Error parsing response:', parseError)
      // Return a generic suggestion if all parsing fails
      return NextResponse.json({ 
        suggestions: [`Please provide an answer for: ${question}`] 
      })
    }
  } catch (error) {
    console.error('Error generating suggestions:', error)
    return NextResponse.json(
      { error: "Failed to generate suggestions" },
      { status: 500 }
    )
  }
} 