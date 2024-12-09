"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/app/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Alert, AlertDescription } from "@/app/components/ui/alert"
import { AlertCircle, CheckCircle2 } from "lucide-react"

type Request = {
  id: string
  summary: string
  considerations: string
  status: 'pending' | 'accepted' | 'rejected'
  createdAt: string
  relevanceScore: number
  senderAgent: {
    name: string
  }
  recipientAgent: {
    name: string
  }
}

type AlertType = 'success' | 'error'

export default function RequestsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [requests, setRequests] = useState<Request[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [alert, setAlert] = useState<{ message: string; type: AlertType } | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      fetchRequests(currentPage)
    }
  }, [session, currentPage])

  const fetchRequests = async (page: number) => {
    try {
      const response = await fetch(`/api/requests?page=${page}&limit=5`)
      if (response.ok) {
        const data = await response.json()
        setRequests(data.requests)
        setTotalPages(data.totalPages)
        setCurrentPage(data.currentPage)
      } else {
        throw new Error("Failed to fetch requests")
      }
    } catch {
      setAlert({ message: "Failed to fetch requests", type: 'error' })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'text-green-500'
      case 'rejected': return 'text-red-500'
      default: return 'text-yellow-500'
    }
  }

  if (status === "loading") {
    return null // Or a loading spinner
  }

  if (!session) {
    return null
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Requests</h1>
      </div>

      <div className="space-y-4">
        {requests.map((request) => (
          <Card key={request.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span className="text-lg">
                  {request.senderAgent.name} → {request.recipientAgent.name}
                </span>
                <span className={`text-sm font-medium ${getStatusColor(request.status)}`}>
                  {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-1">Summary</h3>
                  <p className="text-sm text-muted-foreground">{request.summary}</p>
                </div>
                <div>
                  <h3 className="font-medium mb-1">Considerations</h3>
                  <p className="text-sm text-muted-foreground">{request.considerations}</p>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">
                    Created: {new Date(request.createdAt).toLocaleDateString()}
                  </span>
                  <span className="text-muted-foreground">
                    Relevance Score: {request.relevanceScore.toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {requests.length > 0 && (
        <div className="flex justify-center gap-2 mt-6">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {requests.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No requests found.</p>
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