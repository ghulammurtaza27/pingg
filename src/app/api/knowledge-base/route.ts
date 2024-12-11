import { getServerSession } from "next-auth/next"
import { nextAuthConfig } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const session = await getServerSession(nextAuthConfig)
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, data: null, error: { message: "Unauthorized" } },
        { status: 401 }
      )
    }

    console.log("Fetching for user:", session.user.email)

    const knowledgeBases = await prisma.knowledgeBase.findMany({
      where: {
        agent: {
          userId: session.user.id
        }
      },
      include: {
        entries: true,
        coalescedSummary: true
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 1
    })

    console.log("Found knowledge bases:", JSON.stringify(knowledgeBases, null, 2))

    if (!knowledgeBases.length) {
      return NextResponse.json(
        { success: false, data: null, error: { message: "No knowledge base found" } },
        { status: 404 }
      )
    }

    const knowledgeBase = knowledgeBases[0]

    // Structure the response to match the component's expected format
    const formattedKnowledgeBase = {
      id: knowledgeBase.id,
      industry: knowledgeBase.industry,
      useCase: knowledgeBase.useCase,
      mainGoals: knowledgeBase.mainGoals || [],
      coalesced: knowledgeBase.coalesced,
      entries: knowledgeBase.entries.map(entry => ({
        id: entry.id,
        question: entry.question,
        answer: entry.answer
      })),
      coalescedSummary: knowledgeBase.coalescedSummary ? {
        id: knowledgeBase.coalescedSummary.id,
        summary: knowledgeBase.coalescedSummary.summary,
        capabilities: knowledgeBase.coalescedSummary.capabilities || [],
        useCases: knowledgeBase.coalescedSummary.useCases || [],
        limitations: knowledgeBase.coalescedSummary.limitations || [],
        additionalContext: knowledgeBase.coalescedSummary.additionalContext
      } : null
    }

    console.log("Formatted response:", JSON.stringify({
      success: true,
      data: { knowledgeBase: formattedKnowledgeBase },
      error: null
    }, null, 2))

    return NextResponse.json({
      success: true,
      data: { knowledgeBase: formattedKnowledgeBase },
      error: null
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        data: null,
        error: { 
          message: "Server error",
          details: error instanceof Error ? error.message : 'Unknown error'
        } 
      },
      { status: 500 }
    )
  }
} 