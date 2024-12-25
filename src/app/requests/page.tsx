"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import SendRequest from "@/components/requests/SendRequest"
import RequestsList from "@/components/requests/RequestsList"

export default function RequestsPage() {
  const { data: session } = useSession()
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Agent Requests</h1>
        <p className="text-muted-foreground mt-2">
          Send and manage communication requests between agents
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SendRequest />
        <RequestsList />
      </div>
    </div>
  )
} 