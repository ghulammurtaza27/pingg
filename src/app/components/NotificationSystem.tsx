"'use client'"

import { useEffect } from "react"
import { Button } from "@/app/components/ui/button"

export function NotificationSystem() {
  useEffect(() => {
    if (!("Notification" in window)) {

    } else if (Notification.permission === "granted") {

    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then(function (permission) {
        if (permission === "granted") {
         
        }
      })
    }
  }, [])

  const sendNotification = (title: string, body: string) => {
    if (Notification.permission === "granted") {
      new Notification(title, { body })
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Notification System</h2>
      <Button onClick={() => sendNotification("New Relevant Request", "You have a new request with high relevance score.")}>
        Test Notification
      </Button>
    </div>
  )
}

