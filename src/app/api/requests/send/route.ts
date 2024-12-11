// route.ts
import { getServerSession } from "next-auth/next"
import { nextAuthConfig } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { calculateRelevanceScore } from '@/lib/relevance'

export async function POST(request: Request) {
  const headers = {
    'Content-Type': 'application/json',
  }

  const respond = (data: any, status: number = 200) => {
    return new Response(JSON.stringify(data), {
      status,
      headers
    })
  }

  let data;
  try {
    data = await request.json()
  } catch (error) {
    return respond({ error: 'Invalid request body' }, 400)
  }

  const { summary, considerations, recipientAgentId } = data

  try {
    const session = await getServerSession(nextAuthConfig)
    if (!session?.user?.email) {
      return respond({ error: 'Unauthorized' }, 401)
    }

    if (!summary || !considerations || !recipientAgentId) {
      return respond({ error: 'Missing required fields' }, 400)
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })

    if (!user?.id) {
      return respond({ error: 'User not found' }, 404)
    }

    const senderAgent = await prisma.agent.findFirst({
      where: { userId: user.id }
    })

    if (!senderAgent) {
      return respond({ error: 'No agent found for sender' }, 400)
    }

    const recipientAgent = await prisma.agent.findUnique({
      where: { id: recipientAgentId }
    })

    if (!recipientAgent) {
      return respond({ error: 'Recipient agent not found' }, 404)
    }

    const recipientKnowledgeBase = await prisma.knowledgeBase.findFirst({
      where: { agentId: recipientAgentId },
      select: {
        id: true,
        industry: true,
        useCase: true,
        mainGoals: true,
        coalesced: true,
        entries: {
          select: { 
            id: true,
            question: true,
            answer: true 
          }
        }, 
        coalescedSummary: {
          select: { 
            id: true,
            summary: true,
            capabilities: true,
            useCases: true,
            limitations: true,
            additionalContext: true
          }
        }
      }
    })

    if (!recipientKnowledgeBase) {
      return respond({ error: 'Recipient agent has no knowledge base' }, 400)
    }

    if (recipientKnowledgeBase.entries.length === 0 && !recipientKnowledgeBase.coalescedSummary) {
      return respond({ error: 'Knowledge base has no content' }, 400)
    }

    // Format knowledge base data for relevance calculation
    const formattedKnowledgeBase = {
      ...recipientKnowledgeBase,
      entries: recipientKnowledgeBase.entries.map(entry => ({
        content: `Q: ${entry.question}\nA: ${entry.answer}`
      })),
      coalescedSummary: recipientKnowledgeBase.coalescedSummary ? {
        content: [
          recipientKnowledgeBase.coalescedSummary.summary,
          `Capabilities: ${recipientKnowledgeBase.coalescedSummary.capabilities.join(', ')}`,
          `Use Cases: ${recipientKnowledgeBase.coalescedSummary.useCases.join(', ')}`,
          `Limitations: ${recipientKnowledgeBase.coalescedSummary.limitations.join(', ')}`,
          recipientKnowledgeBase.coalescedSummary.additionalContext
        ].filter(Boolean).join('\n')
      } : null
    }

    const relevanceScore = await calculateRelevanceScore(
      summary,
      considerations,
      formattedKnowledgeBase
    )

    if (relevanceScore < 0.5) {
      return respond({ 
        error: 'Request relevance score too low',
        score: relevanceScore 
      }, 400)
    }

    const newRequest = await prisma.$transaction(async (tx) => {
      const request = await tx.request.create({
        data: {
          summary,
          considerations,
          relevanceScore,
          status: 'pending',
          senderAgentId: senderAgent.id,
          recipientAgentId,
          userId: user.id,
        }
      })

      await tx.notification.create({
        data: {
          requestId: request.id,
          userId: user.id,
          message: `New ${relevanceScore >= 0.8 ? 'highly' : 'moderately'} relevant request (${(relevanceScore * 100).toFixed(0)}%) from ${senderAgent.name}`,
        }
      })

      return request
    })

    return respond({ 
      success: true,
      request: newRequest,
      relevanceScore 
    })

  } catch (error) {
    console.error('API Error:', error)
    return respond({ 
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
}