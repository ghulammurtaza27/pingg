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
  entries: { id: string }[]
  coalescedSummary: {
    capabilities: string[]
    useCases: string[]
  } | null
}

export function KnowledgeBaseOverview({ detailed = false }: { detailed?: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBase | null>(null)

  useEffect(() => {
    fetchKnowledgeBase()
  }, [])

  async function fetchKnowledgeBase() {
    try {
      const response = await fetch("/api/knowledge-base")
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch knowledge base")
      }

      setKnowledgeBase(data.knowledgeBase)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to fetch knowledge base")
    } finally {
      setLoading(false)
    }
  }

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

  if (!knowledgeBase) {
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

  const entriesCount = knowledgeBase.entries.length
  const hasCoalescedSummary = knowledgeBase.coalescedSummary !== null
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

      {detailed && (
        <div className="space-y-4">
          <Card className="p-4">
            <h4 className="font-medium mb-2">Main Goals</h4>
            <div className="flex flex-wrap gap-2">
              {knowledgeBase.mainGoals.map((goal, index) => (
                <Badge key={index} variant="secondary">{goal}</Badge>
              ))}
            </div>
          </Card>

          {knowledgeBase.coalescedSummary && (
            <>
              <Card className="p-4">
                <h4 className="font-medium mb-2">Capabilities</h4>
                <div className="flex flex-wrap gap-2">
                  {knowledgeBase.coalescedSummary.capabilities.map((capability, index) => (
                    <Badge key={index} variant="outline">{capability}</Badge>
                  ))}
                </div>
              </Card>

              <Card className="p-4">
                <h4 className="font-medium mb-2">Use Cases</h4>
                <div className="flex flex-wrap gap-2">
                  {knowledgeBase.coalescedSummary.useCases.map((useCase, index) => (
                    <Badge key={index} variant="outline">{useCase}</Badge>
                  ))}
                </div>
              </Card>
            </>
          )}
        </div>
      )}
    </div>
  )
} 