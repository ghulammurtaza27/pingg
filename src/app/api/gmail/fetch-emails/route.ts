// src/app/api/gmail/fetch-emails/route.ts
import { getServerSession } from "next-auth/next";
import { nextAuthConfig } from "@/lib/auth";
import { google } from 'googleapis';

export async function GET(req: Request) {
  const session = await getServerSession(nextAuthConfig);
  
  // Log the session to check if the access token is present
  console.log('Session:', session);

  // Check if the session exists and contains the access token
  if (!session || !session.accessToken) {
    console.error('Unauthorized: No session or access token found');
    return new Response('Unauthorized', { status: 401 });
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  // Set the credentials for the OAuth2 client
  oauth2Client.setCredentials({
    access_token: session.accessToken,
    refresh_token: session.refreshToken,
  });

  // Check if the access token is expired and refresh it if necessary
  const now = Math.floor(Date.now() / 1000);
  if (session.expires && session.expires < now) {
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      oauth2Client.setCredentials(credentials);
      // Update the session with the new access token
      // You may need to update the session in your database or state management
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

    // Fetch full details for each email
    const emails = await Promise.all(result.data.messages.map(async (message) => {
      const emailResponse = await gmail.users.messages.get({
        userId: 'me',
        id: message.id,
        format: 'full', // Get full details of the email
      });
      return emailResponse.data;
    }));

    return new Response(JSON.stringify(emails), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error fetching emails:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

export async function POST(req: Request) {
  const { code } = await req.json();
  try {
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);
    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
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
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

