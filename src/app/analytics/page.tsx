'use client'

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'

type AnalyticsData = {
  totalRequests: number
  averageRelevanceScore: number
  acceptedRequests: number
  rejectedRequests: number
  pendingRequests: number
}

function AnalyticsCard({ title, description, value }: { title: string; description: string; value: number | string }) {
  return (
    <Card className="bg-white text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">{value}</p>
      </CardContent>
    </Card>
  )
}

export default function AnalyticsPage() {
  const { data: session, status } = useSession()
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('/api/analytics')
        if (!response.ok) throw new Error('Failed to fetch analytics')
        const data = await response.json()
        setAnalyticsData(data)
      } catch (error) {
        console.error('Error fetching analytics:', error)
      }
    }

    if (session) {
      fetchAnalytics()
    }
  }, [session])

  if (status === "loading") {
    return <div className="container mx-auto py-8">Loading...</div>
  }

  if (!session) {
    return null
  }

  return (
    <div className="container mx-auto py-8 bg-white dark:bg-zinc-950">
      <h1 className="text-3xl font-bold mb-6 text-zinc-950 dark:text-zinc-50">Analytics</h1>
      {analyticsData ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnalyticsCard
            title="Total Requests"
            description="Number of requests processed"
            value={analyticsData.totalRequests}
          />
          <AnalyticsCard
            title="Average Relevance Score"
            description="Mean relevance score of all requests"
            value={analyticsData.averageRelevanceScore.toFixed(2)}
          />
          <AnalyticsCard
            title="Accepted Requests"
            description="Number of accepted requests"
            value={analyticsData.acceptedRequests}
          />
          <AnalyticsCard
            title="Rejected Requests"
            description="Number of rejected requests"
            value={analyticsData.rejectedRequests}
          />
          <AnalyticsCard
            title="Pending Requests"
            description="Number of pending requests"
            value={analyticsData.pendingRequests}
          />
        </div>
      ) : (
        <p className="text-zinc-500 dark:text-zinc-400">Loading analytics data...</p>
      )}
    </div>
  )
}

