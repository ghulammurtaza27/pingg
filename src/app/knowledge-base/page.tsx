"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/app/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Alert, AlertDescription } from "@/app/components/ui/alert"
import { AlertCircle, CheckCircle2, Brain } from "lucide-react"
import { Progress } from "@/app/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { Textarea } from "@/app/components/ui/textarea"

type Agent = {
  id: string
  name: string
}

type Question = {
  id: string
  question: string
  answer: string | null
  difficulty: number
  points: number
}

type AnswerResponse = {
  pointsEarned: number
  feedback: string
}

export default function KnowledgeBasePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedAgent, setSelectedAgent] = useState<string>("")
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [answer, setAnswer] = useState("")
  const [score, setScore] = useState(0)
  const [progress, setProgress] = useState(0)
  const [alert, setAlert] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      fetchAgents()
    }
  }, [session])

  const fetchAgents = async () => {
    try {
      const response = await fetch("/api/agents")
      if (response.ok) {
        const data = await response.json()
        setAgents(data)
      } else {
        throw new Error("Failed to fetch agents")
      }
    } catch {
      setAlert({ message: "Failed to fetch agents", type: 'error' })
    }
  }

  const fetchNextQuestion = useCallback(async () => {
    if (!selectedAgent) return
    
    try {
      const response = await fetch(`/api/knowledge-base/questions?agentId=${selectedAgent}`)
      if (response.ok) {
        const data = await response.json()
        setCurrentQuestion(data.question)
        setProgress(data.progress)
      } else {
        throw new Error("Failed to fetch next question")
      }
    } catch (error) {
      console.error('Error fetching next question:', error)
    }
  }, [selectedAgent])

  useEffect(() => {
    if (selectedAgent) {
      fetchNextQuestion()
    }
  }, [selectedAgent, fetchNextQuestion])

  const submitAnswer = async () => {
    if (!currentQuestion || !answer.trim()) return

    try {
      const response = await fetch("/api/knowledge-base/answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: currentQuestion.id,
          answer: answer.trim()
        })
      })

      if (response.ok) {
        const data: AnswerResponse = await response.json()
        setScore(prev => prev + data.pointsEarned)
        setAlert({ 
          message: `${data.feedback} (+${data.pointsEarned} points)`, 
          type: 'success' 
        })
        setAnswer("")
        fetchNextQuestion()
      } else {
        throw new Error("Failed to submit answer")
      }
    } catch {
      setAlert({ message: "Failed to submit answer", type: 'error' })
    }
  }

  if (status === "loading" || !session) {
    return null
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Knowledge Base Builder</h1>
          <div className="flex items-center gap-4">
            <Brain className="h-6 w-6" />
            <span className="text-xl font-semibold">Score: {score}</span>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Select Agent</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedAgent} onValueChange={setSelectedAgent}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an agent" />
              </SelectTrigger>
              <SelectContent>
                {agents.map(agent => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {selectedAgent && (
          <>
            <Progress value={progress} className="mb-6" />

            {currentQuestion && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex justify-between">
                    <span>Question {currentQuestion.difficulty}/5</span>
                    <span>{currentQuestion.points} points</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-lg">{currentQuestion.question}</p>
                  <Textarea
                    placeholder="Type your answer..."
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    rows={4}
                  />
                  <Button 
                    onClick={submitAnswer}
                    className="w-full"
                    disabled={!answer.trim()}
                  >
                    Submit Answer
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {alert && (
          <Alert
            variant={alert.type === 'error' ? 'destructive' : 'default'}
            className="fixed bottom-4 right-4 w-auto"
          >
            {alert.type === 'error' ? 
              <AlertCircle className="h-4 w-4" /> : 
              <CheckCircle2 className="h-4 w-4" />
            }
            <AlertDescription>{alert.message}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  )
} 