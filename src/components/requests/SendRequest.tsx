'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/app/components/ui/alert"
import { Button } from "@/app/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"

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
      <div className="flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
        <Button 
          onClick={() => window.location.reload()} 
          variant="outline"
          className="mt-4 w-full border-gray-700 hover:bg-[#2a3441]"
        >
          Try Again
        </Button>
      </Alert>
    )
  }

  if (agents.length === 0) {
    return (
      <div className="flex items-center justify-center">
        <p className="text-muted-foreground">
          No agents available to send requests to
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-[#0c0c0c] rounded-lg p-6">
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-200">
          Select Agent
        </label>
        <Select
          value={formData.recipientAgentId}
          onValueChange={(value) => {
            handleChange({
              target: { name: 'recipientAgentId', value }
            } as any)
          }}
        >
          <SelectTrigger className="w-full bg-[#0c0c0c] border border-gray-700 text-gray-200">
            <SelectValue placeholder="Choose an agent..." />
          </SelectTrigger>
          <SelectContent className="bg-[#1c2432] border border-gray-700">
            {agents.map(agent => (
              <SelectItem 
                key={agent.id} 
                value={agent.id}
                className="text-gray-200 focus:bg-[#2a3441] focus:text-gray-200"
              >
                {agent.name} - Last active: {new Date(agent.lastActive).toLocaleDateString()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label htmlFor="summary" className="text-sm font-medium text-gray-200">
          Summary
        </label>
        <textarea
          id="summary"
          name="summary"
          value={formData.summary}
          onChange={handleChange}
          className="flex min-h-[80px] w-full rounded-lg border border-gray-700 bg-[#0c0c0c] px-3 py-2 text-base text-gray-200 ring-0 placeholder:text-gray-200 focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Brief summary of your request"
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="considerations" className="text-sm font-medium text-gray-200">
          Considerations
        </label>
        <textarea
          id="considerations"
          name="considerations"
          value={formData.considerations}
          onChange={handleChange}
          className="flex min-h-[80px] w-full rounded-lg border border-gray-700 bg-[#0c0c0c] px-3 py-2 text-base text-gray-200 ring-0 placeholder:text-gray-200 focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Any specific considerations or requirements"
          required
        />
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-[#2a3441] hover:bg-[#1c2432] text-gray-200"
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Sending...
          </div>
        ) : (
          'Send Request'
        )}
      </Button>
    </form>
  )
} 