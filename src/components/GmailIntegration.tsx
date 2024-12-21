'use client'

import { signIn, useSession } from 'next-auth/react'
import { Button } from '@/app/components/ui/button'
import { useState } from 'react'

export function GmailIntegration() {
  const { data: session } = useSession()
  const [isFetching, setIsFetching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGmailConnect = async () => {
    try {
      await signIn('google', {
        callbackUrl: '/dashboard',
        scope: 'https://www.googleapis.com/auth/gmail.readonly',
      })
    } catch (error) {
      console.error('Gmail connection error:', error)
      setError('Failed to connect Gmail')
    }
  }

  const handleFetchEmails = async () => {
    try {
      setIsFetching(true)
      setError(null)
      
      const response = await fetch('/api/gmail/fetch-emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch emails')
      }

      // Handle successful response
      console.log('Emails fetched:', data)
      
    } catch (error: any) {
      console.error('Error fetching emails:', error)
      setError(error.message || 'Failed to fetch emails')
      
      // If tokens are invalid, reset integration
      if (error.message === 'Gmail not connected' || error.message === 'Invalid tokens') {
        await fetch('/api/user/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            gmailIntegrated: false
          })
        })
        window.location.reload()
      }
    } finally {
      setIsFetching(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <h2 className="text-xl font-semibold">Gmail Integration</h2>
      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}
      <div className="flex flex-col gap-2">
        <Button 
          onClick={handleGmailConnect}
          disabled={session?.user?.gmailIntegrated}
        >
          {session?.user?.gmailIntegrated 
            ? 'Gmail Connected' 
            : 'Connect Gmail'}
        </Button>

        {session?.user?.gmailIntegrated && (
          <Button 
            onClick={handleFetchEmails}
            disabled={isFetching}
            variant="secondary"
          >
            {isFetching ? 'Fetching Emails...' : 'Fetch Emails'}
          </Button>
        )}
      </div>
    </div>
  )
}