import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from "@google/generative-ai"

const apiKey = process.env.GOOGLE_AI_API_KEY
const genAI = new GoogleGenerativeAI(apiKey || '')

export async function POST(request: Request) {
  try {
    const { currentQuestion, answer, previousConversation } = await request.json()

    const conversationContext = previousConversation
      .map((entry: any) => `Q: ${entry.question}\nA: ${entry.answer || '[Not answered yet]'}`)
      .join('\n')

    const prompt = `You are helping to build a knowledge base for an AI agent. Based on the following conversation, generate 2-3 relevant follow-up questions that will help expand the knowledge base.

Previous conversation:
${conversationContext}

Current question: ${currentQuestion}
Current answer: ${answer}

The follow-up questions should:
1. Build upon previous answers
2. Help clarify any ambiguities
3. Explore important related topics
4. Be specific and actionable

Return ONLY a JSON object with a "questions" array containing the questions as strings.
Example format: {"questions": ["Question 1?", "Question 2?", "Question 3?"]}
Do not include any markdown formatting or code block syntax.`

    const model = genAI.getGenerativeModel({ model: "gemini-pro" })
    const result = await model.generateContent(prompt)
    const response = await result.response.text()

    console.log('Gemini raw response:', response)

    try {
      const cleanedResponse = cleanMarkdownJSON(response)
      const parsedResponse = JSON.parse(cleanedResponse)

      if (!parsedResponse.questions || !Array.isArray(parsedResponse.questions)) {
        throw new Error('Invalid response format')
      }

      return NextResponse.json({ questions: parsedResponse.questions })
    } catch (parseError) {
      console.error('Error parsing response:', parseError)
      return NextResponse.json(
        { error: "Failed to parse generated questions" },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error generating questions:', error)
    return NextResponse.json({ error: "Failed to generate questions" }, { status: 500 })
  }
}

function cleanMarkdownJSON(text: string): string {
  return text.replace(/```[a-z]*\n?|\n?```/g, '').trim()
} 