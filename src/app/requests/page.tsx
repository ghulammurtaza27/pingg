"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import SendRequest from "@/components/requests/SendRequest"
import RequestsList from "@/components/requests/RequestsList"

export default function RequestsPage() {
  const { data: session } = useSession()
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Agent Requests</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SendRequest />
        <RequestsList />
      </div>
    </div>
  )
} 