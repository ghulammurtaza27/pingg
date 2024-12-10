import { NextResponse } from 'next/server'
import { getServerSession } from "next-auth/next"
import { nextAuthConfig } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { Session } from 'next-auth'

type ValidSession = Session & {
  user: {
    id: string
  }
}

type StatusCount = {
  status: string
  _count: number
}

function isValidSession(session: unknown): session is ValidSession {
  return Boolean(
    session &&
    typeof session === 'object' &&
    'user' in session &&
    session.user &&
    typeof session.user === 'object' &&
    'id' in session.user &&
    typeof session.user.id === 'string'
  )
}

export async function GET() {
  try {
    const session = await getServerSession(nextAuthConfig)

    if (!session || !isValidSession(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const [totalRequests, averageRelevanceScore, statusCounts] = await Promise.all([
      prisma.request.count({ where: { userId: session.user.id } }),
      prisma.request.aggregate({
        where: { userId: session.user.id },
        _avg: { relevanceScore: true }
      }),
      prisma.request.groupBy({
        by: ['status'],
        where: { userId: session.user.id },
        _count: true
      })
    ])

    const statusMap = statusCounts.reduce((acc: Record<string, number>, curr: StatusCount) => {
      acc[curr.status] = curr._count
      return acc
    }, {} as Record<string, number>)

    const analyticsData = {
      totalRequests,
      averageRelevanceScore: averageRelevanceScore._avg.relevanceScore || 0,
      acceptedRequests: statusMap['accepted'] || 0,
      rejectedRequests: statusMap['rejected'] || 0,
      pendingRequests: statusMap['pending'] || 0
    }

    return NextResponse.json(analyticsData, { status: 200 })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

