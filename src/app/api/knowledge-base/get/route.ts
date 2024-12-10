import { NextResponse } from 'next/server'
import { getServerSession } from "next-auth/next"
import { nextAuthConfig } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(nextAuthConfig)
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { message: "Unauthorized" } },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get('agentId')

    if (!agentId) {
      return NextResponse.json(
        { success: false, error: { message: "Agent ID is required" } },
        { status: 400 }
      )
    }

    const knowledgeBase = await prisma.knowledgeBase.findFirst({
      where: { agentId },
      select: {
        id: true,
        agentId: true,
        coalesced: true,
        entries: {
          select: {
            id: true,
            question: true,
            answer: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        knowledgeBase: knowledgeBase ? {
          id: knowledgeBase.id,
          agentId: knowledgeBase.agentId,
          coalesced: Boolean(knowledgeBase.coalesced),
          entries: knowledgeBase.entries || []
        } : null
      }
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          message: "Server error",
          details: error instanceof Error ? error.message : 'Unknown error'
        } 
      },
      { status: 500 }
    )
  }
} 