import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AgentSetup } from "../components/AgentSetup"
import { AgentManagement } from "../components/AgentManagement"
import { RequestGeneration } from "../components/RequestGeneration"
import { DecisionDashboard } from "../components/DecisionDashboard"

export default async function Dashboard() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <div className="space-y-6">
        <AgentSetup />
        <AgentManagement />
        <RequestGeneration />
        <DecisionDashboard />
      </div>
    </div>
  )
}

