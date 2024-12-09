"use client"

import { useState } from "react"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { Textarea } from "@/app/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"

export function AgentSetup() {
  const [knowledgeBase, setKnowledgeBase] = useState("''")
  const [organizationalGoals, setOrganizationalGoals] = useState("''")

  const handleSetup = () => {
    console.log("'Agent setup:'", { knowledgeBase, organizationalGoals })
    setKnowledgeBase("''")
    setOrganizationalGoals("''")
  }

  return (
    <Card className="bg-white text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <CardHeader>
        <CardTitle>Agent Setup</CardTitle>
        <CardDescription>Configure your AI agent with knowledge and goals</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="knowledge-base">Knowledge Base URL</Label>
          <Input
            id="knowledge-base"
            value={knowledgeBase}
            onChange={(e) => setKnowledgeBase(e.target.value)}
            placeholder="https://your-knowledge-base.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="organizational-goals">Organizational Goals</Label>
          <Textarea
            id="organizational-goals"
            value={organizationalGoals}
            onChange={(e) => setOrganizationalGoals(e.target.value)}
            placeholder="Enter your organization's goals..."
          />
        </div>
        <Button onClick={handleSetup} className="w-full bg-zinc-900 text-zinc-50 hover:bg-zinc-900/90 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-50/90">Set Up Agent</Button>
      </CardContent>
    </Card>
  )
}

