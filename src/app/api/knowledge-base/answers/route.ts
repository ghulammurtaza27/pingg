import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { nextAuthConfig } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { geminiModel } from "@/lib/gemini"

export async function POST(req: Request) {
  const session = await getServerSession(nextAuthConfig)

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { questionId, answer } = await req.json()

    if (!questionId || !answer) {
      return NextResponse.json(
        { error: "Question ID and answer are required" },
        { status: 400 }
      )
    }

    // Fetch the original question
    const question = await prisma.knowledgeBaseQuestion.findUnique({
      where: { id: questionId }
    })

    if (!question) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      )
    }

    // Evaluate the answer using Gemini
    const prompt = `You are evaluating a user's answer to a knowledge base question.

Question: ${question.question}
Correct Answer: ${question.answer}
User's Answer: ${answer}

Evaluate the answer and respond with a JSON object in this exact format:
{
  "score": <number between 0 and ${question.points}>,
  "feedback": "<brief explanation of the score>"
}

Base the score on accuracy, completeness, and understanding. Provide constructive feedback.`

    const result = await geminiModel.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    try {
      const evaluation = JSON.parse(text.trim())

      // Update the question with the user's answer and score
      const updatedQuestion = await prisma.knowledgeBaseQuestion.update({
        where: { id: questionId },
        data: {
          score: evaluation.score,
          pointsEarned: evaluation.score
        }
      })

      return NextResponse.json({
        pointsEarned: evaluation.score,
        feedback: evaluation.feedback,
        question: updatedQuestion
      })
    } catch (parseError) {
      console.error('Error parsing Gemini response:', text)
      throw new Error('Failed to parse AI response')
    }
  } catch (error) {
    console.error("Error processing answer:", error)
    return NextResponse.json(
      { error: "Failed to process answer" },
      { status: 500 }
    )
  }
} 