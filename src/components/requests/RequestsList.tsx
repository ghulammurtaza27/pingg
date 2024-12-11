'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"
import { Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/app/components/ui/alert"

type Request = {
  id: string
  summary: string
  considerations: string
  status: 'pending' | 'accepted' | 'rejected'
  relevanceScore: number
  createdAt: string
  senderAgent: {
    name: string
  }
  recipientAgent: {
    name: string
  }
}

export default function RequestsList() {
  const { data: session } = useSession()
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/requests')
      const data = await response.json()
      if (data.success) {
        setRequests(data.requests)
      } else {
        throw new Error(data.error || "Failed to fetch requests")
      }
    } catch (error) {
      console.error('Error fetching requests:', error)
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
    <div className="space-y-4 bg-[#0c0c0c] rounded-lg">
      {requests.map((request) => (
        <Card key={request.id} className="p-4 bg-[#1c2432] border-0">
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <span>{request.senderAgent.name} → {request.recipientAgent.name}</span>
                  <Badge variant="secondary" className="bg-[#2a3441] text-yellow-500">
                    {request.status}
                  </Badge>
                  <Badge variant="outline" className="border-gray-700">
                    {(request.relevanceScore * 100).toFixed(0)}% relevant
                  </Badge>
                </div>
                <p className="text-sm text-gray-200">{new Date(request.createdAt).toLocaleDateString()}</p>
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-200">Summary</p>
                  <p className="text-sm text-muted-foreground mt-1">{request.summary}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-200">Considerations</p>
                  <p className="text-sm text-muted-foreground mt-1">{request.considerations}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
} 