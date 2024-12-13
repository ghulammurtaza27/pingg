import { Suspense } from 'react'
import { RequestDetails } from './RequestDetails'
import { RequestAnalysis } from './RequestAnalysis'
import { Loading } from '../../components/Loading'

export default function RequestPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const { id } = params

  return (
    <div className="space-y-8 p-6">
      <Suspense fallback={<Loading />}>
        <RequestDetails id={id} />
      </Suspense>

      <Suspense fallback={<Loading />}>
        <RequestAnalysis id={id} />
      </Suspense>
    </div>
  )
} 