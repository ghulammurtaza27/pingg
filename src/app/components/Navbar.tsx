"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { Bell, User } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu"
import { Badge } from "@/app/components/ui/badge"
import { ThemeToggle } from "@/app/components/theme-toggle"

type Notification = {
  id: number
  message: string
  read: boolean
}

export function Navbar() {
  const { data: session } = useSession()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: 1, message: "New high-relevance request received", read: false },
    { id: 2, message: "Agent 'Sales-1' has been activated", read: false },
  ])

  const unreadCount = notifications.filter(n => !n.read).length

  const markAsRead = (id: number) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ))
  }

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push("/login")
  }

  return (
    <nav className="bg-white border-b dark:bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">pingAI</span>
            </Link>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <NavLink href="/dashboard">Dashboard</NavLink>
              <NavLink href="/agents">Agents</NavLink>
              <NavLink href="/knowledge-base">Knowledge Base</NavLink>
              <NavLink href="/requests">Requests</NavLink>
              <NavLink href="/analytics">Analytics</NavLink>
              <NavLink href="/settings">Settings</NavLink>
            </div>
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
                      <DropdownMenuItem key={notification.id} onSelect={() => markAsRead(notification.id)}>
                        <div className={`flex items-center space-x-2 ${notification.read ? "'opacity-50'" : "''"}`}>
                          <div className="flex-1">{notification.message}</div>
                          {!notification.read && <Badge>New</Badge>}
                        </div>
                      </DropdownMenuItem>
                    ))}
                    {notifications.length === 0 && (
                      <DropdownMenuItem disabled>No new notifications</DropdownMenuItem>
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
                    <DropdownMenuItem onSelect={handleSignOut}>
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
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link 
      href={href} 
      className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-zinc-500 hover:text-zinc-950 hover:border-zinc-900 transition-colors dark:text-zinc-400 dark:hover:text-zinc-50 dark:hover:border-zinc-50"
    >
      {children}
    </Link>
  )
}

