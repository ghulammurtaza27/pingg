import { NextResponse } from 'next/server'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
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
  const session = await getServerSession(authOptions)

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
  const session = await getServerSession(authOptions)

  if (!session || !isValidSession(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const newAgent = await prisma.agent.create({
    data: {
      name: body.name,
      type: body.type,
      userId: session.user.id
    }
  })

  return NextResponse.json(newAgent, { status: 201 })
}

