import { NextResponse } from 'next/server'
import { getServerSession } from "next-auth/next"
import { nextAuthConfig } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { pusherServer } from '@/lib/pusher'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const recipientId = searchParams.get('recipientId')
    
    const session = await getServerSession(nextAuthConfig)
    if (!session?.user?.email) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Unauthorized' 
      }), { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })

    if (!user) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'User not found' 
      }), { status: 404 })
    }

    const requests = await prisma.request.findMany({
      where: {
        userId: user.id,
        ...(recipientId ? { recipientAgentId: recipientId } : {})
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

    return new Response(JSON.stringify({ 
      success: true, 
      requests 
    }))
    
  } catch (error) {
    console.error('Error in requests API:', error)
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Failed to fetch requests' 
    }), { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(nextAuthConfig)
    if (!session?.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    
    const newRequest = await prisma.request.create({
      data: {
        ...data,
        status: 'PENDING'
      },
      include: {
        senderAgent: true,
        recipientAgent: true
      }
    })


    // Trigger Pusher event
    await pusherServer.trigger('requests', 'new-request', {
      id: newRequest.id,
      title: `New Request from ${newRequest.senderAgent.name}`,
      message: newRequest.summary,
      url: `/requests/${newRequest.id}`
    })

    return Response.json({ request: newRequest })
  } catch (error) {
    console.error('Error in POST /api/requests:', error)
    return Response.json({ error: 'Failed to create request' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession(nextAuthConfig)

  if (!session?.user?.id) {
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
  const session = await getServerSession(nextAuthConfig)

  if (!session?.user?.id) {
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

