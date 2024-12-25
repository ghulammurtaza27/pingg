"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/app/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Alert, AlertDescription } from "@/app/components/ui/alert"
import { AlertCircle, CheckCircle2, Plus, Star } from "lucide-react"

type Agent = {
  id: string
  name: string
  status: string | null
  type: string
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

type AlertType = 'success' | 'error'

export default function AgentsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [agents, setAgents] = useState<Agent[]>([])
  const [alert, setAlert] = useState<{ message: string; type: AlertType } | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

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
      const response = await fetch("/api/agents/with-default")
      if (response.ok) {
        const data = await response.json()
        const filteredAgents = data.filter((agent: Agent) => agent.type !== 'email')
        setAgents(filteredAgents)
      } else {
        throw new Error("Failed to fetch agents")
      }
    } catch {
      setAlert({ message: "Failed to fetch agents", type: 'error' })
    }
  }

  const setDefaultAgent = async (agentId: string) => {
    if (isUpdating) return
    setIsUpdating(true)
    
    try {
      const response = await fetch("/api/agents/set-default", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId }),
      })

      if (!response.ok) throw new Error("Failed to update default agent")

      // Fetch fresh data instead of updating locally
      await fetchAgents()
      setAlert({ message: "Default agent updated", type: 'success' })
    } catch (error) {
      setAlert({ message: "Failed to update default agent", type: 'error' })
    } finally {
      setIsUpdating(false)
    }
  }

  if (status === "loading" || !session) {
    return null
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">AI Agents</h1>
        <Button onClick={() => router.push("/agents/new")}>
          <Plus className="mr-2 h-4 w-4" />
          New Agent
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent) => (
          <Card 
            key={agent.id} 
            className={`relative hover:shadow-lg transition-shadow ${
              agent.isDefault ? 'ring-2 ring-primary border-primary' : ''
            }`}
          >
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{agent.name}</CardTitle>
                  <CardDescription>Type: {agent.type}</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDefaultAgent(agent.id)}
                  disabled={isUpdating || agent.isDefault}
                  className={`${agent.isDefault ? 'text-primary' : 'hover:text-primary'}`}
                >
                  <Star 
                    className={`h-5 w-5 transition-all ${
                      agent.isDefault ? 'fill-current' : ''
                    }`} 
                  />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <span className={`text-sm font-medium ${
                    agent.status === 'active' ? 'text-green-500' : 'text-gray-500'
                  }`}>
                    {agent.status ? agent.status.charAt(0).toUpperCase() + agent.status.slice(1) : 'Unknown'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Created</span>
                  <span className="text-sm">
                    {new Date(agent.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {agent.isDefault && (
                  <div className="flex items-center justify-center mt-2 bg-primary/10 py-1 rounded-md">
                    <span className="text-xs text-primary font-medium">Default Agent</span>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => router.push(`/agents/${agent.id}`)}
              >
                View Details
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {agents.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No agents found. Create your first agent to get started.</p>
        </div>
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
  )
} 