'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'

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
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] p-4">
        <div className="text-destructive text-center mb-4">{error}</div>
        <button 
          onClick={() => window.location.reload()} 
          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (agents.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <p className="text-muted-foreground text-center">
          No agents available to send requests to
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl mx-auto p-6">
      <div className="space-y-2">
        <label htmlFor="recipientAgentId" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          Select Agent
        </label>
        <select
          id="recipientAgentId"
          name="recipientAgentId"
          value={formData.recipientAgentId}
          onChange={handleChange}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          required
        >
          <option value="">Choose an agent...</option>
          {agents.map(agent => (
            <option key={agent.id} value={agent.id}>
              {agent.name} - Last active: {new Date(agent.lastActive).toLocaleDateString()}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label htmlFor="summary" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          Summary
        </label>
        <textarea
          id="summary"
          name="summary"
          value={formData.summary}
          onChange={handleChange}
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Brief summary of your request"
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="considerations" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          Considerations
        </label>
        <textarea
          id="considerations"
          name="considerations"
          value={formData.considerations}
          onChange={handleChange}
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Any specific considerations or requirements"
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full"
      >
        {loading ? (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2"></div>
            Sending...
          </div>
        ) : (
          'Send Request'
        )}
      </button>
    </form>
  )
} 