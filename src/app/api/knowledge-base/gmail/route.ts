import { NextResponse, NextRequest } from 'next/server'
import { getServerSession } from "next-auth/next"
import { nextAuthConfig } from "@/lib/auth"
import { google } from 'googleapis'
import { GoogleGenerativeAI } from "@google/generative-ai"
import { prisma } from "@/lib/prisma"

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!)

type ApiError = {
  message?: string;
  response?: {
    status?: number;
    data?: any;
  };
}

async function getGmailEmails(accessToken: string, refreshToken: string) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken
  })

  const gmail = google.gmail({ version: 'v1', auth: oauth2Client })
  
  try {
    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 10,
      q: 'in:inbox -category:promotions -category:social'
    })

    const emails = await Promise.all(
      (response.data.messages || []).map(async (message) => {
        const email = await gmail.users.messages.get({
          userId: 'me',
          id: message.id!,
          format: 'full'
        })
        
        return {
          id: email.data.id,
          subject: email.data.payload?.headers?.find(h => h.name === 'Subject')?.value || '',
          body: email.data.snippet || ''
        }
      })
    )

    return emails
  } catch (error) {
    console.error('Error fetching Gmail messages:', error)
    throw error
  }
}

async function analyzeEmailsForContext(emails: Array<{ subject: string; body: string }>, existingEntries: Array<{ question: string; answer: string }> = []) {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" })
  
  const analysisPrompt = `
    Study these emails and existing Q&A pairs to identify meaningful patterns about the user.
    Focus on understanding their activities, goals, and life context.

    For example, if you see job application responses, don't just repeat the email content.
    Instead, create questions like:
    - "What kind of career moves is this person making?"
    - "What industries or roles are they targeting?"
    - "What stage of their job search are they in?"

    Existing Knowledge:
    ${existingEntries.slice(0, 5).map(entry => `
      Q: ${entry.question}
      A: ${entry.answer}
    `).join('\n')}

    Recent Emails:
    ${emails.slice(0, 5).map(email => `
      Subject: ${email.subject}
      Content: ${email.body}
    `).join('\n')}

    Create 3-5 insightful questions and answers that reveal meaningful patterns about this person.
    Focus on understanding who they are and what's important in their life right now.
    
    Return ONLY a JSON array in this format:
    [
      {
        "question": "What significant activities or transitions is this person currently involved in?",
        "answer": "Based on the email patterns, they are..."
      }
    ]
  `.trim()

  try {
    const result = await model.generateContent(analysisPrompt)
    const response = await result.response.text()
    
    try {
      const cleaned = response
        .replace(/```json\s*|\s*```/g, '')
        .replace(/[\u201C\u201D]/g, '"')
        .trim()
      
      const parsed = JSON.parse(cleaned)
      
      if (!Array.isArray(parsed)) {
        throw new Error('Expected array of Q&A pairs')
      }

      // Validate and clean each Q&A pair
      const validPairs = parsed
        .filter(pair => pair?.question && pair?.answer)
        .map(pair => ({
          question: String(pair.question),
          answer: String(pair.answer)
        }))

      if (validPairs.length === 0) {
        throw new Error('No valid Q&A pairs generated')
      }

      return validPairs
    } catch (parseError) {
      console.error('Error parsing analysis response:', parseError)
      return null
    }
  } catch (error) {
    console.error('Error analyzing emails:', error)
    return null
  }
}

function cleanMarkdownJSON(text: string): string {
  // First, try to extract content between JSON code blocks
  const jsonBlockMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/)
  if (jsonBlockMatch) {
    return jsonBlockMatch[1].trim()
  }

  // If no code blocks, remove any markdown formatting and try to find JSON
  const cleaned = text.replace(/```[a-z]*\n?|\n?```/g, '').trim()
  const jsonMatch = cleaned.match(/(\{[\s\S]*?\})/)
  if (jsonMatch) {
    return jsonMatch[1].trim()
  }

  return cleaned
}

async function processEmailsInBatches(emails: Array<{ subject: string; body: string }>) {
  const batchSize = 2
  const delay = 2000
  const results = []

  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize)
    
    try {
      // Process one email at a time to avoid rate limits
      for (const email of batch) {
        try {
          const result = await processEmailContent(email)
          if (result) results.push(result)
          // Wait between each email
          await new Promise(resolve => setTimeout(resolve, 1000))
        } catch (error) {
          console.error('Error processing email:', error)
          // Continue with next email even if one fails
          continue
        }
      }
      
      if (i + batchSize < emails.length) {
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    } catch (error) {
      console.error('Error processing batch:', error)
      // Continue with next batch even if one fails
      continue
    }
  }

  return results
}

async function processEmailContent(email: { subject: string, body: string }) {
  if (!email.subject && !email.body) {
    console.log('Skipping empty email')
    return null
  }

  const model = genAI.getGenerativeModel({ model: "gemini-pro" })

  const prompt = `
    Create a Q&A pair from this email. Return ONLY a JSON object in this exact format:
    {"question": "...", "answer": "..."}

    Email Subject: ${email.subject || 'No subject'}
    Email Body: ${email.body || 'No content'}
  `.trim()

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response.text()
    
    try {
      const cleaned = cleanMarkdownJSON(response)
      const parsed = JSON.parse(cleaned)
      
      if (parsed?.question && parsed?.answer) {
        return {
          question: String(parsed.question),
          answer: String(parsed.answer)
        }
      }
      
      // If structure is invalid, create from email directly
      return {
        question: `What is the content of "${email.subject || 'this email'}"?`,
        answer: email.body.substring(0, 500)
      }
    } catch (parseError) {
      console.error('Error parsing response:', response)
      console.error('Parse error:', parseError)
      
      // Fallback to using email directly
      return {
        question: `What is the content of "${email.subject || 'this email'}"?`,
        answer: email.body.substring(0, 500)
      }
    }
  } catch (error) {
    const apiError = error as ApiError;
    
    if (apiError.message?.includes('429')) {
      console.error('Rate limit reached, using fallback');
      // Handle rate limit case
    } else {
      console.error('Error generating content:', apiError);
      // Handle other errors
    }

    return new Response(JSON.stringify({ 
      error: apiError.message || 'An unknown error occurred'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(nextAuthConfig)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's Gmail tokens
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        gmailAccessToken: true,
        gmailRefreshToken: true,
        gmailIntegrated: true
      }
    })

    if (!user?.gmailIntegrated || !user?.gmailAccessToken || !user?.gmailRefreshToken) {
      return NextResponse.json(
        { error: "Gmail not integrated or missing tokens" },
        { status: 401 }
      )
    }

    const { agentId } = await request.json()

    if (!agentId) {
      return NextResponse.json(
        { error: "Agent ID is required" },
        { status: 400 }
      )
    }

    // Verify agent exists and belongs to user
    const agent = await prisma.agent.findFirst({
      where: {
        id: agentId,
        userId: user.id
      }
    })

    if (!agent) {
      return NextResponse.json(
        { error: "Agent not found or unauthorized" },
        { status: 404 }
      )
    }

    // Fetch emails using stored tokens
    const emails = await getGmailEmails(user.gmailAccessToken, user.gmailRefreshToken)

    // Get existing knowledge base entries if any
    let existingKb = await prisma.knowledgeBase.findFirst({
      where: { agentId },
      include: { entries: true }
    })

    // Analyze emails and generate new insights
    const newInsights = await analyzeEmailsForContext(
      emails,
      existingKb?.entries || []
    )

    if (!newInsights) {
      throw new Error('Failed to generate insights from emails')
    }

    // Create or update knowledge base
    const knowledgeBase = await prisma.$transaction(async (tx) => {
      if (!existingKb) {
        return await tx.knowledgeBase.create({
          data: {
            agentId,
            industry: 'Email Communication',
            useCase: 'Gmail Integration',
            agent: {
              connect: { id: agentId }
            },
            entries: {
              create: newInsights
            }
          },
          include: { entries: true }
        })
      }

      // Add new insights to existing knowledge base
      await tx.knowledgeBaseEntry.createMany({
        data: newInsights.map(insight => ({
          knowledgeBaseId: existingKb.id,
          question: insight.question,
          answer: insight.answer
        }))
      })

      return await tx.knowledgeBase.findFirst({
        where: { id: existingKb.id },
        include: { entries: true }
      })
    })

    return NextResponse.json({ 
      success: true, 
      knowledgeBase,
      newInsights: newInsights.length
    })

  } catch (error) {
    console.error('Error processing Gmail messages:', error)
    return NextResponse.json(
      { 
        error: "Failed to process Gmail messages",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 