"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/app/components/ui/card"
import { Alert, AlertDescription } from "@/app/components/ui/alert"
import { AlertCircle, CheckCircle2 } from "lucide-react"

type AlertType = 'success' | 'error'

export default function ProfilePage() {
  const { data: session, update } = useSession()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const router = useRouter()
  const [alert, setAlert] = useState<{ message: string; type: AlertType } | null>(null)

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || "")
      setEmail(session.user.email || "")
    }
  }, [session])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      })
      if (response.ok) {
        await update({ name, email })
        setAlert({ message: "Profile updated successfully.", type: 'success' as AlertType })
      } else {
        throw new Error("Failed to update profile")
      }
    } catch {
      setAlert({ message: "Failed to update profile", type: 'error' as AlertType })
    }
  }

  if (!session) {
    router.push("/login")
    return null
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your profile information</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  required
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full">Update Profile</Button>
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

