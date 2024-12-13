import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    // Add any custom middleware logic here if needed
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    },
    pages: {
      signIn: '/login',
    }
  }
)

export const config = {
  matcher: [
    "/requests/:path*",
    "/agents/:path*",
    "/knowledge-base/:path*",
    "/analytics/:path*",
    "/settings/:path*",
    "/profile/:path*",
    // Add any other protected routes here
  ]
} 