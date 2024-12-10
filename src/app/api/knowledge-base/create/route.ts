import { NextResponse } from 'next/server'
import { getServerSession } from "next-auth/next"
import { nextAuthConfig } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)

export async function POST(request: Request) {
  const session = await getServerSession(nextAuthConfig)

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { agentId, purpose, entries } = await request.json()
    const model = genAI.getGenerativeModel({ model: "gemini-pro" })

    // Process entries with Gemini for better formatting and consistency
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
          // Return original entry if parsing fails
          return entry
        }
      })
    )

    // Create knowledge base and entries in a transaction
    const knowledgeBase = await prisma.$transaction(async (tx) => {
      const kb = await tx.knowledgeBase.create({
        data: {
          agentId,
          industry: purpose.industry,
          useCase: purpose.useCase,
          mainGoals: purpose.mainGoals,
        }
      })

      await tx.knowledgeBaseEntry.createMany({
        data: processedEntries.map(entry => ({
          knowledgeBaseId: kb.id,
          question: entry.question,
          answer: entry.answer
        }))
      })

      return kb
    })

    return NextResponse.json(knowledgeBase)
  } catch (error) {
    console.error('Error creating knowledge base:', error)
    return NextResponse.json(
      { error: "Failed to create knowledge base" },
      { status: 500 }
    )
  }
} 