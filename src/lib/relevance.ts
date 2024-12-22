// relevance.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import natural from 'natural';
import nlp from 'compromise';
import { uniq } from 'lodash';

// Original types (unchanged for compatibility)
export type KnowledgeBaseEntry = {
  content: string;
};

export type KnowledgeBaseSummary = {
  content: string;
} | null;

export type FormattedKnowledgeBase = {
  entries: KnowledgeBaseEntry[];
  coalescedSummary: KnowledgeBaseSummary;
  industry: string;
  useCase: string;
  mainGoals: string[];
};

// Enhanced internal types
interface TextAnalysis {
  keywords: string[];
  entities: string[];
  concepts: string[];
  technicalTerms: string[];
  sentiment: number;
  complexity: number;
}

interface DetailedScore {
  contentAlignment: number;
  technicalLevelMatch: number;
  domainRelevance: number;
  contextualFit: number;
  explanation: string;
}

// Initialize NLP tools
const tokenizer = new natural.WordTokenizer();
const tfidf = new natural.TfIdf();
const stemmer = natural.PorterStemmer;
const sentimentAnalyzer = new natural.SentimentAnalyzer(
  'English',
  stemmer,
  'afinn'
);

// Technical terms dictionary
const technicalTerms = new Set([
  'api', 'implementation', 'architecture', 'database', 'algorithm',
  'optimization', 'security', 'infrastructure', 'framework', 'protocol',
  'middleware', 'runtime', 'compiler', 'deployment', 'authentication',
  'authorization', 'encryption', 'scalability', 'redundancy', 'latency'
]);

// Validation function
function validateScoreObject(obj: any): DetailedScore | null {
  if (typeof obj !== 'object' || obj === null) return null;

  const isValidScore = (score: any): boolean => 
    typeof score === 'number' && score >= 0 && score <= 1;

  if (!isValidScore(obj.contentAlignment) ||
      !isValidScore(obj.technicalLevelMatch) ||
      !isValidScore(obj.domainRelevance) ||
      !isValidScore(obj.contextualFit) ||
      typeof obj.explanation !== 'string') {
    return null;
  }

  return {
    contentAlignment: obj.contentAlignment,
    technicalLevelMatch: obj.technicalLevelMatch,
    domainRelevance: obj.domainRelevance,
    contextualFit: obj.contextualFit,
    explanation: obj.explanation
  };
}

class NLPAnalyzer {
  private static readonly TECHNICAL_WEIGHT = 1.5;
  private static readonly DOMAIN_WEIGHT = 2.0;
  
  static analyzeSimilarity(text1: string, text2: string): number {
    const tokens1 = new Set(tokenizer.tokenize(text1.toLowerCase()));
    const tokens2 = new Set(tokenizer.tokenize(text2.toLowerCase()));
    const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
    const union = new Set([...tokens1, ...tokens2]);
    return intersection.size / union.size;
  }

  static extractEntities(text: string): string[] {
    const doc = nlp(text);
    return uniq([
      ...doc.people().out('array'),
      ...doc.places().out('array'),
      ...doc.organizations().out('array')
    ]);
  }

  static calculateComplexity(text: string): number {
    const sentences = text.split(/[.!?]+/);
    const words = tokenizer.tokenize(text);
    const avgWordsPerSentence = words.length / sentences.length;
    const complexWords = words.filter(word => word.length > 8).length;
    const complexityScore = (avgWordsPerSentence * 0.5) + 
                          (complexWords / words.length * 0.5);
    return Math.min(complexityScore, 1);
  }

  static extractKeywords(text: string, topN: number = 10): string[] {
    tfidf.addDocument(text);
    const terms = new Set<string>();
    
    // Get TF-IDF scores
    tfidf.listTerms(0).forEach(item => {
      if (item.term.length > 3) {
        terms.add(item.term);
      }
    });

    // Add named entities
    const entities = this.extractEntities(text);
    entities.forEach(entity => terms.add(entity.toLowerCase()));

    // Add technical terms
    const words = tokenizer.tokenize(text.toLowerCase());
    words.forEach(word => {
      if (technicalTerms.has(word)) {
        terms.add(word);
      }
    });

    return Array.from(terms).slice(0, topN);
  }

  static analyzeText(text: string): TextAnalysis {
    const doc = nlp(text);
    const tokens = tokenizer.tokenize(text.toLowerCase());
    
    return {
      keywords: this.extractKeywords(text),
      entities: this.extractEntities(text),
      concepts: doc.topics().out('array'),
      technicalTerms: tokens.filter(word => technicalTerms.has(word)),
      sentiment: sentimentAnalyzer.getSentiment(tokens),
      complexity: this.calculateComplexity(text)
    };
  }
}

class RelevanceAnalyzer {
  private static readonly WEIGHTS = {
    contentAlignment: 0.35,
    technicalLevelMatch: 0.20,
    domainRelevance: 0.25,
    contextualFit: 0.20,
  };

  private static calculateVariance(numbers: number[]): number {
    const mean = numbers.reduce((acc, val) => acc + val, 0) / numbers.length;
    const squareDiffs = numbers.map(value => Math.pow(value - mean, 2));
    return Math.sqrt(squareDiffs.reduce((acc, val) => acc + val, 0) / numbers.length);
  }

  static calculateContentAlignment(
    requestAnalysis: TextAnalysis,
    kbAnalysis: TextAnalysis
  ): number {
    const keywordSimilarity = NLPAnalyzer.analyzeSimilarity(
      requestAnalysis.keywords.join(' '),
      kbAnalysis.keywords.join(' ')
    );

    const conceptSimilarity = NLPAnalyzer.analyzeSimilarity(
      requestAnalysis.concepts.join(' '),
      kbAnalysis.concepts.join(' ')
    );

    const entitySimilarity = NLPAnalyzer.analyzeSimilarity(
      requestAnalysis.entities.join(' '),
      kbAnalysis.entities.join(' ')
    );

    return (keywordSimilarity * 0.4) + 
           (conceptSimilarity * 0.4) + 
           (entitySimilarity * 0.2);
  }

  static calculateTechnicalMatch(
    requestAnalysis: TextAnalysis,
    kbAnalysis: TextAnalysis
  ): number {
    const techTermSimilarity = NLPAnalyzer.analyzeSimilarity(
      requestAnalysis.technicalTerms.join(' '),
      kbAnalysis.technicalTerms.join(' ')
    );

    const complexityDiff = Math.abs(
      requestAnalysis.complexity - kbAnalysis.complexity
    );

    return (techTermSimilarity * 0.6) + 
           ((1 - complexityDiff) * 0.4);
  }

  static calculateFinalScore(breakdown: DetailedScore): number {
    return Object.entries(this.WEIGHTS)
      .reduce((acc, [key, weight]) => {
        return acc + (breakdown[key as keyof typeof this.WEIGHTS] * weight);
      }, 0);
  }

  static calculateConfidence(breakdown: DetailedScore): number {
    const scores = Object.entries(this.WEIGHTS)
      .map(([key]) => breakdown[key as keyof typeof this.WEIGHTS]);
    const variance = this.calculateVariance(scores);
    return 1 - Math.min(variance * 2, 0.5);
  }
}

// Main exported function (maintains original interface)
export async function calculateRelevanceScore(
  summary: string,
  considerations: string,
  knowledgeBase: FormattedKnowledgeBase
): Promise<number> {
  const apiKey = process.env.GOOGLE_API_KEY;
  
  if (!apiKey) {
    console.warn('Skipping relevance calculation - No API key available');
    return 0.5;
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Analyze request and knowledge base
    const requestText = `${summary} ${considerations}`;
    const kbText = knowledgeBase.coalescedSummary?.content || 
      knowledgeBase.entries.map(e => e.content).join('\n').slice(0, 1500);

    const requestAnalysis = NLPAnalyzer.analyzeText(requestText);
    const kbAnalysis = NLPAnalyzer.analyzeText(kbText);

    // Enhanced prompt with NLP analysis
    const prompt = `
Task: Analyze the relevance between a request and an agent's knowledge base.
Return a JSON object with the following scores (0-1) and explanation:

Knowledge Base Analysis:
- Keywords: ${kbAnalysis.keywords.join(', ')}
- Key Concepts: ${kbAnalysis.concepts.join(', ')}
- Technical Terms: ${kbAnalysis.technicalTerms.join(', ')}
- Complexity Level: ${kbAnalysis.complexity}

Industry: ${knowledgeBase.industry}
Use Case: ${knowledgeBase.useCase}
Main Goals: ${knowledgeBase.mainGoals.join(', ')}

Request Analysis:
- Summary: ${summary}
- Considerations: ${considerations}
- Keywords: ${requestAnalysis.keywords.join(', ')}
- Key Concepts: ${requestAnalysis.concepts.join(', ')}
- Technical Terms: ${requestAnalysis.technicalTerms.join(', ')}
- Complexity Level: ${requestAnalysis.complexity}

Pre-calculated Metrics:
- Content Similarity: ${RelevanceAnalyzer.calculateContentAlignment(requestAnalysis, kbAnalysis)}
- Technical Match: ${RelevanceAnalyzer.calculateTechnicalMatch(requestAnalysis, kbAnalysis)}

Response Format:
{
  "contentAlignment": <score>,
  "technicalLevelMatch": <score>,
  "domainRelevance": <score>,
  "contextualFit": <score>,
  "explanation": "<explanation>"
}
`;

    // Try up to 3 times to get a valid response
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            topK: 1,
            topP: 1,
            maxOutputTokens: 1024,
          },
        });

        const text = result.response.text();
        const parsed = JSON.parse(text);
        const validatedScore = validateScoreObject(parsed);
        
        if (validatedScore === null) {
          if (attempt === 2) {
            console.error('Invalid score format after all retries');
            return 0.5;
          }
          continue;
        }
        
        return RelevanceAnalyzer.calculateFinalScore(validatedScore);
      } catch (parseError) {
        if (attempt === 2) {
          console.error('Failed to parse LLM response after retries:', parseError);
          return 0.5;
        }
        console.warn(`Retry ${attempt + 1}: Invalid response format`);
        continue;
      }
    }

    return 0.5;

  } catch (error) {
    console.error('Error calculating relevance score:', 
      error instanceof Error ? error.stack : 'Unknown error'
    );
    return 0.5;
  }
}

// Optional enhanced interface
export async function calculateDetailedRelevanceScore(
  summary: string,
  considerations: string,
  knowledgeBase: FormattedKnowledgeBase
): Promise<{
  score: number;
  breakdown: DetailedScore;
  confidence: number;
  analysis: {
    request: TextAnalysis;
    knowledgeBase: TextAnalysis;
  };
}> {
  const score = await calculateRelevanceScore(summary, considerations, knowledgeBase);
  
  if (score === 0.5 && !process.env.GOOGLE_API_KEY) {
    return {
      score: 0.5,
      breakdown: {
        contentAlignment: 0.5,
        technicalLevelMatch: 0.5,
        domainRelevance: 0.5,
        contextualFit: 0.5,
        explanation: 'No API key available - using default scores',
      },
      confidence: 0,
      analysis: {
        request: {
          keywords: [],
          entities: [],
          concepts: [],
          technicalTerms: [],
          sentiment: 0,
          complexity: 0,
        },
        knowledgeBase: {
          keywords: [],
          entities: [],
          concepts: [],
          technicalTerms: [],
          sentiment: 0,
          complexity: 0,
        },
      },
    };
  }

  const requestText = `${summary} ${considerations}`;
  const kbText = knowledgeBase.coalescedSummary?.content || 
    knowledgeBase.entries.map(e => e.content).join('\n');

  const requestAnalysis = NLPAnalyzer.analyzeText(requestText);
  const kbAnalysis = NLPAnalyzer.analyzeText(kbText);

  return {
    score,
    breakdown: {
      contentAlignment: RelevanceAnalyzer.calculateContentAlignment(requestAnalysis, kbAnalysis),
      technicalLevelMatch: RelevanceAnalyzer.calculateTechnicalMatch(requestAnalysis, kbAnalysis),
      domainRelevance: score, // Using LLM score as fallback
      contextualFit: score, // Using LLM score as fallback
      explanation: 'Score calculated using NLP analysis',
    },
    confidence: RelevanceAnalyzer.calculateConfidence({
      contentAlignment: score,
      technicalLevelMatch: score,
      domainRelevance: score,
      contextualFit: score,
      explanation: '',
    }),
    analysis: {
      request: requestAnalysis,
      knowledgeBase: kbAnalysis,
    },
  };
}