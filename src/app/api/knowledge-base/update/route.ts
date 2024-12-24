import { NextResponse } from 'next/server'
import { getServerSession } from "next-auth/next"
import { nextAuthConfig } from "@/lib/auth"
import { GoogleGenerativeAI } from "@google/generative-ai"
import prisma from "@/lib/prisma"

const apiKey = process.env.GOOGLE_API_KEY
const genAI = new GoogleGenerativeAI(apiKey || '')

function cleanMarkdownJSON(text: string): string {
  return text.replace(/```[a-z]*\n?|\n?```/g, '').trim();
}

interface KnowledgeBaseEntry {
  id: string
  question: string
  answer: string
  orderIndex?: number
  source?: string
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(nextAuthConfig)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    console.log('Received update request:', body)
    
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    const { agentId, knowledgeBaseId, entries }: {
      agentId: string,
      knowledgeBaseId: string,
      entries: KnowledgeBaseEntry[]
    } = body

    if (!agentId || !knowledgeBaseId || !entries) {
      return NextResponse.json(
        { error: `Missing required fields: ${!agentId ? 'agentId' : ''} ${!knowledgeBaseId ? 'knowledgeBaseId' : ''} ${!entries ? 'entries' : ''}`.trim() },
        { status: 400 }
      )
    }

    // First verify the knowledge base exists and belongs to the agent
    const existingKB = await prisma.knowledgeBase.findFirst({
      where: { 
        id: knowledgeBaseId,
        agentId: agentId
      },
      include: { 
        entries: true,
        agent: {
          select: {
            userId: true
          }
        }
      }
    })

    if (!existingKB) {
      return NextResponse.json({ 
        error: `Knowledge base not found or unauthorized` 
      }, { status: 404 })
    }

    // Verify user owns the agent
    if (existingKB.agent.userId !== session.user.id) {
      return NextResponse.json({ 
        error: "Unauthorized access to this knowledge base" 
      }, { status: 403 })
    }

    try {
      // Update entries in a transaction
      await prisma.$transaction(async (tx) => {
        // First verify all entries exist and belong to this knowledge base
        const existingEntries = await tx.knowledgeBaseEntry.findMany({
          where: {
            knowledgeBaseId
          },
          select: {
            id: true
          }
        })

        const existingIds = existingEntries.map((e: { id: string }) => e.id)
        const updatedIds = entries.map((e: KnowledgeBaseEntry) => e.id)
        
        // Find entries to delete (exist in DB but not in updated list)
        const idsToDelete = existingIds.filter(id => !updatedIds.includes(id))
        
        if (idsToDelete.length > 0) {
          console.log('Deleting entries:', idsToDelete)
          await tx.knowledgeBaseEntry.deleteMany({
            where: {
              id: {
                in: idsToDelete
              }
            }
          })
        }

        // Then upsert remaining entries
        for (const entry of entries) {
          await tx.knowledgeBaseEntry.upsert({
            where: { id: entry.id },
            create: {
              id: entry.id,
              knowledgeBaseId,
              question: entry.question,
              answer: entry.answer,
              source: entry.source || 'manual',
              orderIndex: entry.orderIndex || 0
            },
            update: {
              question: entry.question,
              answer: entry.answer,
              source: entry.source || 'manual',
              orderIndex: entry.orderIndex || 0
            }
          })
        }

        // Update the knowledge base's updatedAt
        await tx.knowledgeBase.update({
          where: { id: knowledgeBaseId },
          data: { updatedAt: new Date() }
        })
      })

      // Fetch the updated knowledge base
      const updatedKB = await prisma.knowledgeBase.findUnique({
        where: { id: knowledgeBaseId },
        include: { 
          entries: {
            orderBy: { orderIndex: 'asc' }
          }
        }
      })

      return NextResponse.json({ 
        success: true, 
        knowledgeBase: updatedKB
      })

    } catch (error) {
      console.error('Database error:', error)
      return NextResponse.json({ 
        error: "Database operation failed",
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ 
      error: "Failed to update knowledge base",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}