import { Suspense } from 'react'
import AgentDetails from './AgentDetails'

export default function AgentPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div className="container mx-auto py-8">Loading...</div>}>
      <AgentDetails id={params.id} />
    </Suspense>
  )
} 