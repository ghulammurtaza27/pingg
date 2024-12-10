import { NextResponse } from 'next/server'
import { getServerSession } from "next-auth/next"
import { nextAuthConfig } from "@/lib/auth"
import { GoogleGenerativeAI } from "@google/generative-ai"
import prisma from "@/lib/prisma"

const apiKey = process.env.GOOGLE_AI_API_KEY
const genAI = new GoogleGenerativeAI(apiKey || '')

function cleanMarkdownJSON(text: string): string {
  return text.replace(/```[a-z]*\n?|\n?```/g, '').trim();
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(nextAuthConfig)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { agentId, knowledgeBaseId, currentQuestion, currentAnswer, conversation, entries } = await request.json()

    if (!agentId) {
      return NextResponse.json(
        { error: "Missing required field: agentId" },
        { status: 400 }
      )
    }

    // Handle manual updates from KnowledgeBaseDisplay
    if (entries && Array.isArray(entries)) {
      try {
        let knowledgeBase = await prisma.knowledgeBase.findUnique({
          where: { id: knowledgeBaseId },
          include: { entries: true }
        })

        if (!knowledgeBase) {
          throw new Error('Knowledge base not found')
        }

        // Update all entries
        await Promise.all(entries.map(async (entry: any) => {
          await prisma.knowledgeBaseEntry.upsert({
            where: { id: entry.id },
            update: {
              question: entry.question,
              answer: entry.answer
            },
            create: {
              knowledgeBaseId: knowledgeBase!.id,
              question: entry.question,
              answer: entry.answer
            }
          })
        }))

        // Refresh knowledge base
        knowledgeBase = await prisma.knowledgeBase.findUnique({
          where: { id: knowledgeBase.id },
          include: { entries: true }
        })

        return NextResponse.json({ success: true, knowledgeBase })
      } catch (error) {
        console.error('Error updating entries:', error)
        throw error
      }
    }

    // Handle new entries
    try {
      let knowledgeBase = knowledgeBaseId 
        ? await prisma.knowledgeBase.findUnique({
            where: { id: knowledgeBaseId },
            include: { entries: true }
          })
        : null

      if (!knowledgeBase) {
        // Create new knowledge base if it doesn't exist
        knowledgeBase = await prisma.knowledgeBase.create({
          data: {
            agentId,
            industry: "General",
            useCase: conversation[0]?.answer || "General",
            mainGoals: [],
            entries: {
              create: {
                question: currentQuestion,
                answer: currentAnswer
              }
            }
          },
          include: {
            entries: true
          }
        })
      } else {
        // Add entry to existing knowledge base
        await prisma.knowledgeBaseEntry.create({
          data: {
            knowledgeBaseId: knowledgeBase.id,
            question: currentQuestion,
            answer: currentAnswer
          }
        })

        // Refresh knowledge base
        knowledgeBase = await prisma.knowledgeBase.findUnique({
          where: { id: knowledgeBase.id },
          include: { entries: true }
        })
      }

      return NextResponse.json({ success: true, knowledgeBase })
    } catch (dbError) {
      console.error('Database error:', dbError)
      throw dbError
    }
  } catch (error) {
    console.error('Error updating knowledge base:', error)
    return NextResponse.json({ 
      error: "Failed to update knowledge base",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 