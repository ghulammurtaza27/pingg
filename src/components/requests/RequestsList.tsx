'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"
import { Loader2, AlertCircle, ArrowRight, ArrowLeftRight, ChevronDown, ChevronUp } from "lucide-react"
import { Alert, AlertDescription } from "@/app/components/ui/alert"
import { Button } from "@/app/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"

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

type Agent = {
  id: string
  name: string
  type: string
}

export default function RequestsList() {
  const { data: session } = useSession()
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedRequests, setExpandedRequests] = useState<Set<string>>(new Set())
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedAgentId, setSelectedAgentId] = useState<string>('')

  useEffect(() => {
    fetchAgents()
  }, [])

  useEffect(() => {
    if (selectedAgentId) {
      fetchRequests()
    }
  }, [selectedAgentId])

  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/agents')
      const data = await response.json()
      const filteredAgents = data.filter((agent: Agent) => agent.type !== 'email')
      setAgents(filteredAgents)
      if (filteredAgents.length > 0) {
        setSelectedAgentId(filteredAgents[0].id)
      }
    } catch (error) {
      console.error('Error fetching agents:', error)
      setError('Failed to fetch agents')
    }
  }

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const url = selectedAgentId 
        ? `/api/requests?recipientId=${selectedAgentId}`
        : '/api/requests'
        
      const response = await fetch(url)
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

  const toggleExpand = (id: string) => {
    setExpandedRequests(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
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

  const relevantRequests = requests.filter(req => req.relevanceScore >= 0.5)
  const lowRelevanceRequests = requests.filter(req => req.relevanceScore < 0.5)

  if (loading) {
    return (
      <div className="h-[calc(100vh-120px)] flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
        <Card className="w-full max-w-2xl">
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No requests found</p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <Card className="h-[calc(100vh-220px)] flex flex-col mt-[33px]">
      <CardHeader className="pb-3 shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle>Requests Overview</CardTitle>
          <Select
            value={selectedAgentId}
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
                  {agent.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-0">
        <Tabs defaultValue="relevant" className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-2 shrink-0">
            <TabsTrigger value="relevant">
              Relevant ({relevantRequests.length})
            </TabsTrigger>
            <TabsTrigger value="low-relevance">
              Low Relevance ({lowRelevanceRequests.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent 
            value="relevant" 
            className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 
                      scrollbar-track-transparent hover:scrollbar-thumb-gray-600 pt-4"
          >
            <div className="space-y-4 pr-4">
              {relevantRequests.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No relevant requests found</p>
              ) : (
                relevantRequests.map((request) => (
                  <Card 
                    key={request.id} 
                    className="transition-all duration-200 hover:shadow-lg"
                  >
                    <div className="p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-0 hover:bg-transparent"
                            onClick={() => toggleExpand(request.id)}
                          >
                            {expandedRequests.has(request.id) ? (
                              <ChevronUp className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-muted-foreground" />
                            )}
                          </Button>
                          <div className="flex items-center text-sm">
                            <span className="font-medium">{request.senderAgent.name}</span>
                            <ArrowLeftRight className="mx-2 h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{request.recipientAgent.name}</span>
                          </div>
                          <Badge variant="secondary" className={getStatusColor(request.status)}>
                            {request.status}
                          </Badge>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={getRelevanceColor(request.relevanceScore)}
                        >
                          {(request.relevanceScore * 100).toFixed(0)}% relevant
                        </Badge>
                      </div>

                      {expandedRequests.has(request.id) && (
                        <div className="space-y-4 pl-4 border-l-2 border-border">
                          <div>
                            <h3 className="text-sm font-semibold mb-2">Summary</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">{request.summary}</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold mb-2">Considerations</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">{request.considerations}</p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2">
                        <p className="text-xs text-muted-foreground">
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
                            className="group"
                          >
                            View Details
                            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent 
            value="low-relevance" 
            className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 
                      scrollbar-track-transparent hover:scrollbar-thumb-gray-600 pt-4"
          >
            <div className="space-y-4 pr-4">
              {lowRelevanceRequests.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No low relevance requests found</p>
              ) : (
                lowRelevanceRequests.map((request) => (
                  <Card 
                    key={request.id} 
                    className="transition-all duration-200 hover:shadow-lg"
                  >
                    <div className="p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-0 hover:bg-transparent"
                            onClick={() => toggleExpand(request.id)}
                          >
                            {expandedRequests.has(request.id) ? (
                              <ChevronUp className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-muted-foreground" />
                            )}
                          </Button>
                          <div className="flex items-center text-sm">
                            <span className="font-medium">{request.senderAgent.name}</span>
                            <ArrowLeftRight className="mx-2 h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{request.recipientAgent.name}</span>
                          </div>
                          <Badge variant="secondary" className={getStatusColor(request.status)}>
                            {request.status}
                          </Badge>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={getRelevanceColor(request.relevanceScore)}
                        >
                          {(request.relevanceScore * 100).toFixed(0)}% relevant
                        </Badge>
                      </div>

                      {expandedRequests.has(request.id) && (
                        <div className="space-y-4 pl-4 border-l-2 border-border">
                          <div>
                            <h3 className="text-sm font-semibold mb-2">Summary</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">{request.summary}</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold mb-2">Considerations</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">{request.considerations}</p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2">
                        <p className="text-xs text-muted-foreground">
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
                            className="group"
                          >
                            View Details
                            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}