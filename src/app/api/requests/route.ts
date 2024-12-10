import { NextResponse } from 'next/server'
import { getServerSession } from "next-auth/next"
import { nextAuthConfig } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { calculateRelevanceScore } from '@/app/utils/relevanceScoring'
import { Session } from 'next-auth'

type ValidSession = Session & {
  user: {
    id: string
  }
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

export async function GET(request: Request) {
  const session = await getServerSession(nextAuthConfig)

  if (!session || !isValidSession(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '5')
  const query = searchParams.get('query')

  try {
    const skip = (page - 1) * limit
    const where = {
      userId: session.user.id,
      ...(query ? {
        content: {
          contains: query,
          mode: 'insensitive'
        }
      } : {})
    }

    const [requests, total] = await Promise.all([
      prisma.request.findMany({
        where,
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.request.count({ where })
    ])

    return NextResponse.json({
      requests,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit
      }
    })
  } catch (error) {
    console.error('Error fetching requests:', error)
    return NextResponse.json(
      { error: "Failed to fetch requests" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(nextAuthConfig)

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { content } = await request.json()

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      )
    }

    const newRequest = await prisma.request.create({
      data: {
        content,
        userId: session.user.id
      }
    })

    return NextResponse.json(newRequest)
  } catch (error) {
    console.error("Error creating request:", error)
    return NextResponse.json(
      { error: "Failed to create request" },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session || !isValidSession(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { id, status } = body

  try {
    const existingRequest = await prisma.request.findUnique({
      where: { id },
      select: { userId: true }
    })

    if (!existingRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 })
    }

    if (existingRequest.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const updatedRequest = await prisma.request.update({
      where: { id },
      data: { status },
      include: {
        senderAgent: true,
        recipientAgent: true
      }
    })

    return NextResponse.json(updatedRequest)
  } catch (error) {
    console.error('Error updating request:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session || !isValidSession(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: "Request ID is required" }, { status: 400 })
  }

  try {
    const existingRequest = await prisma.request.findUnique({
      where: { id },
      select: { userId: true }
    })

    if (!existingRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 })
    }

    if (existingRequest.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await prisma.request.delete({
      where: { id }
    })

    return NextResponse.json({ message: "Request deleted successfully" })
  } catch (error) {
    console.error('Error deleting request:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

