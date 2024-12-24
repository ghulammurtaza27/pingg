// AgentDetails.tsx
"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Alert, AlertDescription } from "@/app/components/ui/alert"
import { AlertCircle, ArrowLeft } from "lucide-react"

interface Agent {
  id: string
  name: string
  status?: 'active' | 'inactive'
  type: string
  lastActive?: string
  createdAt: string
  updatedAt: string
}

interface AgentDetailsProps {
  id: string
}

export default function AgentDetails({ id }: AgentDetailsProps) {
  const { data: session, status: authStatus } = useSession()
  const router = useRouter()
  const [agent, setAgent] = useState<Agent | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/login")
    }
  }, [authStatus, router])

  useEffect(() => {
    const fetchAgentDetails = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/agents/${id}`)
        if (!response.ok) {
          throw new Error("Failed to fetch agent details")
        }
        const data = await response.json()
        setAgent(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch agent details")
      } finally {
        setIsLoading(false)
      }
    }

    if (session && id) {
      fetchAgentDetails()
    }
  }, [session, id])

  if (authStatus === "loading" || !session || isLoading) {
    return <div className="container mx-auto py-8">Loading...</div>
  }

  return (
    <div className="container mx-auto py-8">
      <Button 
        variant="ghost" 
        onClick={() => router.push("/agents")}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Agents
      </Button>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {agent && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">{agent.name}</h1>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              agent.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {agent.status ? 
                agent.status.charAt(0).toUpperCase() + agent.status.slice(1) : 
                'Unknown'
              }
            </span>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Agent Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium">{agent.type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Active</p>
                  <p className="font-medium">
                    {agent.lastActive ? new Date(agent.lastActive).toLocaleString() : 'Never'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">{new Date(agent.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="font-medium">{new Date(agent.updatedAt).toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}