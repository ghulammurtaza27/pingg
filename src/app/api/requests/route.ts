import { NextResponse } from 'next/server'
import { getServerSession } from "next-auth/next"
import { nextAuthConfig } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(nextAuthConfig)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get user's agents
    const userAgents = await prisma.agent.findMany({
      where: { userId: user.id },
      select: { id: true }
    })

    const agentIds = userAgents.map(agent => agent.id)

    // Fetch requests where user's agents are either sender or recipient
    const requests = await prisma.request.findMany({
      where: {
        OR: [
          { senderAgentId: { in: agentIds } },
          { recipientAgentId: { in: agentIds } }
        ]
      },
      include: {
        senderAgent: {
          select: { name: true }
        },
        recipientAgent: {
          select: { name: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ 
      success: true, 
      requests 
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: "Failed to fetch requests" 
    }, { status: 500 })
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

