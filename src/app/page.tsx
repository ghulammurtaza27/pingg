import { getServerSession } from "next-auth/next"
import { nextAuthConfig } from "@/lib/auth"
import { LandingPage } from "./components/LandingPage"
import { redirect } from "next/navigation"

export default async function Home() {
  const session = await getServerSession(nextAuthConfig)

  if (!session) {
    return <LandingPage />
  }

  redirect("/agents")
}

