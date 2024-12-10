import { nextAuthConfig } from "@/lib/auth"
import { getServerSession } from "next-auth/next"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await getServerSession(nextAuthConfig)
  return NextResponse.json(session)
}