import { NextResponse } from 'next/server'
import { getServerSession } from "next-auth/next"
import { nextAuthConfig } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(nextAuthConfig)

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const id = await params.id

    const agent = await prisma.agent.findUnique({
      where: { id },
      include: {
        knowledgeBases: {
          include: {
            entries: true
          }
        }
      }
    })

    if (!agent) {
      return NextResponse.json(
        { error: "Agent not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(agent)
  } catch (error) {
    console.error("Error fetching agent:", error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json(
      { error: "Failed to fetch agent" },
      { status: 500 }
    )
  }
} 