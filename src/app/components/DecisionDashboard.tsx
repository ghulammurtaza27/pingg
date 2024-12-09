'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/app/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Alert, AlertDescription } from '@/app/components/ui/alert'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/app/components/ui/pagination"

type Request = {
  id: string
  summary: string
  relevanceScore: number
  considerations: string
  senderAgent: { name: string }
  recipientAgent: { name: string }
  status: string
}

export function DecisionDashboard() {
  const { data: session } = useSession()
  const [requests, setRequests] = useState<Request[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [alert, setAlert] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const fetchRequests = useCallback(async (page: number) => {
    try {
      const response = await fetch(`/api/requests?page=${page}&limit=5`)
      if (!response.ok) throw new Error('Failed to fetch requests')
      const data = await response.json()
      setRequests(data.requests)
      setTotalPages(data.totalPages)
    } catch (error) {
      console.error('Error fetching requests:', error)
      setAlert({ message: "Failed to fetch requests", type: "error" })
    }
  }, [])

  useEffect(() => {
    if (session) {
      fetchRequests(currentPage)
    }
  }, [session, currentPage, fetchRequests])

  const handleAction = async (id: string, action: 'accept' | 'reject') => {
    try {
      const response = await fetch(`/api/requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action === 'accept' ? 'accepted' : 'rejected' }),
      })
      if (!response.ok) throw new Error(`Failed to ${action} request`)
      setRequests(requests.map(request => 
        request.id === id ? { ...request, status: action === 'accept' ? 'accepted' : 'rejected' } : request
      ))
      setAlert({ message: `Request ${action}ed successfully`, type: "success" })
    } catch (error) {
      console.error(`Error ${action}ing request:`, error)
      setAlert({ message: `Failed to ${action} request`, type: "error" })
    }
  }

  if (!session) {
    return null
  }

  return (
    <Card className="bg-card text-card-foreground">
      <CardHeader>
        <CardTitle>Decision Dashboard</CardTitle>
        <CardDescription>Review and act on incoming requests</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {requests.map((request) => (
            <Card key={request.id} className="bg-card text-card-foreground">
              <CardHeader>
                <CardTitle className="text-lg">{request.summary}</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Relevance Score: {request.relevanceScore.toFixed(2)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{request.considerations}</p>
                <p className="mt-2 text-sm text-muted-foreground">From: {request.senderAgent.name}</p>
                <p className="text-sm text-muted-foreground">To: {request.recipientAgent.name}</p>
                <p className="mt-2 text-sm font-medium">Status: {request.status}</p>
              </CardContent>
              {request.status === 'pending' && (
                <CardFooter className="space-x-2">
                  <Button onClick={() => handleAction(request.id, 'accept')} variant="default">
                    Accept
                  </Button>
                  <Button onClick={() => handleAction(request.id, 'reject')} variant="destructive">
                    Reject
                  </Button>
                </CardFooter>
              )}
            </Card>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                href="#" 
                onClick={(e) => {
                  e.preventDefault()
                  if (currentPage > 1) setCurrentPage(currentPage - 1)
                }}
                className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            {[...Array(totalPages)].map((_, i) => (
              <PaginationItem key={i + 1}>
                <PaginationLink
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    setCurrentPage(i + 1)
                  }}
                  isActive={currentPage === i + 1}
                >
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  if (currentPage < totalPages) setCurrentPage(currentPage + 1)
                }}
                className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </CardFooter>
      {alert && (
        <CardFooter>
          <Alert variant={alert.type === 'error' ? 'destructive' : 'default'} className="w-full">
            {alert.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
            <AlertDescription>{alert.message}</AlertDescription>
          </Alert>
        </CardFooter>
      )}
    </Card>
  )
}

