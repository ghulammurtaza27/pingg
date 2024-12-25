import { NextResponse } from 'next/server'
import { getServerSession } from "next-auth/next"
import { nextAuthConfig } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!)

export async function POST(request: Request) {
  const session = await getServerSession(nextAuthConfig)

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { agentId, entries } = await request.json()

    if (!agentId) {
      return NextResponse.json(
        { error: "Missing required field: agentId" },
        { status: 400 }
      )
    }

    const model = genAI.getGenerativeModel({ model: "gemini-pro" })

    // Process entries with Gemini for better formatting
    const processedEntries = await Promise.all(
      entries.map(async (entry: { question: string; answer: string }) => {
        const prompt = `Improve and format this knowledge base entry while maintaining its core meaning:
        Question: ${entry.question}
        Answer: ${entry.answer}
        
        Return as JSON with "question" and "answer" fields.
        Example format: {"question": "Improved question?", "answer": "Improved answer"}
        
        Make the response clear, concise, and professional while keeping the original intent.`

        const result = await model.generateContent(prompt)
        const response = await result.response.text()
        
        try {
          return JSON.parse(response)
        } catch (error) {
          console.error('Error parsing Gemini response for entry:', response)
          return entry
        }
      })
    )

    // Create knowledge base with default values
    const knowledgeBase = await prisma.$transaction(async (tx) => {
      const kb = await tx.knowledgeBase.create({
        data: {
          agentId,
          industry: "General Knowledge",
          useCase: "Information Management",
          mainGoals: ["Collect and organize information"],
          entries: {
            create: processedEntries.map(entry => ({
              question: entry.question,
              answer: entry.answer,
              source: 'manual'
            }))
          }
        },
        include: {
          entries: true
        }
      })

      return kb
    })

    return NextResponse.json({
      success: true,
      id: knowledgeBase.id,
      data: knowledgeBase
    })

  } catch (error) {
    console.error('Error creating knowledge base:', error)
    return NextResponse.json(
      { error: "Failed to create knowledge base" },
      { status: 500 }
    )
  }
} 