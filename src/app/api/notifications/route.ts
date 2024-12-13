import { getServerSession } from "next-auth/next"
import { nextAuthConfig } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET() {
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

    const notifications = await prisma.notification.findMany({
      where: { 
        userId: user.id 
      },
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        message: true,
        read: true,
        createdAt: true,
        request: {
          select: {
            id: true
          }
        }
      }
    })

    // Format notifications for frontend
    const formattedNotifications = notifications.map(notification => ({
      id: notification.id,
      message: notification.message,
      read: notification.read,
      url: notification.request ? `/requests/${notification.request.id}` : undefined,
      createdAt: notification.createdAt
    }))

    return Response.json({ notifications: formattedNotifications })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  }
} 