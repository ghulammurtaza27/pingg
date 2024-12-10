import { getServerSession } from "next-auth/next"
import { nextAuthConfig } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AgentSetup } from "../components/AgentSetup"
import { AgentManagement } from "../components/AgentManagement"

export default async function DashboardPage() {
  const session = await getServerSession(nextAuthConfig)

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      <div className="grid gap-6">
        <AgentSetup />
        <AgentManagement />
      </div>
    </div>
  )
}

