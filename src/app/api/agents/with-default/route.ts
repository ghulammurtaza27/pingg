import { getServerSession } from "next-auth"
import { nextAuthConfig } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(nextAuthConfig)
    if (!session) {
      return new Response("Unauthorized", { status: 401 })
    }

    const agents = await prisma.agent.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' }
    })

    return new Response(JSON.stringify(agents))
  } catch (error) {
    return new Response("Failed to fetch agents", { status: 500 })
  }
} 