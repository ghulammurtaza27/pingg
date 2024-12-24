import { getServerSession } from "next-auth/next"
import { nextAuthConfig } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AgentSetup } from "@/app/components/AgentSetup"
import { AgentManagement } from "@/app/components/AgentManagement"
import { RequestsOverview } from "@/app/components/RequestsOverview"
import { KnowledgeBaseOverview } from "@/app/components/KnowledgeBaseOverview"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function DashboardPage() {
  const session = await getServerSession(nextAuthConfig)

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
          <TabsTrigger value="knowledge">Knowledge Bases</TabsTrigger>
        </TabsList>
      

        <TabsContent value="overview">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Your Agent</CardTitle>
              </CardHeader>
              <CardContent>
                <AgentSetup />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <RequestsOverview />
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Knowledge Base Status</CardTitle>
              </CardHeader>
              <CardContent>
                <KnowledgeBaseOverview detailed={false} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="agents">
          <Card>
            <CardHeader>
              <CardTitle>Agent Management</CardTitle>
            </CardHeader>
            <CardContent>
              <AgentManagement />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests">
          <Card>
            <CardHeader>
              <CardTitle>Request History</CardTitle>
            </CardHeader>
            <CardContent>
              <RequestsOverview detailed={true} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="knowledge">
          <Card>
            <CardHeader>
              <CardTitle>Knowledge Base Management</CardTitle>
            </CardHeader>
            <CardContent>
              <KnowledgeBaseOverview detailed={true} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
