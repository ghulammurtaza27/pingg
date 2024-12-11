// relevance.ts
import { GoogleGenerativeAI } from '@google/generative-ai'

type KnowledgeBaseEntry = {
  content: string
}

type KnowledgeBaseSummary = {
  content: string
} | null

type FormattedKnowledgeBase = {
  entries: KnowledgeBaseEntry[]
  coalescedSummary: KnowledgeBaseSummary
  industry: string
  useCase: string
  mainGoals: string[]
}

// Check if API key exists
const apiKey = process.env.GOOGLE_AI_KEY
if (!apiKey) {
  console.warn('GOOGLE_AI_KEY is not set in environment variables')
}

const genAI = new GoogleGenerativeAI(apiKey || 'dummy-key')

export async function calculateRelevanceScore(
  summary: string,
  considerations: string,
  knowledgeBase: FormattedKnowledgeBase
): Promise<number> {
  // If no API key, return default score
  if (!apiKey) {
    console.warn('Skipping relevance calculation - No API key available')
    return 0.5
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

    const kbSummary = knowledgeBase.coalescedSummary?.content || 
      knowledgeBase.entries.map(e => e.content).join('\n').slice(0, 1000)

    const prompt = `
Task: Calculate a relevance score between 0 and 1 for a request based on an agent's knowledge.

Knowledge Base:
${kbSummary}

Request Details:
- Summary: ${summary}
- Considerations: ${considerations}

Instructions:
1. Analyze how well the request aligns with the knowledge base content
2. Consider both the summary and considerations
3. Return ONLY a single decimal number between 0 and 1
   - 0.8-1.0: Highly relevant
   - 0.5-0.7: Moderately relevant
   - 0.0-0.4: Low relevance

Response Format:
Return only the score as a decimal (e.g., 0.7)
`

    try {
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0,
          topK: 1,
          topP: 1,
          maxOutputTokens: 1024,
        },
      })

      const text = result.response.text().trim()
      const score = parseFloat(text)

      if (isNaN(score) || score < 0 || score > 1) {
        console.error('Invalid relevance score:', text || 'Unknown error')
        return 0.5 // Default to moderate relevance on error
      }

      return score

    } catch (modelError) {
      console.error('Error with model generation:', modelError instanceof Error ? modelError.stack : 'Unknown error')
      return 0.5 // Default to moderate relevance on model error
    }

  } catch (error) {
    console.error('Error calculating relevance score:', error instanceof Error ? error.stack : 'Unknown error')
    return 0.5 // Default to moderate relevance on error
  }
}