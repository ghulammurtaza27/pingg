"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { Bell, User, Menu, X } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu"
import { Badge } from "@/app/components/ui/badge"
import { ThemeToggle } from "@/app/components/theme-toggle"
import { pusherClient } from "@/lib/pusher"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

type Notification = {
  id: string
  message: string
  read: boolean
  url?: string
  createdAt: Date
}

function AccessBanner() {
  return (
    <div className="bg-primary px-4 py-2 text-center text-sm text-primary-foreground">
      For access to the web app, please email{" "}
      <a 
        href="mailto:murtazash123@gmail.com"
        className="font-medium underline hover:opacity-90"
      >
        murtazash123@gmail.com
      </a>
    </div>
  )
}

export function Navbar() {
  const { data: session } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const isLandingPage = pathname === '/' || pathname === '/login' || pathname === '/register'
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!session) return

    // Load existing notifications from API
    fetch('/api/notifications')
      .then(res => res.json())
      .then(data => {
        setNotifications(data.notifications)
      })

    // Subscribe to Pusher channel
    const channel = pusherClient.subscribe('requests')

    channel.bind('new-request', (data: { 
      id: string
      title: string
      message: string
      url: string
    }) => {
      setNotifications(prev => [{
        id: data.id,
        message: data.title,
        read: false,
        url: data.url,
        createdAt: new Date()
      }, ...prev])
    })

    return () => {
      pusherClient.unsubscribe('requests')
    }
  }, [session])

  const unreadCount = notifications.filter(n => !n.read).length

  const markAsRead = async (id: string, navigate: boolean = false) => {
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: 'POST'
      })

      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      ))

      // Only navigate if explicitly requested
      if (navigate) {
        const notification = notifications.find(n => n.id === id)
        if (notification?.url) {
          router.push(notification.url)
        }
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const handleSignOut = async (e: any) => {
    e.preventDefault()
    e.stopPropagation()
    
    try {
      const data = await signOut({
        redirect: false,
        callbackUrl: "/login",
      })
      
      // Clear any local storage or state if needed
      localStorage.clear()
      
      // Manual redirect
      window.location.href = '/login'
    } catch (error) {
      console.error('Sign out error:', error)
      // Fallback redirect
      window.location.href = '/login'
    }
  }

  return (
    <>
      {isLandingPage && <AccessBanner />}
      <nav className="bg-white border-b dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              {session && (
                <div className="flex items-center sm:hidden">
                  <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Menu className="h-6 w-6" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-[240px] sm:hidden">
                      <SheetTitle>Navigation</SheetTitle>
                      <div className="flex flex-col space-y-4 mt-6">
                        <NavLink href="/dashboard">Dashboard</NavLink>
                        <NavLink href="/agents">Agents</NavLink>
                        <NavLink href="/knowledge-base">Knowledge Base</NavLink>
                        <NavLink href="/requests">Requests</NavLink>
                        <NavLink href="/analytics">Analytics</NavLink>
                        <NavLink href="/settings">Settings</NavLink>
                        <NavLink href="/gmail">Gmail</NavLink>
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              )}
              <Link href="/" className="flex-shrink-0 flex items-center">
                <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">pingAI</span>
              </Link>
              {session && (
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  <NavLink href="/dashboard">Dashboard</NavLink>
                  <NavLink href="/agents">Agents</NavLink>
                  <NavLink href="/knowledge-base">Knowledge Base</NavLink>
                  <NavLink href="/requests">Requests</NavLink>
                  <NavLink href="/analytics">Analytics</NavLink>
                  <NavLink href="/settings">Settings</NavLink>
                  <NavLink href="/gmail">Gmail</NavLink>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              {session ? (
                <>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="relative">
                        <Bell className="h-5 w-5" />
                        {unreadCount > 0 && (
                          <Badge variant="destructive" className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs">
                            {unreadCount}
                          </Badge>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80">
                      {notifications.map(notification => (
                        <DropdownMenuItem 
                          key={notification.id} 
                          className={`
                            cursor-pointer group flex items-center
                            ${notification.read ? "opacity-50" : ""}
                          `}
                          onClick={() => {
                            if (notification.url) {
                              markAsRead(notification.id, true)
                            }
                          }}
                        >
                          <div className="flex-1 pr-2">
                            <p className="font-medium">{notification.message}</p>
                            <p className="text-xs text-zinc-500">
                              {new Date(notification.createdAt).toLocaleString()}
                            </p>
                            {!notification.read && (
                              <div className="relative z-50">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="h-7 text-xs mt-1 transition-colors duration-200 ease-in-out
                                             hover:bg-zinc-200 hover:text-zinc-900
                                             dark:hover:bg-zinc-800 dark:hover:text-zinc-50
                                             relative z-50"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    markAsRead(notification.id, false)
                                  }}
                                >
                                  Mark as Read
                                </Button>
                              </div>
                            )}
                          </div>
                          {!notification.read && (
                            <Badge className="shrink-0">New</Badge>
                          )}
                        </DropdownMenuItem>
                      ))}
                      {notifications.length === 0 && (
                        <DropdownMenuItem disabled>No notifications</DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <User className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href="/profile">Profile</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="cursor-pointer text-red-500 focus:text-red-500"
                        onSelect={(e) => {
                          e.preventDefault()
                          handleSignOut(e)
                        }}
                      >
                        Sign out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <>
                  <Button asChild variant="ghost">
                    <Link href="/login">Login</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/register">Register</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  )
}

function NavLink({ href, children, className }: { 
  href: string
  children: React.ReactNode
  className?: string 
}) {
  return (
    <Link 
      href={href} 
      className={cn(
        "inline-flex items-center px-1 pt-1 text-sm font-medium",
        "text-zinc-500 hover:text-zinc-950 hover:border-zinc-900",
        "dark:text-zinc-400 dark:hover:text-zinc-50 dark:hover:border-zinc-50",
        "transition-colors",
        className
      )}
    >
      {children}
    </Link>
  )
}

