"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/app/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Alert, AlertDescription } from "@/app/components/ui/alert"
import { AlertCircle, CheckCircle2, Brain } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { KnowledgeBaseCreation } from "@/app/components/KnowledgeBaseCreation"

interface Agent {
  id: string
  name: string
  type: string
  status: 'active' | 'inactive'
  lastActive: string
}

export default function KnowledgeBasePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedAgent, setSelectedAgent] = useState<string>("")
  const [isCreating, setIsCreating] = useState(false)
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
      if (!response.ok) {
        throw new Error("Failed to fetch agents")
      }
      const data = await response.json()
      
      if (Array.isArray(data)) {
        const filteredAgents = data.filter(agent => agent.type !== 'email')
        setAgents(filteredAgents)
      } else {
        throw new Error("Invalid response format")
      }
    } catch (error) {
      console.error('Error fetching agents:', error)
      setAlert({ 
        message: "Failed to fetch agents", 
        type: 'error' 
      })
    }
  }

  const handleCreationComplete = () => {
    setIsCreating(false)
    setAlert({
      message: "Knowledge base created successfully",
      type: 'success'
    })
    router.refresh()
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
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Select Agent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an agent" />
                </SelectTrigger>
                <SelectContent>
                  {agents.map(agent => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name} - Last active: {new Date(agent.lastActive).toLocaleDateString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {selectedAgent && !isCreating && (
                <Button 
                  onClick={() => setIsCreating(true)}
                  className="w-full"
                >
                  Create Knowledge Base
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {selectedAgent && isCreating && (
          <KnowledgeBaseCreation 
            agentId={selectedAgent}
            onComplete={handleCreationComplete}
          />
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