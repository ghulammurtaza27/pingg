"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/app/components/ui/button"
import { Card } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"
import { Progress } from "@/app/components/ui/progress"
import { Loader2, AlertCircle, Brain } from "lucide-react"
import { Alert, AlertDescription } from "@/app/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"

interface Agent {
  id: string
  name: string
}

interface KnowledgeBase {
  id: string
  agentId: string
  agentName: string
  industry: string
  useCase: string
  mainGoals: string[]
  coalesced: boolean
  entries: Array<{
    id: string
    question: string
    answer: string
  }>
  coalescedSummary: {
    id: string
    summary: string
    capabilities: string[]
    useCases: string[]
    limitations: string[]
    additionalContext?: string | null
  } | null
}

export function KnowledgeBaseOverview({ detailed = false }: { detailed?: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [agents, setAgents] = useState<Agent[]>([])
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBase | null>(null)
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)

  useEffect(() => {

    fetchAgents()
  }, [])

  useEffect(() => {

    if (selectedAgentId) {
      fetchKnowledgeBase()
    } else {

      setLoading(false)
    }
  }, [selectedAgentId])

  async function fetchAgents() {
    try {
      const response = await fetch("/api/agents")
      const data = await response.json()
   

      if (Array.isArray(data)) {
        const formattedAgents = data.map(agent => ({
          id: agent.id,
          name: agent.name
        }))
  
        setAgents(formattedAgents)
        
        if (data.length > 0) {
 
          setSelectedAgentId(data[0].id)
        } else {

          setLoading(false)
        }
      } else {
        console.error("Unexpected agents response format")
        setError("Failed to fetch agents")
        setLoading(false)
      }
    } catch (error) {
      console.error("Failed to fetch agents:", error)
      setError("Failed to fetch agents")
      setLoading(false)
    }
  }

  async function fetchKnowledgeBase() {

    try {
      setLoading(true)
      const url = selectedAgentId 
        ? `/api/knowledge-base?agentId=${selectedAgentId}`
        : "/api/knowledge-base"
      
      const response = await fetch(url)
      const data = await response.json()
      console.log("Knowledge base response:", data)

      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to fetch knowledge base")
      }

      if (data.success && data.data?.knowledgeBase) {
        const kb = data.data.knowledgeBase
        console.log("Setting knowledge base:", kb)
        setKnowledgeBase({
          id: kb.id,
          agentId: kb.agentId,
          agentName: kb.agentName,
          industry: kb.industry,
          useCase: kb.useCase,
          mainGoals: kb.mainGoals || [],
          coalesced: kb.coalesced,
          entries: kb.entries || [],
          coalescedSummary: kb.coalescedSummary
        })
      } else {
        console.log("No knowledge base found, setting to null")
        setKnowledgeBase(null)
      }
    } catch (error) {
      console.error("Fetch error:", error)
      setError(error instanceof Error ? error.message : "Failed to fetch knowledge base")
    } finally {
      console.log("Setting loading to false")
      setLoading(false)
    }
  }

  console.log("Current state:", { loading, error, selectedAgentId, agentsCount: agents.length, hasKnowledgeBase: !!knowledgeBase })

  if (loading) {
    return <div className="flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <Select
          value={selectedAgentId || ""}
          onValueChange={setSelectedAgentId}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select an agent" />
          </SelectTrigger>
          <SelectContent>
            {agents.map((agent) => (
              <SelectItem 
                key={agent.id} 
                value={agent.id}
              >
                {agent.name} {agent.status === 'inactive' && '(inactive)'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!knowledgeBase ? (
        <div className="text-center space-y-4">
          <Brain className="h-12 w-12 mx-auto text-muted-foreground" />
          <div>
            <p className="text-muted-foreground">No knowledge base found for selected agent</p>
          </div>
        </div>
      ) : (
        // Rest of your existing render logic remains the same
        <>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="font-medium">{knowledgeBase.industry}</h3>
                <p className="text-sm text-muted-foreground">{knowledgeBase.useCase}</p>
              </div>
              <Button
                variant="outline"
                onClick={() => router.push("/knowledge-base")}
              >
                Manage
              </Button>
            </div>
            <Progress 
              value={knowledgeBase.coalesced ? 100 : (knowledgeBase.entries?.length > 0 ? 50 : 0)} 
            />
          </div>

          {detailed && knowledgeBase.coalescedSummary && (
            <div className="space-y-4">
              {/* Existing detailed view remains the same */}
              {knowledgeBase.mainGoals?.length > 0 && (
                <Card className="p-4">
                  <h4 className="font-medium mb-2">Main Goals</h4>
                  <div className="flex flex-wrap gap-2">
                    {knowledgeBase.mainGoals.map((goal, index) => (
                      <Badge key={index} variant="secondary">{goal}</Badge>
                    ))}
                  </div>
                </Card>
              )}
              {/* ... rest of the detailed cards remain unchanged ... */}
            </div>
          )}
        </>
      )}
    </div>
  )
} 