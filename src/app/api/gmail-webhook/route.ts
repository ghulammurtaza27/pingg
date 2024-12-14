import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { google } from 'googleapis'

const gmail = google.gmail('v1')

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { emailId, userId } = data

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        gmailAccessToken: true,
        gmailRefreshToken: true,
        agents: {
          select: { id: true }
        }
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

    const response = await gmail.users.messages.get({
      auth,
      userId: 'me',
      id: emailId,
      format: 'full'
    })

    const email = response.data
    const subject = email.payload?.headers?.find(h => h.name === 'Subject')?.value || ''
    const body = email.snippet || ''

    if (user.agents[0]) {
      const request = await prisma.request.create({
        data: {
          summary: subject,
          considerations: body,
          status: 'pending',
          senderAgentId: user.agents[0].id,
          recipientAgentId: user.agents[0].id,
          userId: userId,
        }
      })

      return NextResponse.json({ success: true, request })
    }

    return NextResponse.json({ error: 'No agent found for user' }, { status: 400 })

  } catch (error) {
    console.error('Gmail webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 