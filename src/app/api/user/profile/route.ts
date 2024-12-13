import { NextResponse } from 'next/server'
import { getServerSession } from "next-auth/next"
import { nextAuthConfig } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Session } from 'next-auth'

type ValidSession = Session & {
  user: {
    id: string
  }
}

function isValidSession(session: unknown): session is ValidSession {
  return Boolean(
    session &&
    typeof session === 'object' &&
    'user' in session &&
    session.user &&
    typeof session.user === 'object' &&
    'id' in session.user &&
    typeof session.user.id === 'string'
  )
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(nextAuthConfig)

    if (!session || !isValidSession(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, email, preferences } = body

    if (!name || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // First update the user
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { name, email },
    })

    // Then handle preferences if they exist
    if (preferences) {
      // Check if preferences exist
      const existingPrefs = await prisma.userPreferences.findUnique({
        where: { userId: session.user.id }
      })

      if (existingPrefs) {
        // Update existing preferences
        await prisma.userPreferences.update({
          where: { userId: session.user.id },
          data: {
            emailNotifications: preferences.emailNotifications,
            pushNotifications: preferences.pushNotifications,
            darkMode: preferences.darkMode,
            language: preferences.language
          }
        })
      } else {
        // Create new preferences
        await prisma.userPreferences.create({
          data: {
            userId: session.user.id,
            emailNotifications: preferences.emailNotifications ?? true,
            pushNotifications: preferences.pushNotifications ?? true,
            darkMode: preferences.darkMode ?? true,
            language: preferences.language ?? 'en'
          }
        })
      }
    }

    // Get final user state
    const finalUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { preferences: true }
    })

    return NextResponse.json({ 
      message: "Profile updated successfully",
      user: finalUser
    })

  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

