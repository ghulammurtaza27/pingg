// src/app/api/gmail/fetch-emails/route.ts
import { getServerSession } from "next-auth/next";
import { nextAuthConfig } from "@/lib/auth";
import { google } from 'googleapis';
import { NextRequest } from 'next/server';
import { gmail_v1 } from 'googleapis';

type GmailMessage = gmail_v1.Schema$Message;

export async function GET(req: NextRequest) {
  const session = await getServerSession(nextAuthConfig);
  
  console.log('Session:', session);

  if (!session || !session.accessToken) {
    console.error('Unauthorized: No session or access token found');
    return new Response('Unauthorized', { status: 401 });
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    access_token: session.accessToken,
    refresh_token: session.refreshToken,
  });

  const now = Math.floor(Date.now() / 1000);
  const expiryDate = session.expires ? new Date(session.expires) : null;
  const expiryTimestamp = expiryDate ? Math.floor(expiryDate.getTime() / 1000) : 0;

  if (expiryTimestamp && expiryTimestamp < now) {
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      oauth2Client.setCredentials(credentials);
      console.log('Access token refreshed:', credentials.access_token);
    } catch (error) {
      console.error('Error refreshing access token:', error);
      return new Response('Unauthorized', { status: 401 });
    }
  }

  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  
  try {
    const result = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 10,
    });

    if (!result.data.messages) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    const emails = await Promise.all(result.data.messages.map(async (message: GmailMessage) => {
      if (!message.id) {
        return null;
      }
      
      const emailResponse = await gmail.users.messages.get({
        userId: 'me',
        id: message.id,
        format: 'full',
      });
      return emailResponse.data;
    }));

    // Filter out any null values from failed message fetches
    const validEmails = emails.filter((email): email is GmailMessage => email !== null);

    return new Response(JSON.stringify(validEmails), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error fetching emails:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json();
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    const result = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 20,
    });
    return new Response(JSON.stringify(result.data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error fetching emails:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

