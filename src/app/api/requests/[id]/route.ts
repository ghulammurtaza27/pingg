import { getServerSession } from "next-auth/next"
import { nextAuthConfig } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)

export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  const { id } = await context.params

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
  request: Request,
  context: { params: { id: string } }
) {
  const { id } = await context.params

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

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })
    console.log(model);

    const prompt = `
      Analyze this request and provide a detailed strategic report:

      From: ${requestData.senderAgent.name}
      To: ${requestData.recipientAgent.name}
      Summary: ${requestData.summary}
      Considerations: ${requestData.considerations}

      Please provide a comprehensive analysis including:
      1. Executive Summary
      2. Detailed Analysis including:
         - Request Overview
         - Market Analysis
         - Competitive Analysis (in table format)
         - SWOT Analysis
      3. Risk Assessment
      4. Financial Implications
      5. Strategic Recommendations
      6. Implementation Roadmap
      7. Conclusion

      Format the response in clean markdown with proper headings and sections.
      For the Competitive Analysis, create a table with columns:
      Competitor | Strengths | Weaknesses | Market Share | Value Proposition | Threat Level
    `

    const result = await model.generateContent(prompt)
    const analysis = result.response.text()

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
    })

    return Response.json({ request: updatedRequest })
  } catch (error) {
    console.error('Analysis Error:', error)
    return Response.json({ 
      error: 'Failed to generate analysis',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 