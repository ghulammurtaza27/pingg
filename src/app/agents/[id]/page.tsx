import { use } from 'react'
import { Suspense } from 'react'
import AgentDetails from './AgentDetails'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Agent Details',
  description: 'View agent details',
}

export default function AgentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  
  return (
    <Suspense fallback={<div className="container mx-auto py-8">Loading...</div>}>
      <AgentDetails id={id} />
    </Suspense>
  )
}