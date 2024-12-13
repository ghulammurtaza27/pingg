import { getServerSession } from "next-auth/next"
import { nextAuthConfig } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(nextAuthConfig)
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })

    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify the notification belongs to the user
    const notification = await prisma.notification.findFirst({
      where: {
        id: params.id,
        userId: user.id
      }
    })

    if (!notification) {
      return Response.json({ error: 'Notification not found' }, { status: 404 })
    }

    // Mark as read
    await prisma.notification.update({
      where: { id: params.id },
      data: { read: true }
    })

    return Response.json({ success: true })
  } catch (error) {
    console.error('Error marking notification as read:', error)
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  }
} 