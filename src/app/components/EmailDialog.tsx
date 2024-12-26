'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Textarea } from "@/app/components/ui/textarea"
import { useState } from "react"
import { Mail, Sparkles } from "lucide-react"

export function EmailDialog({ 
  isOpen, 
  onClose 
}: { 
  isOpen: boolean
  onClose: () => void
}) {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    window.location.href = `mailto:murtazash123@gmail.com?subject=Ping Early Access Request&body=${encodeURIComponent(message)}`
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] border border-sky-500/20 bg-black/90 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-5 w-5 text-sky-400" />
            Request Early Access
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Please reach out if you&apos;d like access to the web app. We&apos;re currently in private beta.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Input
              placeholder="Your email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="border-sky-500/20 bg-sky-500/5 focus:border-sky-500/40 placeholder:text-gray-500"
            />
          </div>
          <div>
            <Textarea
              placeholder="Tell us a bit about how you plan to use Ping"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              className="min-h-[100px] border-sky-500/20 bg-sky-500/5 focus:border-sky-500/40 placeholder:text-gray-500"
            />
          </div>
          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-sky-400 via-blue-500 to-sky-600 text-white hover:opacity-90"
          >
            <Mail className="mr-2 h-4 w-4" />
            Request Access
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
} 