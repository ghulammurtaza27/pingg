"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { Alert, AlertDescription } from "@/app/components/ui/alert"
import { Loader2, AlertCircle } from "lucide-react"

export function AgentSetup() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [agent, setAgent] = useState<any>(null)
  const [name, setName] = useState("")

  useEffect(() => {
    fetchAgent()
  }, [])

  async function fetchAgent() {
    try {
      const response = await fetch("/api/agents")
      const data = await response.json()
      
      if (data.agent) {
        setAgent(data.agent)
      }
      setLoading(false)
    } catch (error) {
      setError("Failed to load agent")
      setLoading(false)
    }
  }

  async function createAgent(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create agent")
      }

      setAgent(data.agent)
      router.refresh()
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to create agent")
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

  if (agent) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">{agent.name}</h3>
            <p className="text-sm text-muted-foreground">
              Created {new Date(agent.createdAt).toLocaleDateString()}
            </p>
          </div>
          <Button onClick={() => router.push("/agents")}>Manage</Button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={createAgent} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Agent Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter agent name"
          required
        />
      </div>
      <Button type="submit" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Create Agent
      </Button>
    </form>
  )
} 