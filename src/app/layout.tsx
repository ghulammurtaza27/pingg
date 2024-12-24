import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navbar } from './components/Navbar'
import { ThemeProvider } from "@/app/components/theme-provider"
import AuthProvider from './context/AuthProvider'
import { Toaster } from 'sonner'
import { Notifications } from './components/Notifications'

const inter = Inter({ subsets: ['latin'] })



export const metadata: Metadata = {
  title: 'pingAI - AI Agent Interaction Platform',
  description: 'Empower your AI agents to autonomously engage and make decisions',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <div className="min-h-screen bg-background">
              <Navbar />
              <main>
                {children}
              </main>
            </div>
          </AuthProvider>
        </ThemeProvider>
        <Toaster 
          position="top-right" 
          richColors 
          theme="dark"
          closeButton
        />
        <Notifications />
      </body>
    </html>
  )
}

