import { useState, useEffect } from 'react'
import { Button } from '@/app/components/ui/button'
import { Textarea } from '@/app/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Loader2, Check } from "lucide-react"
import { Alert, AlertDescription } from "@/app/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { CoalescedSummary } from './CoalescedSummary'

interface KnowledgeBaseEntry {
  id: string
  question: string
  answer: string
}

interface KnowledgeBaseDisplayProps {
  entries: KnowledgeBaseEntry[];
  onUpdate: (entries: KnowledgeBaseEntry[]) => Promise<void>;
  onContinue: () => void;
  onComplete?: () => void;
  knowledgeBaseId: string;
}

interface KnowledgeBase {
  id: string;
  agentId: string;
  coalesced: boolean;
  coalescedSummary: {
    id: string;
    knowledgeBaseId: string;
    summary: string;
    capabilities: string[];
    useCases: string[];
    limitations: string[];
    additionalContext?: string;
  } | null;
}

export function KnowledgeBaseDisplay({ 
  entries, 
  onUpdate, 
  onContinue, 
  onComplete, 
  knowledgeBaseId 
}: KnowledgeBaseDisplayProps) {
  const [editableEntries, setEditableEntries] = useState(entries)
  const [isSaving, setIsSaving] = useState(false)
  const [showSaved, setShowSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCoalescing, setIsCoalescing] = useState(false)
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBase | null>(null)
  const [showEntries, setShowEntries] = useState(false)

  useEffect(() => {
    const fetchKnowledgeBase = async () => {
      if (!knowledgeBaseId) return

      try {
        console.log('Fetching knowledge base:', knowledgeBaseId)
        const response = await fetch(`/api/knowledge-base/get?id=${knowledgeBaseId}`)
        const data = await response.json()
        console.log('Fetched knowledge base data:', data)
        
        if (data.success && data.data?.knowledgeBase) {
          const kb = data.data.knowledgeBase
          console.log('Setting knowledge base with summary:', kb.coalescedSummary)
          setKnowledgeBase(kb)
          // Set showEntries to false if there's a summary
          setShowEntries(kb.coalescedSummary === null)
        }
      } catch (error) {
        console.error('Error fetching knowledge base:', error)
        setShowEntries(true)
      }
    }

    fetchKnowledgeBase()
  }, [knowledgeBaseId])

  const handleEntryChange = (index: number, field: 'question' | 'answer', value: string) => {
    const updatedEntries = [...editableEntries]
    updatedEntries[index] = { ...updatedEntries[index], [field]: value }
    setEditableEntries(updatedEntries)
    setShowSaved(false)
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)
    try {
      await onUpdate(editableEntries)
      setShowSaved(true)
      setTimeout(() => setShowSaved(false), 3000)
    } catch (err) {
      setError('Failed to save changes')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCoalesce = async () => {
    if (!knowledgeBaseId) {
      setError('No knowledge base ID provided')
      return
    }

    setIsCoalescing(true)
    setError(null)

    try {
      const response = await fetch('/api/knowledge-base/coalesce', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ knowledgeBaseId })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to coalesce knowledge base')
      }

      setKnowledgeBase(data.data.knowledgeBase)
      setShowEntries(false)

    } catch (err: unknown) {
      const error = err as Error
      console.error('Coalesce error:', error)
      setError(error?.message || 'Failed to coalesce knowledge base')
    } finally {
      setIsCoalescing(false)
    }
  }

  // Transform coalescedSummary to match CoalescedSummaryData interface
  const summaryData = knowledgeBase?.coalescedSummary ? {
    summary: knowledgeBase.coalescedSummary.summary,
    capabilities: knowledgeBase.coalescedSummary.capabilities,
    useCases: knowledgeBase.coalescedSummary.useCases,
    limitations: knowledgeBase.coalescedSummary.limitations,
    additionalContext: knowledgeBase.coalescedSummary.additionalContext
  } : null

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Knowledge Base</h2>
        <div className="space-x-2">
          {knowledgeBase?.coalescedSummary ? (
            <>
              <Button
                onClick={() => setShowEntries(!showEntries)}
                variant="outline"
              >
                {showEntries ? 'View Summary' : 'View Entries'}
              </Button>
              <Button
                onClick={handleCoalesce}
                disabled={isCoalescing}
                variant="outline"
              >
                {isCoalescing ? 'Regenerating...' : 'Regenerate Summary'}
              </Button>
              <Button onClick={onContinue}>Continue Adding</Button>
            </>
          ) : (
            <>
              <Button
                onClick={handleCoalesce}
                disabled={isCoalescing}
                variant="outline"
              >
                {isCoalescing ? 'Generating Summary...' : 'Generate Summary'}
              </Button>
              <Button onClick={onContinue}>Continue Adding</Button>
            </>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!showEntries ? (
        <>
          <CoalescedSummary 
            data={summaryData}
            onGenerateSummary={handleCoalesce}
          />
          {console.log('Rendering summary with data:', summaryData)}
        </>
      ) : (
        <div className="space-y-4">
          {summaryData && (
            <Button
              onClick={() => setShowEntries(false)}
              variant="secondary"
              className="w-full mb-4"
            >
              View Generated Summary
            </Button>
          )}
          {editableEntries.map((entry, index) => (
            <Card key={entry.id}>
              <CardHeader>
                <CardTitle>Entry {index + 1}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Textarea
                  value={entry.question}
                  onChange={(e) => handleEntryChange(index, 'question', e.target.value)}
                  placeholder="Edit question..."
                  rows={2}
                />
                <Textarea
                  value={entry.answer}
                  onChange={(e) => handleEntryChange(index, 'answer', e.target.value)}
                  placeholder="Edit answer..."
                  rows={4}
                />
              </CardContent>
            </Card>
          ))}
          
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="w-full"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving changes...
              </>
            ) : showSaved ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Changes saved
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      )}
    </div>
  )
} 