import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { nextAuthConfig } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { geminiModel } from "@/lib/gemini"

export async function GET(request: Request) {
  const session = await getServerSession(nextAuthConfig)

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const agentId = searchParams.get('agentId')

  if (!agentId) {
    return NextResponse.json({ error: "Agent ID is required" }, { status: 400 })
  }

  try {
    // Get all previous questions and knowledge base entries for context
    const [previousQuestions, agent] = await Promise.all([
      prisma.knowledgeBaseQuestion.findMany({
        where: {
          agentId,
          userId: session.user.id,
        },
        select: {
          question: true,
          answer: true,
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.agent.findUnique({
        where: { id: agentId },
        include: {
          knowledgeBases: {
            include: {
              entries: true,
              coalescedSummary: true
            }
          }
        }
      })
    ])

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }

    const knowledgeBase = agent.knowledgeBases[0] // Assuming we're working with the first knowledge base

    // Create a comprehensive context for question generation
    const prompt = `You are an AI assistant helping to build a comprehensive knowledge base for a ${agent.type} agent.

Context:
Industry: ${knowledgeBase?.industry || 'Not specified'}
Use Case: ${knowledgeBase?.useCase || 'Not specified'}
Main Goals: ${knowledgeBase?.mainGoals?.join(', ') || 'Not specified'}
Capabilities: ${knowledgeBase?.coalescedSummary?.capabilities?.join(', ') || 'Not specified'}

Previous questions asked:
${previousQuestions.map(q => `- ${q.question}`).join('\n')}

Existing knowledge base entries:
${knowledgeBase?.entries.map(e => `- Q: ${e.question}\n  A: ${e.answer}`).join('\n') || 'No entries yet'}

Generate a new question that:
1. Has NOT been asked before (check previous questions carefully)
2. Is NOT semantically similar to any existing questions
3. Tests understanding of the agent's role and capabilities
4. Is specific to the industry and use case
5. Has a clear, verifiable answer
6. Increases in difficulty based on previous questions

Response format:
{
  "question": "your generated question",
  "answer": "detailed model answer that will be used to evaluate responses",
  "difficulty": number from 1-5 (increase based on previous questions),
  "points": number from 10-50 (based on difficulty: 1=10pts, 2=20pts, etc)
}

Ensure the question is completely unique and advances the knowledge base.`

    const result = await geminiModel.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    try {
      const generatedContent = JSON.parse(text.trim())

      // Validate the response structure
      if (!generatedContent.question || !generatedContent.answer || 
          !generatedContent.difficulty || !generatedContent.points) {
        throw new Error("Invalid response structure")
      }

      // Check for duplicate or similar questions using basic string comparison
      const isDuplicate = previousQuestions.some(q => 
        q.question.toLowerCase().includes(generatedContent.question.toLowerCase()) ||
        generatedContent.question.toLowerCase().includes(q.question.toLowerCase())
      )

      if (isDuplicate) {
        throw new Error("Generated question is too similar to existing questions")
      }

      // Save the question
      const savedQuestion = await prisma.knowledgeBaseQuestion.create({
        data: {
          question: generatedContent.question,
          answer: generatedContent.answer,
          difficulty: generatedContent.difficulty,
          points: generatedContent.points,
          agentId,
          userId: session.user.id
        }
      })

      const totalQuestions = previousQuestions.length + 1
      const progress = Math.min(100, (totalQuestions / 15) * 100) // 15 questions for completion

      return NextResponse.json({
        question: savedQuestion,
        progress,
        remainingQuestions: Math.max(0, 15 - totalQuestions)
      })

    } catch (parseError) {
      console.error('Error generating question:', {
        error: parseError,
        rawResponse: text
      })
      
      // Retry once with a simplified prompt if parsing fails
      return NextResponse.json(
        { error: "Failed to generate a unique question. Please try again." },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error in question generation:', error)
    return NextResponse.json(
      { error: "Failed to generate question" },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const { agentId, userId } = await req.json();

    // First get the agent to know its type
    const agent = await prisma.agent.findUnique({
      where: { id: agentId }
    });

    if (!agent) {
      return NextResponse.json(
        { error: "Agent not found" },
        { status: 404 }
      );
    }

    // Generate a question using Gemini
    const prompt = `You are a ${agent.type}. Generate a challenging question related to your role. 
                   The question should test knowledge and critical thinking. 
                   Format the response as JSON with the following structure:
                   {
                     "question": "the question text",
                     "answer": "the correct answer",
                     "difficulty": number between 1-5,
                     "points": number between 1-10 based on difficulty
                   }`;

    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse the JSON response
    const generatedContent = JSON.parse(text);

    // Create the question in the database
    const question = await prisma.knowledgeBaseQuestion.create({
      data: {
        question: generatedContent.question,
        answer: generatedContent.answer,
        difficulty: generatedContent.difficulty,
        points: generatedContent.points,
        agentId,
        userId,
      },
    });

    return NextResponse.json(question);
  } catch (error) {
    console.error("Error generating question:", error);
    return NextResponse.json(
      { error: "Failed to generate question" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const { questionId, userAnswer } = await req.json();

    const question = await prisma.knowledgeBaseQuestion.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    // Use Gemini to evaluate the answer
    const prompt = `Question: ${question.question}
                   Correct Answer: ${question.answer}
                   User Answer: ${userAnswer}
                   
                   Evaluate the user's answer and provide a score from 0 to ${question.points} 
                   based on accuracy and completeness. Return only the numeric score.`;

    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    const score = parseInt(response.text().trim());

    // Update the question with the score
    const updatedQuestion = await prisma.knowledgeBaseQuestion.update({
      where: { id: questionId },
      data: {
        score,
        pointsEarned: score,
      },
    });

    return NextResponse.json(updatedQuestion);
  } catch (error) {
    console.error("Error evaluating answer:", error);
    return NextResponse.json(
      { error: "Failed to evaluate answer" },
      { status: 500 }
    );
  }
} 