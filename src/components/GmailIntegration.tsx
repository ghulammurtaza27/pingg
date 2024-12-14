'use client'

import { signIn, useSession } from 'next-auth/react'
import { Button } from '@/app/components/ui/button'

export function GmailIntegration() {
  const { data: session } = useSession()

  const handleGmailConnect = async () => {
    await signIn('google', {
      callbackUrl: '/dashboard',
      scope: 'https://www.googleapis.com/auth/gmail.readonly'
    })
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <h2 className="text-xl font-semibold">Gmail Integration</h2>
      <Button 
        onClick={handleGmailConnect}
        disabled={session?.user?.gmailIntegrated}
      >
        {session?.user?.gmailIntegrated 
          ? 'Gmail Connected' 
          : 'Connect Gmail'}
      </Button>
    </div>
  )
} 