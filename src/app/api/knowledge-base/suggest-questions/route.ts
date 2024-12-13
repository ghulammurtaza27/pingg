import { NextResponse } from 'next/server'
import { getServerSession } from "next-auth/next"
import { nextAuthConfig } from "@/lib/auth"
import { GoogleGenerativeAI } from "@google/generative-ai"

// Initialize the Google AI client with debug logging
const apiKey = process.env.GOOGLE_AI_API_KEY


const genAI = new GoogleGenerativeAI(apiKey || '')

// Helper function to clean markdown code blocks
function cleanMarkdownJSON(text: string): string {
  // Remove markdown code block syntax and any language identifier
  return text.replace(/```[a-z]*\n?|\n?```/g, '').trim()
}

export async function POST(request: Request) {

  
  const session = await getServerSession(nextAuthConfig)
  

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()

    
    const { industry, useCase, mainGoals } = body

    // Validate input
    if (!industry || !useCase) {
     
      return NextResponse.json(
        { error: "Industry and use case are required" },
        { status: 400 }
      )
    }

    const prompt = `Generate 5-10 relevant questions for a knowledge base with the following context:
    Industry: ${industry}
    Use Case: ${useCase}
    Main Goals: ${mainGoals.join(', ')}
    
    Return ONLY a JSON object with a "questions" array containing the questions as strings.
    Example format: {"questions": ["Question 1?", "Question 2?", "Question 3?"]}
    Do not include any markdown formatting or code block syntax.
    
    Make the questions specific and relevant to the industry and use case.`



    // Generate content
    const model = genAI.getGenerativeModel({ model: "gemini-pro" })
    const result = await model.generateContent(prompt)
    const response = await result.response.text()
    


    try {
      // Clean the response before parsing
      const cleanedResponse = cleanMarkdownJSON(response)

      
      const parsedResponse = JSON.parse(cleanedResponse)
 
      
      if (!parsedResponse.questions || !Array.isArray(parsedResponse.questions)) {
       
        throw new Error('Invalid response format')
      }
      
      return NextResponse.json({ 
        suggestedQuestions: parsedResponse.questions 
      })
    } catch (parseError) {
      console.error('Error parsing Gemini response:', {
        error: parseError,
        rawResponse: response,
        cleanedResponse: cleanMarkdownJSON(response)
      })
      return NextResponse.json(
        { error: "Failed to parse generated questions" },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Error in suggest-questions:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      response: error.response?.data,
      raw: error
    })
    return NextResponse.json(
      { error: "Failed to generate questions" },
      { status: 500 }
    )
  }
} 