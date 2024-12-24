import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/app/components/ui/button'
import { Textarea } from '@/app/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Loader2, Check, Trash2, HelpCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/app/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { CoalescedSummary } from './CoalescedSummary'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover"

interface KnowledgeBaseEntry {
  id: string
  question: string
  answer: string
  source?: string
  suggestions?: string[]
  orderIndex?: number
}

interface KnowledgeBaseDisplayProps {
  entries: KnowledgeBaseEntry[];
  onUpdate: (entries: KnowledgeBaseEntry[]) => Promise<void>;
  onContinue: () => void;
  onComplete?: () => void;
  knowledgeBaseId: string;
  agentId: string;
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
  knowledgeBaseId,
  agentId 
}: KnowledgeBaseDisplayProps) {
  const [editableEntries, setEditableEntries] = useState<KnowledgeBaseEntry[]>(entries)
  const [isSaving, setIsSaving] = useState(false)
  const [showSaved, setShowSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCoalescing, setIsCoalescing] = useState(false)
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBase | null>(null)
  const [showEntries, setShowEntries] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [emailEntries, setEmailEntries] = useState<KnowledgeBaseEntry[]>([])
  const [manualEntries, setManualEntries] = useState<KnowledgeBaseEntry[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const fetchKnowledgeBase = async () => {
      if (!knowledgeBaseId) return

      try {

        const response = await fetch(`/api/knowledge-base/get?id=${knowledgeBaseId}`)
        const data = await response.json()
       
        
        if (data.success && data.data?.knowledgeBase) {
          const kb = data.data.knowledgeBase

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

  useEffect(() => {
    if (entries) {
      const sortedEntries = [...entries].sort((a, b) => 
        (a.orderIndex ?? 0) - (b.orderIndex ?? 0)
      )
      
      setEmailEntries(sortedEntries.filter(entry => entry.source === 'gmail'))
      setManualEntries(sortedEntries.filter(entry => entry.source === 'manual'))
      setEditableEntries(sortedEntries)
    }
  }, [entries])

  // Handle text changes
  const handleEntryChange = (id: string, newAnswer: string) => {
    setEditableEntries(prevEntries => 
      prevEntries.map(entry =>
        entry.id === id 
          ? { ...entry, answer: newAnswer }
          : entry
      )
    )
  }

  const handleSave = async () => {
    try {
      setIsSubmitting(true)
      setError(null)

      const updatedEntries = editableEntries.map((entry, index) => ({
        id: entry.id,
        question: entry.question,
        answer: entry.answer || '',
        orderIndex: index,
        source: entry.source || 'manual'
      }))

      const response = await fetch('/api/knowledge-base/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentId,
          knowledgeBaseId,
          entries: updatedEntries
        })
      })

      // Handle non-JSON responses
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(`Server returned unexpected content type: ${contentType}`);
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.details || `HTTP error! status: ${response.status}`)
      }

      if (!data.success) {
        throw new Error(data.error || 'Server returned unsuccessful response')
      }

      // Update local state
      if (data.knowledgeBase?.entries) {
        setEditableEntries(data.knowledgeBase.entries)
        setShowSaved(true)
        setTimeout(() => setShowSaved(false), 3000)
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save changes'
      console.error('Save error:', err)
      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
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
        body: JSON.stringify({ 
          knowledgeBaseId,
          agentId
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to coalesce knowledge base')
      }

      if (!data.success || !data.data?.knowledgeBase) {
        throw new Error('Invalid response from server')
      }

      setKnowledgeBase(data.data.knowledgeBase)
      setShowEntries(false)

    } catch (err) {
      const error = err as Error
      console.error('Coalesce error:', error)
      setError(error?.message || 'Failed to coalesce knowledge base')
    } finally {
      setIsCoalescing(false)
    }
  }

  const handleDelete = async (entryId: string) => {
    if (!entryId || isDeleting) return
    
    try {
      setIsDeleting(true)
      setError(null)

      // Filter out the entry to delete
      const updatedEntries = editableEntries.filter(entry => entry.id !== entryId)
      
      // Reorder remaining entries
      const reorderedEntries = updatedEntries.map((entry, index) => ({
        ...entry,
        orderIndex: index
      }))

      const response = await fetch('/api/knowledge-base/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentId,
          knowledgeBaseId,
          entries: reorderedEntries
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to delete entry')
      }

      if (!data.success || !data.knowledgeBase) {
        throw new Error('Invalid response from server')
      }

      // Update local state with the response from server
      setEditableEntries(data.knowledgeBase.entries)
      
      // Update email/manual entries
      setEmailEntries(data.knowledgeBase.entries.filter((entry: KnowledgeBaseEntry) => 
        entry.source === 'gmail'
      ))
      setManualEntries(data.knowledgeBase.entries.filter((entry: KnowledgeBaseEntry) => 
        entry.source === 'manual'
      ))
      
      // Notify parent component if needed
      if (onUpdate) {
        await onUpdate(data.knowledgeBase.entries)
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete entry'
      console.error('Delete error:', errorMessage)
      setError(errorMessage)
    } finally {
      setIsDeleting(false)
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

  // Move error logging to useEffect
  useEffect(() => {
    if (error) {
      console.error('KnowledgeBaseDisplay error:', error)
    }
  }, [error])

  if (error) {
    console.error('KnowledgeBaseDisplay error:', error)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold"></h2>
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

        </>
      ) : (
        <div className="space-y-4">
          {editableEntries.map((entry) => (
            <Card key={entry.id} className="mb-4">
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{entry.question}</p>
                  {(!entry.answer || entry.answer.trim() === '') && entry.suggestions && entry.suggestions.length > 0 && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <HelpCircle className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent align="end" className="w-[400px]">
                        <div className="space-y-2">
                          <h4 className="font-medium">Suggested Answers:</h4>
                          <div className="space-y-2">
                            {entry.suggestions.map((suggestion, i) => (
                              <div
                                key={i}
                                onClick={() => handleEntryChange(entry.id, suggestion)}
                                className="p-2 hover:bg-muted rounded cursor-pointer text-sm"
                              >
                                {suggestion}
                              </div>
                            ))}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
                <Textarea
                  key={`textarea-${entry.id}`}
                  value={entry.answer || ''}
                  onChange={(e) => handleEntryChange(entry.id, e.target.value)}
                  placeholder="Type your answer here..."
                  rows={4}
                />
                <div className="flex justify-end">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleDelete(entry.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
          
          <Button 
            onClick={handleSave}
            className="w-full mt-4"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </span>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      )}
    </div>
  )
} 