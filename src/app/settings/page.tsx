"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/app/components/ui/button"
import { Textarea } from "@/app/components/ui/textarea"
import { Label } from "@/app/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/app/components/ui/card"
import { Alert, AlertDescription } from "@/app/components/ui/alert"
import { AlertCircle, CheckCircle2 } from "lucide-react"

type AlertType = 'success' | 'error'

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const [organizationalGoals, setOrganizationalGoals] = useState("")
  const router = useRouter()
  const [alert, setAlert] = useState<{ message: string; type: AlertType } | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      fetchOrganizationalGoals()
    }
  }, [session])

  const fetchOrganizationalGoals = async () => {
    try {
      const response = await fetch("/api/settings/goals")
      if (response.ok) {
        const data = await response.json()
        setOrganizationalGoals(data.goals)
      } else {
        throw new Error("Failed to fetch organizational goals")
      }
    } catch {
      setAlert({ message: "Failed to fetch organizational goals", type: 'error' })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch("/api/settings/goals", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goals: organizationalGoals }),
      })
      if (response.ok) {
        setAlert({ message: "Organizational goals updated successfully.", type: 'success' })
      } else {
        throw new Error("Failed to update organizational goals")
      }
    } catch {
      setAlert({ message: "Failed to update organizational goals", type: 'error' })
    }
  }

  if (status === "loading") {
    return null // Or a loading spinner
  }

  if (!session) {
    return null
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-white dark:bg-zinc-950">
      <Card className="w-[600px]">
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>Update your organizational goals</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="goals">Organizational Goals</Label>
                <Textarea
                  id="goals"
                  value={organizationalGoals}
                  onChange={(e) => setOrganizationalGoals(e.target.value)}
                  placeholder="Enter your organizational goals"
                  rows={6}
                  required
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full">Update Goals</Button>
          </CardFooter>
        </form>
      </Card>
      {alert && (
        <Alert
          variant={alert.type === 'error' ? 'destructive' : 'default'}
          className="fixed bottom-4 right-4 w-auto"
        >
          {alert.type === 'error' ? 
            <AlertCircle className="h-4 w-4" /> : 
            <CheckCircle2 className="h-4 w-4" />
          }
          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}

