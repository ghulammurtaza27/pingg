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
  try {
    const session = await getServerSession(authOptions)

    if (!session || !isValidSession(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationalGoals: true },
    })

    return NextResponse.json({ goals: user?.organizationalGoals || '' }, { status: 200 })
  } catch (error) {
    console.error('Fetch goals error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !isValidSession(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { goals } = body

    if (!goals) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { organizationalGoals: goals },
    })

    return NextResponse.json({ message: "Goals updated successfully" }, { status: 200 })
  } catch (error) {
    console.error('Update goals error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

