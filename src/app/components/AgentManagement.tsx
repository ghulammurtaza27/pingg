'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/app/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select'
import { Alert, AlertDescription } from '@/app/components/ui/alert'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

type Agent = {
  id: string
  name: string
  type: 'sales' | 'decision-maker'
}

export function AgentManagement() {
  const { data: session } = useSession()
  const [agents, setAgents] = useState<Agent[]>([])
  const [newAgentName, setNewAgentName] = useState('')
  const [newAgentType, setNewAgentType] = useState<'sales' | 'decision-maker'>('sales')
  const [alert, setAlert] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const fetchAgents = useCallback(async () => {
    try {
      const response = await fetch('/api/agents')
      if (!response.ok) throw new Error('Failed to fetch agents')
      const data = await response.json()
      setAgents(data)
    } catch (error) {
      console.error('Error fetching agents:', error)
      setAlert({ message: "Failed to fetch agents", type: "error" })
    }
  }, [])

  useEffect(() => {
    if (session) {
      fetchAgents()
    }
  }, [session, fetchAgents])

  const handleAddAgent = async () => {
    if (newAgentName) {
      try {
        const response = await fetch('/api/agents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newAgentName, type: newAgentType }),
        })
        if (!response.ok) throw new Error('Failed to add agent')
        const newAgent = await response.json()
        setAgents([...agents, newAgent])
        setNewAgentName('')
        setAlert({ message: "Agent added successfully", type: "success" })
      } catch (error) {
        console.error('Error adding agent:', error)
        setAlert({ message: "Failed to add agent", type: "error" })
      }
    }
  }

  if (!session) {
    return null
  }

  return (
    <Card className="bg-card text-card-foreground">
      <CardHeader>
        <CardTitle>Agent Management</CardTitle>
        <CardDescription>Add and manage your AI agents</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex space-x-4">
          <div className="flex-grow space-y-2">
            <Label htmlFor="agent-name">Agent Name</Label>
            <Input
              id="agent-name"
              value={newAgentName}
              onChange={(e) => setNewAgentName(e.target.value)}
              placeholder="Enter agent name"
            />
          </div>
          <div className="w-1/3 space-y-2">
            <Label htmlFor="agent-type">Agent Type</Label>
            <Select value={newAgentType} onValueChange={(value) => setNewAgentType(value as 'sales' | 'decision-maker')}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sales">Sales</SelectItem>
                <SelectItem value="decision-maker">Decision Maker</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button onClick={handleAddAgent} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
          Add Agent
        </Button>
      </CardContent>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full mt-4">
          {agents.map((agent) => (
            <Card key={agent.id} className="bg-card text-card-foreground">
              <CardHeader>
                <CardTitle className="text-lg">{agent.name}</CardTitle>
                <CardDescription className="text-muted-foreground">{agent.type}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">ID: {agent.id}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
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

