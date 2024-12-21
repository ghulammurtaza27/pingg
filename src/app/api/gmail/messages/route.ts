import { NextResponse } from 'next/server'
import { getServerSession } from "next-auth/next"
import { nextAuthConfig } from "@/lib/auth"
import { google } from 'googleapis'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(nextAuthConfig)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        gmailAccessToken: true,
        gmailRefreshToken: true,
      }
    })

    if (!user?.gmailAccessToken) {
      return NextResponse.json({ error: "Gmail not connected" }, { status: 400 })
    }

    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    )

    auth.setCredentials({
      access_token: user.gmailAccessToken,
      refresh_token: user.gmailRefreshToken,
    })

    const gmail = google.gmail({ version: 'v1', auth })
    
    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 10 // Adjust as needed
    })

    const messages = await Promise.all(
      (response.data.messages || []).map(async (message) => {
        const fullMessage = await gmail.users.messages.get({
          userId: 'me',
          id: message.id as string,
        })

        const headers = fullMessage.data.payload?.headers
        const subject = headers?.find(h => h.name === 'Subject')?.value
        
        return {
          id: message.id,
          subject,
          snippet: fullMessage.data.snippet,
        }
      })
    )

    return NextResponse.json({ messages })

  } catch (error) {
    console.error('Error fetching emails:', error)
    return NextResponse.json({ error: "Failed to fetch emails" }, { status: 500 })
  }
}