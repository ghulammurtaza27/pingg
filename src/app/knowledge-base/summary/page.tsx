'use client'

import { useState } from 'react'
import { CoalescedSummary } from '@/app/components/CoalescedSummary'
import { Button } from '@/app/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select"

export default function KnowledgeBaseSummaryPage() {
  const [viewMode, setViewMode] = useState<'demo' | 'empty' | 'real'>('demo')

  const handleGenerateSummary = () => {
   
    setViewMode('demo')
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Knowledge Base Summary</h1>
          <div className="flex items-center gap-4">
            <Select
              value={viewMode}
              onValueChange={(value: 'demo' | 'empty' | 'real') => setViewMode(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select view mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="demo">Demo Data</SelectItem>
                <SelectItem value="empty">Empty State</SelectItem>
                <SelectItem value="real">Real Data</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">Back to Knowledge Base</Button>
          </div>
        </div>

        {/* Description */}
        <div className="text-muted-foreground">
          <p>View and manage your knowledge base summary. This provides an overview of your agent&apos;s capabilities, use cases, and limitations.</p>
        </div>

        {/* Summary Component */}
        {viewMode === 'demo' && (
          <CoalescedSummary 
            data={{
              summary: "Demo summary content",
              capabilities: ["Capability 1", "Capability 2"],
              useCases: ["Use case 1", "Use case 2"],
              limitations: ["Limitation 1", "Limitation 2"]
            }}
          />
        )}
        
        {viewMode === 'empty' && (
          <CoalescedSummary 
            data={null} 
            onGenerateSummary={handleGenerateSummary}
          />
        )}

        {viewMode === 'real' && (
          <div className="text-center py-12 text-muted-foreground">
            <p>Real data integration coming soon...</p>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex justify-end gap-4 pt-6">
          <Button variant="outline">Edit Knowledge Base</Button>
          <Button>Continue Adding</Button>
        </div>
      </div>
    </div>
  )
} 