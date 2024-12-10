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
  const session = await getServerSession(nextAuthConfig)

  if (!session || !isValidSession(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const agents = await prisma.agent.findMany({
    where: {
      userId: session.user.id
    }
  })

  return NextResponse.json(agents)
}

export async function POST(request: Request) {
  const session = await getServerSession(nextAuthConfig)

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { name, type, status } = await request.json()

    if (!name || !type) {
      return NextResponse.json(
        { error: "Name and type are required" },
        { status: 400 }
      )
    }

    const agent = await prisma.agent.create({
      data: {
        name,
        type,
        status,
        userId: session.user.id
      }
    })

    return NextResponse.json(agent)
  } catch (error) {
    console.error("Error creating agent:", error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json(
      { error: "Failed to create agent" },
      { status: 500 }
    )
  }
}

