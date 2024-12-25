import { getServerSession } from "next-auth"
import { nextAuthConfig as authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { agentId } = body

    if (!agentId) {
      return Response.json({ error: "Agent ID is required" }, { status: 400 })
    }

    // Reset all agents first
    await prisma.agent.updateMany({
      where: { userId: session.user.id },
      data: { isDefault: false }
    })

    // Set new default agent
    await prisma.agent.update({
      where: { id: agentId },
      data: { isDefault: true }
    })

    return Response.json({ success: true })
  } catch (error) {
    return Response.json({ error: "Failed to update default agent" }, { status: 500 })
  }
} 