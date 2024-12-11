import { NextResponse } from 'next/server'
import { getServerSession } from "next-auth/next"
import { nextAuthConfig } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(nextAuthConfig)
    if (!session?.user?.email) {
      return NextResponse.json({ 
        success: false,
        error: "Unauthorized" 
      }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ 
        success: false,
        error: "User not found" 
      }, { status: 404 })
    }

    // Get user's agents
    const agents = await prisma.agent.findMany({
      where: {
        userId: user.id  // Get only user's own agents
      },
      include: {
        knowledgeBases: {
          orderBy: {
            updatedAt: 'desc'
          },
          take: 1,
          select: {
            updatedAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Format the agents to match the frontend type
    const formattedAgents = agents.map(agent => ({
      id: agent.id,
      name: agent.name,
      type: agent.type,
      status: (agent.status as 'active' | 'inactive') || 'inactive',
      lastActive: agent.knowledgeBases[0]?.updatedAt.toISOString() || agent.updatedAt.toISOString()
    }))

    return NextResponse.json(formattedAgents)

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ 
      success: false,
      error: "Failed to fetch agents" 
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(nextAuthConfig)
    if (!session?.user?.email) {
      return NextResponse.json({ 
        success: false,
        error: "Unauthorized" 
      }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ 
        success: false,
        error: "User not found" 
      }, { status: 404 })
    }

    const { name, type } = await request.json()

    if (!name || !type) {
      return NextResponse.json({
        success: false,
        error: "Name and type are required"
      }, { status: 400 })
    }

    const agent = await prisma.agent.create({
      data: {
        name,
        type,
        status: 'active',
        userId: user.id
      }
    })

    // Format the response to match frontend type
    const formattedAgent = {
      id: agent.id,
      name: agent.name,
      type: agent.type,
      status: 'active' as const,
      lastActive: agent.updatedAt.toISOString()
    }

    return NextResponse.json({
      success: true,
      agent: formattedAgent
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ 
      success: false,
      error: "Failed to create agent" 
    }, { status: 500 })
  }
}
