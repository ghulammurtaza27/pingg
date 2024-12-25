import { getServerSession } from "next-auth/next"
import { nextAuthConfig } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { GoogleGenerativeAI, GenerateContentResult } from "@google/generative-ai"
import { NextRequest } from 'next/server'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!)

type Props = {
  params: Promise<{
    id: string
  }>
}

export async function GET(
  request: NextRequest,
  { params }: Props
) {
  const { id } = await params

  try {
    const session = await getServerSession(nextAuthConfig)
    if (!session?.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const requestData = await prisma.request.findUnique({
      where: { id },
      include: {
        senderAgent: true,
        recipientAgent: true,
        analysis: true
      }
    })

    return Response.json({ request: requestData })
  } catch (error) {
    return Response.json({ error: 'Failed to fetch request' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: Props
) {
  const { id } = await params

  try {
    const session = await getServerSession(nextAuthConfig)
    if (!session?.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const requestData = await prisma.request.findUnique({
      where: { id },
      include: {
        senderAgent: true,
        recipientAgent: true,
        analysis: true
      }
    })

    if (!requestData) {
      return Response.json({ error: 'Request not found' }, { status: 404 })
    }

    const model = genAI.getGenerativeModel({ 
      model: "gemini-pro",
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.7,
        topP: 0.8,
        topK: 40
      }
    });


    const prompt = `
      Analyze this request and provide a detailed strategic report:

      Summary: ${requestData.summary}
      Considerations: ${requestData.considerations}

      Please provide an analysis including:
      1. Executive Summary
      2. Detailed Analysis including:
         - Competitive Analysis (in table format)
      3. Financial Implications
      4. Strategic Recommendations
      5. Implementation Roadmap
      6. Conclusion

      Format the response in clean markdown with proper headings and sections.
      For the Competitive Analysis, create a table with columns:
      Competitor | Strengths | Weaknesses | Market Share | Value Proposition | Threat Level
    `.trim();

    try {
      const result = await model.generateContent(prompt);
      
      if (!result || typeof result !== 'object' || !('response' in result) || typeof result.response.text !== 'function') {
        throw new Error('Invalid response from Gemini API');
      }
      
      const analysis = result.response.text();

      const updatedRequest = await prisma.request.update({
        where: { id },
        data: {
          analysis: {
            upsert: {
              create: {
                content: analysis,
                generatedAt: new Date()
              },
              update: {
                content: analysis,
                generatedAt: new Date()
              }
            }
          }
        },
        include: {
          senderAgent: true,
          recipientAgent: true,
          analysis: true
        }
      });

      return Response.json({ request: updatedRequest });
    } catch (error) {
      console.error('Analysis Error:', error);
      return Response.json({ 
        error: 'Failed to generate analysis',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Analysis Error:', error)
    return Response.json({ 
      error: 'Failed to generate analysis',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}