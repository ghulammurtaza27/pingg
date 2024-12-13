import { NextResponse } from 'next/server'
import { getServerSession } from "next-auth/next"
import { nextAuthConfig } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return new Response(
        JSON.stringify({ success: false, error: { message: "ID is required" } }),
        { status: 400 }
      )
    }

    const knowledgeBase = await prisma.knowledgeBase.findUnique({
      where: { id },
      include: {
        agent: true,
        entries: true,
        coalescedSummary: true
      }
    })

 

    if (!knowledgeBase) {
      return new Response(
        JSON.stringify({ success: false, error: { message: "Knowledge base not found" } }),
        { status: 404 }
      )
    }

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