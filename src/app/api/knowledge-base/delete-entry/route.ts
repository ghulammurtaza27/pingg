import { NextResponse } from 'next/server'
import { getServerSession } from "next-auth/next"
import { nextAuthConfig } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(nextAuthConfig)
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    if (!body?.entryId || !body?.knowledgeBaseId) {
      return NextResponse.json({ 
        success: false,
        error: 'Missing required fields: entryId or knowledgeBaseId' 
      }, { status: 400 })
    }

    const { entryId, knowledgeBaseId } = body

    // First verify the knowledge base exists and the entry belongs to it
    const entry = await prisma.knowledgeBaseEntry.findFirst({
      where: { 
        id: entryId,
        knowledgeBaseId: knowledgeBaseId
      }
    })

    if (!entry) {
      return NextResponse.json({ 
        success: false,
        error: 'Entry not found or does not belong to this knowledge base' 
      }, { status: 404 })
    }

    // Delete the entry
    await prisma.knowledgeBaseEntry.delete({
      where: { id: entryId }
    })

    return NextResponse.json({ 
      success: true,
      message: 'Entry deleted successfully',
      deletedEntryId: entryId
    })
    
  } catch (error) {
    console.error('Error deleting entry:', error)
    return NextResponse.json({ 
      success: false,
      error: "Failed to delete entry",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 