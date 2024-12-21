import { google } from 'googleapis';
import { getServerSession } from 'next-auth/next';
import { nextAuthConfig } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { id } = await params;

  const session = await getServerSession(nextAuthConfig);
  
  if (!session || !session.accessToken) {
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

  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  try {
    const emailResponse = await gmail.users.messages.get({
      userId: 'me',
      id: id,
      format: 'full', // Get full details of the email
    });
    return new Response(JSON.stringify(emailResponse.data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error fetching email details:', error);
    const errorMessage = error.response ? error.response.data : error.message;
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
} 