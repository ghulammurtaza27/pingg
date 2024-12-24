import { Suspense } from 'react'
import { RequestDetails } from './RequestDetails'
import { RequestAnalysis } from './RequestAnalysis'
import { Loading } from '../../components/Loading'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function RequestPage({ params }: PageProps) {
  const { id } = await params

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