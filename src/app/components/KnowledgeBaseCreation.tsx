'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/app/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Textarea } from '@/app/components/ui/textarea'
import { Alert, AlertDescription } from "@/app/components/ui/alert"
import { AlertCircle, HelpCircle } from "lucide-react"
import { Progress } from "@/app/components/ui/progress"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover"
import { KnowledgeBaseDisplay } from './KnowledgeBaseDisplay'
import { FAQ } from './FAQ'

type Conversation = {
  id: string
  question: string
  answer: string
  followUpQuestions?: string[]
  suggestions?: string[]
}

type KnowledgeBase = {
  id: string
  coalesced: boolean
  agentId: string
  industry?: string
  useCase?: string
  mainGoals?: string[]
  entries?: Array<{
    id: string
    question: string
    answer: string
    followUpQuestions?: string[]
  }>
  createdAt: Date
  updatedAt: Date
}

const INITIAL_QUESTION = "What is the primary purpose of this system?"

export function KnowledgeBaseCreation({ agentId, onComplete }: { agentId: string, onComplete: () => void }) {
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [conversation, setConversation] = useState<Conversation[]>([])
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [knowledgeBaseId, setKnowledgeBaseId] = useState<string | null>(null)
  const [showKnowledgeBase, setShowKnowledgeBase] = useState(true)
  const questionRefs = useRef<(HTMLDivElement | null)[]>([])
  const [isCoalesced, setIsCoalesced] = useState(false)
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBase | null>(null)

  const initializeNewConversation = async () => {
    try {
      // Generate initial suggestions for the first question
      const suggestions = await generateAnswerSuggestions(INITIAL_QUESTION)
      
      // Initialize with the first question
      setConversation([{
        id: '0',
        question: INITIAL_QUESTION,
        answer: '',
        suggestions
      }])
      
      setCurrentIndex(0)
      setShowKnowledgeBase(false)
    } catch (error) {
      console.error('Error initializing conversation:', error)
      setError('Failed to initialize conversation')
    }
  }

  const generateFollowUpQuestions = async (currentQuestion: string, answer: string) => {
    try {
      const response = await fetch('/api/knowledge-base/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentQuestion,
          answer,
          previousConversation: conversation.slice(0, currentIndex + 1)
        })
      })

      if (!response.ok) throw new Error('Failed to generate follow-up questions')
      
      const { questions } = await response.json()
      return questions
    } catch (error) {
      console.error('Error generating questions:', error)
      return []
    }
  }

  const generateAnswerSuggestions = async (question: string) => {
    try {
      console.log('Generating suggestions for:', question)
      const response = await fetch('/api/knowledge-base/generate-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Suggestions API error:', errorData)
        return []
      }

      const data = await response.json()
      console.log('Received suggestions:', data.suggestions)
      return data.suggestions || []
    } catch (error) {
      console.error('Error generating suggestions:', error)
      return []
    }
  }

  useEffect(() => {
    const fetchExistingKnowledgeBase = async () => {
      if (!agentId) {
        console.log('Client: No agent ID provided')
        setError('Agent ID is required')
        setIsInitialLoading(false)
        return
      }
      
      setIsInitialLoading(true)
      setError(null)

      try {
        console.log('Client: Fetching knowledge base for agent:', agentId)
        
        const response = await fetch(`/api/knowledge-base/get?agentId=${agentId}`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        })

        const data = await response.json()
        console.log('Client: Received data:', data)

        if (!response.ok) {
          throw new Error(data.error?.message || `HTTP error! status: ${response.status}`)
        }

        if (data.data?.knowledgeBase) {
          setKnowledgeBaseId(data.data.knowledgeBase.id)
          setKnowledgeBase(data.data.knowledgeBase)
          setConversation(data.data.knowledgeBase.entries || [])
          setShowKnowledgeBase(true)
          setIsCoalesced(data.data.knowledgeBase.coalesced || false)
        } else {
          await initializeNewConversation()
        }

      } catch (error) {
        console.error('Fetch error:', error)
        setError(error instanceof Error ? error.message : 'Failed to load knowledge base')
        await initializeNewConversation()
      } finally {
        setIsInitialLoading(false)
      }
    }

    fetchExistingKnowledgeBase()
  }, [agentId])

  useEffect(() => {
    questionRefs.current = questionRefs.current.slice(0, conversation.length)
  }, [conversation])

  if (isInitialLoading) {
    return <div>Loading knowledge base...</div>
  }

  if (error) {
    return (
      <div className="text-red-500">
        Error loading knowledge base: {error}
        <button 
          onClick={() => window.location.reload()}
          className="ml-4 text-blue-500 underline"
        >
          Retry
        </button>
      </div>
    )
  }

  const handleAnswerSubmit = async () => {
    if (!currentAnswer.trim()) {
      setError("Please provide an answer")
      return
    }

    setError(null)
    setIsSubmitting(true)
    
    try {
      const updatedConversation = [...conversation]
      updatedConversation[currentIndex] = {
        ...updatedConversation[currentIndex],
        answer: currentAnswer
      }

      let followUpQuestions: string[] = []
      try {
        followUpQuestions = await generateFollowUpQuestions(
          updatedConversation[currentIndex].question,
          currentAnswer
        )
      } catch (error) {
        console.error('Error generating follow-up questions:', error)
        // Continue without follow-up questions
      }

      if (followUpQuestions && followUpQuestions.length > 0) {
        for (const question of followUpQuestions) {
          const suggestions = await generateAnswerSuggestions(question)
          
          updatedConversation.push({
            id: `${currentIndex + 1}-${updatedConversation.length}`,
            question,
            answer: "",
            followUpQuestions: [],
            suggestions
          })
        }
      }

      const response = await fetch('/api/knowledge-base/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId,
          knowledgeBaseId,
          conversation: updatedConversation,
          currentAnswer,
          currentQuestion: conversation[currentIndex].question
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update knowledge base')
      }
      
      const { knowledgeBase } = await response.json()
      setKnowledgeBaseId(knowledgeBase.id)

      setConversation(updatedConversation)
      setCurrentAnswer('')
      setCurrentIndex(prev => prev + 1)
      setProgress((currentIndex + 1) / updatedConversation.length * 100)

    } catch (error) {
      console.error('Error in handleAnswerSubmit:', error)
      setError(error instanceof Error ? error.message : "Failed to process answer")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFinish = () => {
    setShowKnowledgeBase(true)
  }

  const handleUpdateKnowledgeBase = async (updatedEntries: KnowledgeBaseEntry[]) => {
    try {
      const response = await fetch('/api/knowledge-base/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId,
          knowledgeBaseId,
          entries: updatedEntries
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Failed to update knowledge base:', errorData)
        throw new Error(errorData.error || 'Unknown error')
      }
      
      const { knowledgeBase } = await response.json()
      setConversation(knowledgeBase.entries)
    } catch (error) {
      console.error('Error updating knowledge base:', error)
      throw error
    }
  }

  const handleContinueAdding = () => {
    setShowKnowledgeBase(false)
  }

  return (
    <div className="space-y-6">
      {isInitialLoading ? (
        <div>Loading...</div>
      ) : (
        <>
          {showKnowledgeBase ? (
            <KnowledgeBaseDisplay 
              entries={knowledgeBase?.entries || conversation} 
              onUpdate={handleUpdateKnowledgeBase}
              onContinue={handleContinueAdding}
              onComplete={onComplete}
              knowledgeBaseId={knowledgeBaseId!}
            />
          ) : (
            <>
              <Progress value={progress} className="w-full h-2" />
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <Card>
                    <CardHeader>
                      <CardTitle>Building Knowledge Base</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-4">
                        {conversation.slice(0, currentIndex + 1).map((entry, index) => (
                          <div
                            key={entry.id}
                            ref={el => questionRefs.current[index] = el}
                            className="p-4 bg-muted rounded-lg opacity-75"
                          >
                            <p className="font-medium">{entry.question}</p>
                            <p className="mt-2 text-sm">{entry.answer}</p>
                          </div>
                        ))}

                        <div className="p-4 bg-muted rounded-lg">
                          <div className="flex items-center justify-between">
                            <p className="font-medium">{conversation[currentIndex]?.question}</p>
                            {conversation[currentIndex]?.suggestions && conversation[currentIndex].suggestions.length > 0 && (
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <HelpCircle className="h-4 w-4" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80">
                                  <div className="space-y-2">
                                    <h4 className="font-medium text-sm">Suggested Answers</h4>
                                    <ul className="text-sm space-y-1">
                                      {conversation[currentIndex].suggestions.map((suggestion, i) => (
                                        <li 
                                          key={i}
                                          className="p-2 hover:bg-muted rounded-sm cursor-pointer"
                                          onClick={() => setCurrentAnswer(suggestion)}
                                        >
                                          {suggestion}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            )}
                          </div>
                          <Textarea
                            value={currentAnswer}
                            onChange={(e) => setCurrentAnswer(e.target.value)}
                            placeholder="Type your answer here..."
                            rows={4}
                            className="mt-2"
                          />
                        </div>
                      </div>

                      {error && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      )}

                      <div className="flex justify-between">
                        <Button 
                          onClick={handleFinish} 
                          variant="secondary" 
                          disabled={isSubmitting}
                        >
                          Finish
                        </Button>
                        <Button 
                          onClick={handleAnswerSubmit} 
                          disabled={isSubmitting}
                          className="min-w-[120px]"
                        >
                          {isSubmitting ? (
                            <div className="flex items-center space-x-2">
                              <span>Submitting</span>
                              <div className="animate-spin">⏳</div>
                            </div>
                          ) : (
                            currentIndex === conversation.length - 1 ? 'Complete' : 'Continue'
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </AnimatePresence>
              <FAQ />
            </>
          )}
        </>
      )}
    </div>
  )
}