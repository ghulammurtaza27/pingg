"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/app/components/ui/button"
import { Card } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"
import { Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/app/components/ui/alert"

interface Request {
  id: string
  summary: string
  status: 'pending' | 'completed' | 'approved'
  relevanceScore: number
  createdAt: string
  senderAgent: { name: string }
  recipientAgent: { name: string }
}

export function RequestsOverview({ detailed = false }: { detailed?: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [requests, setRequests] = useState<Request[]>([])

  useEffect(() => {
    fetchRequests()
  }, [])

  async function fetchRequests() {
    try {
      const response = await fetch("/api/requests")
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch requests")
      }

      setRequests(data.requests)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to fetch requests")
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

  if (requests.length === 0) {
    return <p className="text-muted-foreground">No requests found</p>
  }

  return (
    <div className="space-y-4">
      {requests.slice(0, detailed ? undefined : 5).map((request) => (
        <Card key={request.id} className="p-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="font-medium">{request.summary}</p>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <span>{request.senderAgent.name} → {request.recipientAgent.name}</span>
                <Badge variant={request.status === 'pending' ? 'secondary' : 'default'}>
                  {request.status}
                </Badge>
                <Badge variant="outline">
                  {(request.relevanceScore * 100).toFixed(0)}% relevant
                </Badge>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/requests/${request.id}`)}
            >
              View
            </Button>
          </div>
        </Card>
      ))}
      
      {!detailed && requests.length > 5 && (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => router.push("/requests")}
        >
          View All Requests
        </Button>
      )}
    </div>
  )
} 