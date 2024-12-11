import prisma from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get('agentId')

    if (!agentId) {
      return new Response(
        JSON.stringify({ success: false, error: { message: "Agent ID is required" } }),
        { status: 400 }
      )
    }

    const knowledgeBase = await prisma.knowledgeBase.findFirst({
      where: { agentId },
      include: {
        entries: true,
        coalescedSummary: true,
        agent: true
      },
      orderBy: { createdAt: 'desc' }
    })

    console.log('API: Found knowledge base for agent:', knowledgeBase)

    return new Response(
      JSON.stringify({
        success: true,
        data: { knowledgeBase }
      }),
      { status: 200 }
    )
  } catch (error) {
    console.error('API Error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: { message: "Server error" } 
      }),
      { status: 500 }
    )
  }
} 