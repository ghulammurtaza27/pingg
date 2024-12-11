"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/app/components/ui/button"
import { Card } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"
import { Progress } from "@/app/components/ui/progress"
import { Loader2, AlertCircle, Brain } from "lucide-react"
import { Alert, AlertDescription } from "@/app/components/ui/alert"

interface KnowledgeBase {
  id: string
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
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBase | null>(null)

  useEffect(() => {
    console.log("Component mounted")
    fetchKnowledgeBase()
  }, [])

  async function fetchKnowledgeBase() {
    try {
      console.log("Starting knowledge base fetch...")
      const response = await fetch("/api/knowledge-base")
      console.log("Response status:", response.status)
      
      const data = await response.json()
      console.log("Raw response data:", data)

      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to fetch knowledge base")
      }

      if (data.success && data.data?.knowledgeBase) {
        const kb = data.data.knowledgeBase
        console.log("Knowledge base data:", kb)
        
        setKnowledgeBase({
          id: kb.id,
          industry: kb.industry,
          useCase: kb.useCase,
          mainGoals: kb.mainGoals || [],
          coalesced: kb.coalesced,
          entries: kb.entries || [],
          coalescedSummary: kb.coalescedSummary
        })
        console.log("Knowledge base state set")
      } else {
        console.log("No knowledge base in response")
        setKnowledgeBase(null)
      }
    } catch (error) {
      console.error("Fetch error:", error)
      setError(error instanceof Error ? error.message : "Failed to fetch knowledge base")
    } finally {
      setLoading(false)
      console.log("Loading state set to false")
    }
  }

  console.log("Current state:", { loading, error, knowledgeBase })

  if (loading) {
    console.log("Rendering loading state")
    return <div className="flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
  }

  if (error) {
    console.log("Rendering error state")
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!knowledgeBase) {
    console.log("Rendering empty state")
    return (
      <div className="text-center space-y-4">
        <Brain className="h-12 w-12 mx-auto text-muted-foreground" />
        <div>
          <p className="text-muted-foreground">No knowledge base found</p>
          <Button
            variant="outline"
            className="mt-2"
            onClick={() => router.push("/knowledge-base/new")}
          >
            Create Knowledge Base
          </Button>
        </div>
      </div>
    )
  }

  console.log("Rendering knowledge base:", knowledgeBase)
  const entriesCount = knowledgeBase.entries?.length || 0
  const hasCoalescedSummary = Boolean(knowledgeBase.coalescedSummary)
  const completionPercentage = hasCoalescedSummary ? 100 : (entriesCount > 0 ? 50 : 0)

  return (
    <div className="space-y-4">
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
        <Progress value={completionPercentage} />
      </div>

      {detailed && knowledgeBase.coalescedSummary && (
        <div className="space-y-4">
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

          {knowledgeBase.coalescedSummary.capabilities?.length > 0 && (
            <Card className="p-4">
              <h4 className="font-medium mb-2">Capabilities</h4>
              <div className="flex flex-wrap gap-2">
                {knowledgeBase.coalescedSummary.capabilities.map((capability, index) => (
                  <Badge key={index} variant="outline">{capability}</Badge>
                ))}
              </div>
            </Card>
          )}

          {knowledgeBase.coalescedSummary.useCases?.length > 0 && (
            <Card className="p-4">
              <h4 className="font-medium mb-2">Use Cases</h4>
              <div className="flex flex-wrap gap-2">
                {knowledgeBase.coalescedSummary.useCases.map((useCase, index) => (
                  <Badge key={index} variant="outline">{useCase}</Badge>
                ))}
              </div>
            </Card>
          )}

          {knowledgeBase.coalescedSummary.limitations?.length > 0 && (
            <Card className="p-4">
              <h4 className="font-medium mb-2">Limitations</h4>
              <div className="flex flex-wrap gap-2">
                {knowledgeBase.coalescedSummary.limitations.map((limitation, index) => (
                  <Badge key={index} variant="outline">{limitation}</Badge>
                ))}
              </div>
            </Card>
          )}

          {knowledgeBase.coalescedSummary.additionalContext && (
            <Card className="p-4">
              <h4 className="font-medium mb-2">Additional Context</h4>
              <p className="text-sm text-muted-foreground">
                {knowledgeBase.coalescedSummary.additionalContext}
              </p>
            </Card>
          )}
        </div>
      )}
    </div>
  )
} 