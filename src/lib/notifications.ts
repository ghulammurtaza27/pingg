import { toast } from 'sonner'

export async function requestNotificationPermission() {
  try {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  } catch (error) {
    console.error('Error requesting notification permission:', error)
    return false
  }
}

export function showNotification(title: string, options: NotificationOptions & { url?: string }) {
  if (!('Notification' in window)) {
    toast.error('This browser does not support notifications')
    return
  }

  if (Notification.permission === 'granted') {
    const notification = new Notification(title, {
      ...options,
      icon: '/icon.png', // Add your app icon
    })

    notification.onclick = () => {
      if (options.url) {
        window.focus()
        window.location.href = options.url
      }
    }
  }
} 