'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Card } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"
import { Loader2, AlertCircle, ArrowRight, ArrowLeftRight } from "lucide-react"
import { Alert, AlertDescription } from "@/app/components/ui/alert"
import { Button } from "@/app/components/ui/button"

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-500'
      case 'accepted': return 'bg-green-500/10 text-green-500'
      case 'rejected': return 'bg-red-500/10 text-red-500'
      default: return 'bg-gray-500/10 text-gray-500'
    }
  }

  const getRelevanceColor = (score: number) => {
    if (score >= 0.8) return 'bg-green-500/10 text-green-500 border-green-500/20'
    if (score >= 0.5) return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
    return 'bg-red-500/10 text-red-500 border-red-500/20'
  }

  if (loading) {
    return (
      <div className="h-[calc(100vh-120px)] flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-[calc(100vh-120px)]">
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertCircle className="h-5 w-5" />
          <AlertDescription className="ml-2">{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (requests.length === 0) {
    return (
      <div className="h-[calc(100vh-120px)] flex items-center justify-center">
        <div className="text-center py-12 bg-[#1c2432] rounded-lg w-full max-w-2xl">
          <p className="text-muted-foreground text-lg">No requests found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col max-w-4xl mx-auto">
      <div className="flex-1 overflow-y-auto pr-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-700 
                    scrollbar-track-transparent hover:scrollbar-thumb-gray-600">
        {requests.map((request) => (
          <Card 
            key={request.id} 
            className="p-6 bg-[#1c2432] border-0 hover:bg-[#232b3b] transition-colors duration-200"
          >
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center text-sm">
                    <span className="font-medium text-gray-200">{request.senderAgent.name}</span>
                    <ArrowLeftRight className="mx-2 h-4 w-4 text-gray-500" />
                    <span className="font-medium text-gray-200">{request.recipientAgent.name}</span>
                  </div>
                  <Badge variant="secondary" className={`${getStatusColor(request.status)}`}>
                    {request.status}
                  </Badge>
                </div>
                <Badge 
                  variant="outline" 
                  className={`${getRelevanceColor(request.relevanceScore)}`}
                >
                  {(request.relevanceScore * 100).toFixed(0)}% relevant
                </Badge>
              </div>

              {/* Content */}
              <div className="space-y-4 pl-4 border-l-2 border-[#2a3441]">
                <div>
                  <h3 className="text-sm font-semibold text-gray-200 mb-2">Summary</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{request.summary}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-200 mb-2">Considerations</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{request.considerations}</p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-gray-500">
                  Created {new Date(request.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
                <Link href={`/requests/${request.id}`}>
                  <Button 
                    variant="ghost" 
                    className="text-blue-400 hover:text-blue-300 hover:bg-[#2a3441]
                             transition-all duration-200 group"
                  >
                    View Details
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
} 