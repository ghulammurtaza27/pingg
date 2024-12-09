import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { geminiModel } from "@/lib/gemini"
import { Session } from "next-auth"

interface CustomSession extends Session {
  user: {
    id: string
    email?: string | null
    name?: string | null
    image?: string | null
  }
}

function isValidSession(session: Session | null): session is CustomSession {
  return Boolean(
    session &&
    typeof session === 'object' &&
    'user' in session &&
    session.user &&
    typeof session.user === 'object' &&
    'id' in session.user &&
    typeof session.user.id === 'string'
  )
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)

  if (!isValidSession(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const agentId = searchParams.get('agentId')

  if (!agentId) {
    return NextResponse.json({ error: "Agent ID is required" }, { status: 400 })
  }

  try {
    // Get previous questions and answers for context
    const previousQA = await prisma.knowledgeBaseQuestion.findMany({
      where: {
        agentId,
        userId: session.user.id,
        answer: { not: null }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    })

    // Get agent details for context
    const agent = await prisma.agent.findUnique({
      where: { id: agentId }
    })

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }

    // Generate next question based on context
    const prompt = `You are an AI assistant helping to build a knowledge base for a ${agent.type} agent.
    Generate a new question that would help understand the agent's capabilities better.
    
    Previous questions asked:
    ${previousQA.map(qa => `- ${qa.question}`).join('\n')}
    
    Respond with a JSON object in this exact format:
    {
      "question": "your generated question",
      "answer": "the expected answer",
      "difficulty": 3,
      "points": 30
    }
    
    Make sure the response is valid JSON.`;

    const result = await geminiModel.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    try {
      // Parse the JSON response
      const generatedContent = JSON.parse(text.trim())

      // Validate the response structure
      if (!generatedContent.question || !generatedContent.answer || 
          !generatedContent.difficulty || !generatedContent.points) {
        throw new Error("Invalid response structure")
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

      const progress = (previousQA.length / 10) * 100 // Assuming 10 questions complete the knowledge base

      return NextResponse.json({
        question: savedQuestion,
        progress: Math.min(100, progress)
      })
    } catch (parseError) {
      console.error('Error parsing Gemini response:', text)
      throw new Error('Failed to parse AI response')
    }
  } catch (error) {
    console.error('Error generating question:', error)
    return NextResponse.json(
      { error: "Failed to generate question" },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const { agentId, userId } = await req.json();

    // Generate a question using Gemini
    const prompt = `You are ${agentType}. Generate a challenging question related to your role. 
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