'use client'

import { useEffect, useState } from 'react'
import { Card } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"

interface RequestData {
  id: string
  summary: string
  considerations: string
  status: string
  relevanceScore: number
  senderAgent: { name: string }
  recipientAgent: { name: string }
  createdAt: string
}

export function RequestDetails({ id }: { id: string }) {
  const [request, setRequest] = useState<RequestData | null>(null)

  useEffect(() => {
    fetch(`/api/requests/${id}`)
      .then(res => res.json())
      .then(data => setRequest(data.request))
  }, [id])

  if (!request) return null

  return (
    <Card className="p-6 bg-[#1c1f2e] border border-[#2a3441]">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-200">Request Details</h2>
          <Badge variant="secondary" className="bg-[#2a3441] text-yellow-500">
            {request.status}
          </Badge>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-gray-400">
            From {request.senderAgent.name} to {request.recipientAgent.name}
          </p>
          <p className="text-gray-200">{request.summary}</p>
          <p className="text-gray-400">{request.considerations}</p>
        </div>
      </div>
    </Card>
  )
} 