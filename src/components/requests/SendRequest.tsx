'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { Loader2, AlertCircle, Send } from "lucide-react"
import { Alert, AlertDescription } from "@/app/components/ui/alert"
import { Button } from "@/app/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Label } from "@/app/components/ui/label"
import { Textarea } from "@/app/components/ui/textarea"

interface Agent {
  id: string
  name: string
  type: string
  status: 'active' | 'inactive'
  lastActive: string
}

interface FormData {
  summary: string
  considerations: string
  recipientAgentId: string
}

export default function SendRequest() {
  const router = useRouter()
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchingAgents, setFetchingAgents] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>({
    summary: '',
    considerations: '',
    recipientAgentId: ''
  })

  useEffect(() => {
    const fetchAgents = async () => {
      setFetchingAgents(true)
      try {
        const response = await fetch('/api/agents')
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const agents = await response.json()
        
        if (Array.isArray(agents)) {
          setAgents(agents)
        } else {
          throw new Error('Invalid response format')
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch agents'
        toast.error(errorMessage)
        setError(errorMessage)
        setAgents([])
      } finally {
        setFetchingAgents(false)
      }
    }

    fetchAgents()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/requests/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        toast.success('Request sent successfully!')
        setFormData({
          summary: '',
          considerations: '',
          recipientAgentId: ''
        })
        router.refresh()
      } else {
        throw new Error(data.error || 'Failed to send request')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send request'
      toast.error(errorMessage)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (fetchingAgents) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading agents...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertCircle className="h-5 w-5" />
          <AlertDescription className="ml-2">{error}</AlertDescription>
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline"
            className="mt-4 w-full"
          >
            Try Again
          </Button>
        </Alert>
      </div>
    )
  }

  if (agents.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="flex flex-col items-center justify-center h-[200px]">
            <p className="text-muted-foreground text-lg text-center">
              No agents available to send requests to
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Send Request</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="agent">Select Agent</Label>
              <Select
                value={formData.recipientAgentId}
                onValueChange={(value) => {
                  handleChange({
                    target: { name: 'recipientAgentId', value }
                  } as any)
                }}
              >
                <SelectTrigger id="agent" className="w-full">
                  <SelectValue placeholder="Choose an agent..." />
                </SelectTrigger>
                <SelectContent>
                  {agents.map(agent => (
                    <SelectItem 
                      key={agent.id} 
                      value={agent.id}
                    >
                      {agent.name} - Last active: {new Date(agent.lastActive).toLocaleDateString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="summary">Summary</Label>
              <Textarea
                id="summary"
                name="summary"
                value={formData.summary}
                onChange={handleChange}
                placeholder="Brief summary of your request"
                className="min-h-[120px]"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="considerations">Considerations</Label>
              <Textarea
                id="considerations"
                name="considerations"
                value={formData.considerations}
                onChange={handleChange}
                placeholder="Any specific considerations or requirements"
                className="min-h-[120px]"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Request
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 