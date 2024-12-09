'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/app/components/ui/button'
import { Textarea } from '@/app/components/ui/textarea'
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

export function RequestGeneration() {
  const { data: session } = useSession()
  const [productInfo, setProductInfo] = useState('')
  const [targetCriteria, setTargetCriteria] = useState('')
  const [senderAgentId, setSenderAgentId] = useState('')
  const [recipientAgentId, setRecipientAgentId] = useState('')
  const [agents, setAgents] = useState<Agent[]>([])
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

  const handleGenerate = async () => {
    try {
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: productInfo,
          considerations: targetCriteria,
          senderAgentId,
          recipientAgentId,
          organizationalGoals: "Improve efficiency, reduce costs, and expand market reach."
        }),
      })
      if (!response.ok) throw new Error('Failed to generate request')
      const newRequest = await response.json()
      console.log('New request generated:', newRequest)
      // Reset form
      setProductInfo('')
      setTargetCriteria('')
      setSenderAgentId('')
      setRecipientAgentId('')
      setAlert({ message: "Request generated successfully", type: "success" })
    } catch (error) {
      console.error('Error generating request:', error)
      setAlert({ message: "Failed to generate request", type: "error" })
    }
  }

  if (!session) {
    return null
  }

  return (
    <Card className="bg-card text-card-foreground">
      <CardHeader>
        <CardTitle>Request Generation</CardTitle>
        <CardDescription>Generate a new request for AI agent interaction</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="product-info">Product Information</Label>
          <Textarea
            id="product-info"
            value={productInfo}
            onChange={(e) => setProductInfo(e.target.value)}
            placeholder="Enter product information..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="target-criteria">Target Criteria</Label>
          <Textarea
            id="target-criteria"
            value={targetCriteria}
            onChange={(e) => setTargetCriteria(e.target.value)}
            placeholder="Enter target criteria..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sender-agent-id">Sender Agent</Label>
          <Select value={senderAgentId} onValueChange={setSenderAgentId}>
            <SelectTrigger>
              <SelectValue placeholder="Select sender agent" />
            </SelectTrigger>
            <SelectContent>
              {agents.map((agent) => (
                <SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="recipient-agent-id">Recipient Agent</Label>
          <Select value={recipientAgentId} onValueChange={setRecipientAgentId}>
            <SelectTrigger>
              <SelectValue placeholder="Select recipient agent" />
            </SelectTrigger>
            <SelectContent>
              {agents.map((agent) => (
                <SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleGenerate} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
          Generate Request
        </Button>
      </CardFooter>
      {alert && (
        <CardFooter>
          <Alert 
            variant={alert.type === 'error' ? 'destructive' : 'default'}
            className="w-full"
          >
            {alert.type === 'error' ? 
              <AlertCircle className="h-4 w-4" /> : 
              <CheckCircle2 className="h-4 w-4" />
            }
            <AlertDescription>{alert.message}</AlertDescription>
          </Alert>
        </CardFooter>
      )}
    </Card>
  )
}

