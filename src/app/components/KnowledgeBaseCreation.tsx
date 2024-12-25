'use client'

import * as React from 'react'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, AlertCircle, HelpCircle, Loader2 } from "lucide-react"
import { Button } from '@/app/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Textarea } from '@/app/components/ui/textarea'
import { Alert, AlertDescription } from "@/app/components/ui/alert"
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
  source?: string
  sourceId?: string
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

const isValidIndex = (index: number, array: any[]): boolean => {
  return index >= 0 && index < array.length
}

const KnowledgeBaseCreation: React.FC<{ agentId: string; onComplete: () => void }> = ({ agentId, onComplete }) => {
  const [isInitialLoading, setIsInitialLoading] = useState(false)
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
  const [isAnswering, setIsAnswering] = useState(false)
  const [points, setPoints] = useState(0)
  const [showCelebration, setShowCelebration] = useState(false)
  const [emailEntries, setEmailEntries] = useState<Array<{
    id: string;
    question: string;
    answer: string;
    source: string;
    sourceId?: string;
  }>>([])
  const [alert, setAlert] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false)
  const [questionRetryCount, setQuestionRetryCount] = useState(0)
  const maxRetries = 3
  const [hasFetched, setHasFetched] = useState(false)

  const initializeNewConversation = async () => {
    try {
      setIsGeneratingQuestions(true)
      setError(null)

      // If we have existing conversation, handle follow-up questions
      if (conversation.length > 0) {
        const lastAnsweredIndex = conversation.findIndex(entry => !entry.answer)
        
        if (lastAnsweredIndex === -1) {
          // All questions are answered, generate new questions
          const lastEntry = conversation[conversation.length - 1]
          let followUpQuestions = []
          let retryCount = 0

          while (followUpQuestions.length === 0 && retryCount < maxRetries) {
            followUpQuestions = await generateFollowUpQuestions(
              lastEntry.question,
              lastEntry.answer
            )
            retryCount++
          }

          if (followUpQuestions.length === 0) {
            throw new Error('Failed to generate follow-up questions')
          }

          const newQuestions = await Promise.all(
            followUpQuestions.map(async (question: string) => {
              const suggestions = await generateAnswerSuggestions(question)
              return {
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                question,
                answer: '',
                suggestions
              }
            })
          )
          
          setConversation(prev => [...prev, ...newQuestions])
          setCurrentIndex(conversation.length)
        } else {
          setCurrentIndex(lastAnsweredIndex)
        }
      } else {
        // Initialize with first question
        let suggestions = []
        let retryCount = 0

        while (suggestions.length === 0 && retryCount < maxRetries) {
          suggestions = await generateAnswerSuggestions(INITIAL_QUESTION)
          retryCount++
        }

        if (suggestions.length === 0) {
          throw new Error('Failed to generate initial suggestions')
        }

        setConversation([{
          id: `initial-${Date.now()}`,
          question: INITIAL_QUESTION,
          answer: '',
          suggestions
        }])
        setCurrentIndex(0)
      }
      
      setShowKnowledgeBase(false)
      setQuestionRetryCount(0) // Reset retry count on success

    } catch (error) {
      console.error('Error initializing conversation:', error)
      setError('Failed to initialize conversation')
      
      // Implement retry logic
      if (questionRetryCount < maxRetries) {
        setQuestionRetryCount(prev => prev + 1)
        setTimeout(() => {
          initializeNewConversation()
        }, 1000 * (questionRetryCount + 1))
      }
    } finally {
      setIsGeneratingQuestions(false)
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

      return data.suggestions || []
    } catch (error) {
      console.error('Error generating suggestions:', error)
      return []
    }
  }

  useEffect(() => {
    const fetchExistingKnowledgeBase = async () => {
      if (hasFetched || !agentId) return
      
      setIsInitialLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/knowledge-base/get-by-agent?agentId=${agentId}`)
        const data = await response.json()

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
        setHasFetched(true)
      }
    }

    fetchExistingKnowledgeBase()
  }, [agentId, hasFetched])

  useEffect(() => {
    questionRefs.current = questionRefs.current.slice(0, conversation.length)
  }, [conversation])

  const handleAnswerSubmit = async () => {
    if (!currentAnswer.trim()) {
      setError("Please provide an answer")
      return
    }

    setError(null)
    setIsSubmitting(true)
    setIsAnswering(true)
    
    try {
      setIsSubmitting(true)
      
      const updatedConversation = [...conversation]
      updatedConversation[currentIndex] = {
        ...updatedConversation[currentIndex],
        answer: currentAnswer
      }

      // If no knowledgeBaseId exists, create new knowledge base
      if (!knowledgeBaseId) {
        const createResponse = await fetch('/api/knowledge-base/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            agentId,
            purpose: {
              industry: "General Knowledge",
              useCase: "Information Management",
              mainGoals: ["Collect and organize information"]
            },
            entries: [{
              question: updatedConversation[currentIndex].question,
              answer: currentAnswer,
              source: 'manual'
            }]
          })
        })

        const data = await createResponse.json()
        
        if (!createResponse.ok) {
          throw new Error(data.error || 'Failed to create knowledge base')
        }

        setKnowledgeBaseId(data.id)
        setKnowledgeBase(data)
      } else {
        // If knowledge base exists, update it
        await handleUpdate(updatedConversation)
      }

      setConversation(updatedConversation)
      setCurrentAnswer('')

      // Continue with generating new questions...
      if (currentIndex >= updatedConversation.length - 1) {
        setIsGeneratingQuestions(true)
        try {
          const followUpQuestions = await generateFollowUpQuestions(
            updatedConversation[currentIndex].question,
            currentAnswer
          )
          
          if (followUpQuestions && followUpQuestions.length > 0) {
            const newQuestions = await Promise.all(
              followUpQuestions.map(async (question: string) => {
                const suggestions = await generateAnswerSuggestions(question)
                return {
                  id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  question,
                  answer: '',
                  suggestions
                }
              })
            )
            
            setConversation(prev => [...prev, ...newQuestions])
            setCurrentIndex(updatedConversation.length)
          } else {
            setShowKnowledgeBase(true)
          }
        } finally {
          setIsGeneratingQuestions(false)
        }
      } else {
        setCurrentIndex(prev => prev + 1)
      }

      // Update progress and show celebration
      setProgress((currentIndex + 1) / updatedConversation.length * 100)
      setPoints(prev => prev + 10)
      setShowCelebration(true)
      setTimeout(() => setShowCelebration(false), 2000)

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

  const handleUpdate = async (updatedEntries: Array<{
    id: string;
    question: string;
    answer: string;
    source?: string;
  }>) => {
    setIsSubmitting(true)
    setError(null)

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
        throw new Error(errorData.error || 'Failed to update entries')
      }

      const data = await response.json()
      
      if (!data.success || !data.knowledgeBase) {
        throw new Error('Failed to update knowledge base')
      }

      // Update local state with the new entries
      setKnowledgeBase(data.knowledgeBase)
      setConversation(data.knowledgeBase.entries.filter((e: { source?: string }) => 
        e.source === 'manual' || !e.source
      ))
      
      setAlert({
        type: 'success',
        message: 'Successfully updated knowledge base'
      })

      return data.knowledgeBase

    } catch (error) {
      console.error('Error updating entries:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to update entries'
      setError(errorMessage)
      setAlert({
        type: 'error',
        message: errorMessage
      })
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleContinueAdding = () => {
    initializeNewConversation()
  }

  const handleGmailImport = async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/knowledge-base/gmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId,
          knowledgeBaseId
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to import Gmail messages')
      }

      const { knowledgeBase, processedEmails } = await response.json()
      
      setKnowledgeBase(knowledgeBase)
      setConversation(knowledgeBase.entries)
      setPoints(prev => prev + processedEmails)
      setShowCelebration(true)
      setTimeout(() => setShowCelebration(false), 2000)
      
      setAlert({
        message: `Successfully imported ${processedEmails} emails`,
        type: 'success'
      })
    } catch (error) {
      console.error('Error importing Gmail:', error)
      setError(error instanceof Error ? error.message : 'Failed to import Gmail messages')
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    return () => {
      setConversation([])
      setCurrentIndex(0)
      setError(null)
    }
  }, [])

  const currentEntry = conversation[currentIndex];
  const hasSuggestions = currentEntry?.suggestions && currentEntry.suggestions.length > 0;

  return (
    <div className="space-y-6">
      {showKnowledgeBase ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold">Knowledge Base</h2>
            <Button 
              onClick={handleGmailImport}
              variant="outline"
              disabled={isSubmitting}
              size="lg"
            >
              <Mail className="h-5 w-5 mr-2" />
              Import from Gmail
            </Button>
          </div>

          {alert && (
            <Alert variant={alert.type === 'success' ? 'default' : 'destructive'}>
              <AlertDescription>{alert.message}</AlertDescription>
            </Alert>
          )}

          <KnowledgeBaseDisplay 
            entries={[...conversation, ...emailEntries]}
            onUpdate={handleUpdate}
            onContinue={handleContinueAdding}
            onComplete={onComplete}
            knowledgeBaseId={knowledgeBaseId!}
            agentId={agentId}
          />
        </div>
      ) : (
        <>
          <Progress value={progress} className="w-full h-2" />
          <AnimatePresence mode="wait">
            {isGeneratingQuestions ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Generating New Questions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-col items-center justify-center p-8 space-y-4">
                      <div className="animate-spin text-2xl">⏳</div>
                      <p className="text-muted-foreground">
                        Analyzing your responses and preparing follow-up questions...
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Building Knowledge Base</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-4">
                      {conversation.slice(0, currentIndex).map((entry, index) => (
                        <motion.div
                          key={entry.id}
                          ref={(el: HTMLDivElement | null) => {
                            if (questionRefs.current) {
                              questionRefs.current[index] = el;
                            }
                          }}
                          className="p-4 bg-muted rounded-lg"
                        >
                          <p className="font-medium">{entry.question}</p>
                          <p className="mt-2 text-muted-foreground">{entry.answer}</p>
                        </motion.div>
                      ))}

                      {conversation[currentIndex] && (
                        <div className="p-4 bg-muted rounded-lg">
                          <div className="flex items-center justify-between mb-4">
                            <p className="font-medium">{currentEntry?.question}</p>
                            {hasSuggestions && (
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <HelpCircle className="h-5 w-5" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent align="end" className="w-[400px]">
                                  <div className="space-y-2">
                                    <h4 className="font-medium">Suggested Answers:</h4>
                                    <div className="space-y-2">
                                      {currentEntry?.suggestions?.map((suggestion, i) => (
                                        <div
                                          key={i}
                                          onClick={() => setCurrentAnswer(suggestion)}
                                          className="p-2 hover:bg-muted rounded cursor-pointer text-sm"
                                        >
                                          {suggestion}
                                        </div>
                                      ))}
                                    </div>
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
                            className="w-full"
                          />
                        </div>
                      )}
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
                        disabled={isSubmitting || !isValidIndex(currentIndex, conversation)}
                        className="min-w-[120px]"
                      >
                        {isSubmitting ? (
                          <div className="flex items-center space-x-2">
                            <span>Submitting</span>
                            <div className="animate-spin">⏳</div>
                          </div>
                        ) : 'Continue'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
          <FAQ />
        </>
      )}
      {showCelebration && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          className="absolute top-0 left-0 right-0 flex justify-center items-center"
        >
          <div className="text-2xl text-green-500">🎉 +10 Points!</div>
        </motion.div>
      )}
      <div>Total Points: {points}</div>
    </div>
  )
}

export { KnowledgeBaseCreation }