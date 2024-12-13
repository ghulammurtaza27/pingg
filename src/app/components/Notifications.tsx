'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { pusherClient } from '@/lib/pusher'
import { Bell } from 'lucide-react'
import { requestNotificationPermission } from '@/lib/notifications'

export function Notifications() {
  const router = useRouter()

  useEffect(() => {
    console.log('Setting up Pusher subscription...')
    
    // Request notification permission on mount
    requestNotificationPermission().then(granted => {
      console.log('Notification permission:', granted ? 'granted' : 'denied')
    })

    const channel = pusherClient.subscribe('requests')
    console.log('Subscribed to Pusher channel: requests')

    channel.bind('new-request', (data: { 
      id: string
      title: string
      message: string
      url: string
    }) => {
      console.log('Received new request notification:', data)

      // Show toast notification
      toast(
        <div 
          className="cursor-pointer" 
          onClick={() => router.push(data.url)}
        >
          <p className="font-medium">{data.title}</p>
          <p className="text-sm text-gray-400">{data.message}</p>
        </div>,
        {
          duration: 10000,
          icon: <Bell className="h-5 w-5" />,
        }
      )

      // Show system notification
      if (Notification.permission === 'granted') {
        new Notification(data.title, {
          body: data.message,
          icon: '/icon.png',
          data: { url: data.url },
          onClick: function() {
            window.focus()
            router.push(this.data.url)
          }
        })
      }
    })

    // Listen for connection state changes
    pusherClient.connection.bind('state_change', (states: {
      current: string,
      previous: string
    }) => {
      console.log('Pusher connection state changed:', states)
    })

    return () => {
      console.log('Cleaning up Pusher subscription...')
      pusherClient.unsubscribe('requests')
    }
  }, [router])

  return null
} 