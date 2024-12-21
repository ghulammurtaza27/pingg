// src/app/api/gmail/status/route.ts
import { getServerSession } from "next-auth/next"
import { nextAuthConfig } from "@/lib/auth"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(nextAuthConfig)
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      gmailIntegrated: true,
    }
  })

  return NextResponse.json({
    gmailIntegrated: user?.gmailIntegrated || false
  })
}