"use client"

import { useState } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { Textarea } from "@/app/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"

interface AgentSetupProps {
  onSuccess?: () => void
}

export function AgentSetup({ onSuccess }: AgentSetupProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    type: "assistant", // or "specialist" or "manager"
    knowledgeBase: "",
    goals: "",
    capabilities: ""
  })

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSetup = async () => {
    try {
      setLoading(true)

      if (!formData.name || !formData.type || !formData.goals) {
        toast.error('Please fill in all required fields')
        return
      }
      
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error('Failed to create agent')
      }

      const data = await response.json()

      toast.success('Agent created successfully')
      router.refresh()
      onSuccess?.()
      
    } catch (error) {
      toast.error('Failed to create agent')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-[#0c0c0c] border-gray-800">
      <CardHeader>
        <CardTitle>Create New Agent</CardTitle>
        <CardDescription>Configure an AI agent for your organization</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Agent Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Agent Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Enter agent name"
            disabled={loading}
            className="bg-[#0c0c0c] border-gray-700"
          />
        </div>

        {/* Agent Type */}
        <div className="space-y-2">
          <Label>Agent Type</Label>
          <Select
            value={formData.type}
            onValueChange={(value) => handleChange('type', value)}
            disabled={loading}
          >
            <SelectTrigger className="bg-[#0c0c0c] border-gray-700">
              <SelectValue placeholder="Select agent type" />
            </SelectTrigger>
            <SelectContent className="bg-[#1c2432] border-gray-700">
              <SelectItem value="assistant">Assistant</SelectItem>
              <SelectItem value="specialist">Specialist</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Knowledge Base */}
        <div className="space-y-2">
          <Label htmlFor="knowledge-base">Knowledge Base URL (Optional)</Label>
          <Input
            id="knowledge-base"
            value={formData.knowledgeBase}
            onChange={(e) => handleChange('knowledgeBase', e.target.value)}
            placeholder="https://your-knowledge-base.com"
            disabled={loading}
            className="bg-[#0c0c0c] border-gray-700"
          />
        </div>

        {/* Goals */}
        <div className="space-y-2">
          <Label htmlFor="goals">Agent Goals</Label>
          <Textarea
            id="goals"
            value={formData.goals}
            onChange={(e) => handleChange('goals', e.target.value)}
            placeholder="Define the primary goals and objectives for this agent..."
            disabled={loading}
            className="bg-[#0c0c0c] border-gray-700 min-h-[100px]"
          />
        </div>

        {/* Capabilities */}
        <div className="space-y-2">
          <Label htmlFor="capabilities">Agent Capabilities (Optional)</Label>
          <Textarea
            id="capabilities"
            value={formData.capabilities}
            onChange={(e) => handleChange('capabilities', e.target.value)}
            placeholder="List the specific capabilities and skills of this agent..."
            disabled={loading}
            className="bg-[#0c0c0c] border-gray-700 min-h-[100px]"
          />
        </div>

        <Button 
          onClick={handleSetup} 
          className="w-full bg-[#2a3441] hover:bg-[#1c2432] text-gray-200"
          disabled={loading}
        >
          {loading ? 'Creating Agent...' : 'Create Agent'}
        </Button>
      </CardContent>
    </Card>
  )
}

