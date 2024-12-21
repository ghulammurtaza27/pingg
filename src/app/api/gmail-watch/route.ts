// src/app/api/gmail-watch/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { google } from 'googleapis'

export async function POST(request: Request) {
  try {
    const { userId } = await request.json()
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        gmailAccessToken: true,
        gmailRefreshToken: true
      }
    })

    if (!user || !user.gmailAccessToken) {
      return NextResponse.json({ error: 'User not found or Gmail not integrated' }, { status: 404 })
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

    // Set up Gmail push notifications
    const response = await gmail.users.watch({
      userId: 'me',
      requestBody: {
        labelIds: ['INBOX'],
        topicName: `projects/${process.env.GOOGLE_CLOUD_PROJECT}/topics/${process.env.PUBSUB_TOPIC}`,
      },
    })

    return NextResponse.json({ success: true, watchResponse: response.data })
  } catch (error) {
    console.error('Gmail watch setup error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}