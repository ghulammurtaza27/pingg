'use client'

import { useState } from 'react'
import { Button } from "@/app/components/ui/button"
import { Card } from "@/app/components/ui/card"
import { Loader2, FileText, CheckCircle2, AlertCircle } from "lucide-react"
import ReactMarkdown from 'react-markdown'

interface CompetitorData {
  competitor: string
  strengths: string
  weaknesses: string
  marketShare: string
  valueProposition: string
  threatLevel: string
}

function parseCompetitorTable(content: string): CompetitorData[] {
  // Find the competitive analysis section
  const competitiveSection = content.split('Competitive Analysis')[1]?.split('SWOT Analysis')[0]
  if (!competitiveSection) return []

  // Parse table rows
  const rows = competitiveSection
    .split('\n')
    .filter(line => line.includes('|'))
    .map(line => line.split('|').map(cell => cell.trim()).filter(Boolean))
    .filter(row => row.length === 6) // Ensure we have exactly 6 columns
    .filter(row => !row[0].includes('Competitor') && !row[0].includes('---')) // Remove headers and separators

  return rows.map(([competitor, strengths, weaknesses, marketShare, valueProp, threat]) => ({
    competitor: competitor.replace(/\*\*/g, ''), // Remove markdown bold syntax
    strengths,
    weaknesses,
    marketShare,
    valueProposition: valueProp,
    threatLevel: threat
  }))
}

export function RequestAnalysis({ id }: { id: string }) {
  const [analysis, setAnalysis] = useState<string | null>(null)
  const [competitors, setCompetitors] = useState<CompetitorData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateAnalysis = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/requests/${id}`, { method: 'POST' })
      const data = await res.json()
      const analysisContent = data.request.analysis.content
      setAnalysis(analysisContent)
      setCompetitors(parseCompetitorTable(analysisContent))
    } catch (error) {
      console.error('Analysis failed:', error)
      setError('Failed to generate analysis. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const CompetitorTable = () => (
    <div className="my-6 overflow-x-auto rounded-lg border border-gray-700">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-[#2a3441]">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-gray-200">Competitor</th>
            <th className="px-4 py-3 text-left font-medium text-gray-200">Strengths</th>
            <th className="px-4 py-3 text-left font-medium text-gray-200">Weaknesses</th>
            <th className="px-4 py-3 text-left font-medium text-gray-200">Market Share</th>
            <th className="px-4 py-3 text-left font-medium text-gray-200">Value Proposition</th>
            <th className="px-4 py-3 text-left font-medium text-gray-200">Threat Level</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700">
          {competitors.map((comp, i) => (
            <tr key={i} className="hover:bg-[#1f2937]">
              <td className="px-4 py-3 text-gray-300 font-medium">{comp.competitor}</td>
              <td className="px-4 py-3 text-gray-300">{comp.strengths}</td>
              <td className="px-4 py-3 text-gray-300">{comp.weaknesses}</td>
              <td className="px-4 py-3 text-gray-300">{comp.marketShare}</td>
              <td className="px-4 py-3 text-gray-300">{comp.valueProposition}</td>
              <td className="px-4 py-3 text-gray-300">
                <span className={`inline-block px-2 py-1 rounded text-xs font-medium
                  ${comp.threatLevel.toLowerCase() === 'high' ? 'bg-red-500/10 text-red-400' : 
                    comp.threatLevel.toLowerCase() === 'medium' ? 'bg-yellow-500/10 text-yellow-400' : 
                    'bg-green-500/10 text-green-400'}`}>
                  {comp.threatLevel}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  const cleanMarkdownContent = (content: string) => {
    // Remove the competitive analysis section and any duplicate tables
    const sections = content.split('### Competitive Analysis')
    const beforeTable = sections[0] || ''
    const afterTable = sections[1]?.split('### SWOT Analysis')[1] || ''
    
    // Remove the risk assessment table
    const withoutRiskTable = (beforeTable + '### SWOT Analysis' + afterTable)
      .split('## Risk Assessment')
      .map((section, index) => {
        if (index === 1) {
          // Remove the table from the risk assessment section
          return section.split('Financial Implications')[1]
        }
        return section
      })
      .join('## Financial Implications')
    
    return withoutRiskTable
  }

  return (
    <Card className="p-6 bg-[#1c1f2e] border border-[#2a3441]">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-400" />
            <h2 className="text-xl font-semibold text-gray-200">AI Analysis</h2>
          </div>
          
          {!analysis && !loading && (
            <Button
              onClick={generateAnalysis}
              className="bg-blue-500 hover:bg-blue-600 text-white"
              disabled={loading}
            >
              Generate Analysis
            </Button>
          )}
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
            <p className="text-sm text-gray-400">Analyzing request and generating insights...</p>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-red-400 bg-red-400/10 p-4 rounded-lg">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {analysis && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-400 bg-green-400/10 p-3 rounded-lg">
              <CheckCircle2 className="h-5 w-5" />
              <p className="text-sm">Analysis complete</p>
            </div>
            
            <div className="prose prose-invert max-w-none">
              {competitors.length > 0 && (
                <>
                  <h2 className="text-xl font-semibold text-gray-200 mt-6 mb-3">Competitive Analysis</h2>
                  <CompetitorTable />
                </>
              )}
              <ReactMarkdown
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-2xl font-bold text-gray-200 mt-8 mb-4 pb-2 border-b border-gray-700">{children}</h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-xl font-semibold text-gray-200 mt-6 mb-3">{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-lg font-medium text-blue-400 mt-4 mb-2">{children}</h3>
                  ),
                  p: ({ children }) => (
                    <p className="text-gray-300 mb-4 leading-relaxed">{children}</p>
                  ),
                  ul: ({ children }) => (
                    <ul className="space-y-2 mb-4 ml-4">{children}</ul>
                  ),
                  li: ({ children }) => (
                    <li className="text-gray-300 list-disc">{children}</li>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-gray-200">{children}</strong>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-blue-500 pl-4 my-4 text-gray-400 italic">
                      {children}
                    </blockquote>
                  ),
                  table: () => null,
                  thead: () => null,
                  tbody: () => null,
                  tr: () => null,
                  th: () => null,
                  td: () => null,
                }}
              >
                {cleanMarkdownContent(analysis)}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
} 