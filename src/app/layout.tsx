import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navbar } from './components/Navbar'
import { ThemeProvider } from "@/app/components/theme-provider"
import AuthProvider from './context/AuthProvider'
import { Toaster } from 'sonner'
import { Notifications } from './components/Notifications'
import { Analytics } from "@vercel/analytics/react"

const inter = Inter({ subsets: ['latin'] })



export const metadata: Metadata = {
  title: 'Ping - Stop Missing Important Emails',
  description: 'Your knowledge base filters your inbox. Only see the emails that truly matter.',
  openGraph: {
    title: 'Ping - Stop Missing Important Emails',
    description: 'Your knowledge base filters your inbox. Only see the emails that truly matter.',
    url: 'https://pingg-henna.vercel.app', 
    siteName: 'Ping',
    images: [
      {
        url: 'https://pingg-henna.vercel.app/ping-og-image.png',
        width: 1200,
        height: 630,
        alt: 'Ping - Smart Email Management'
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ping - Stop Missing Important Emails',
    description: 'Your knowledge base filters your inbox. Only see the emails that truly matter.',
    images: ['https://pingg-henna.vercel.app/ping-og-image.png'],
  },
  icons: {
    icon: [
      {
        url: 'https://pingg-henna.vercel.app/ping-favicon-black.svg',
        type: 'image/svg+xml',
      }
    ],
    shortcut: 'https://pingg-henna.vercel.app/ping-favicon-black.svg',
    apple: [
      {
        url: 'https://pingg-henna.vercel.app  /ping-favicon-black.svg',
        type: 'image/svg+xml',
      }
    ]
  },
  manifest: 'https://pingg-henna.vercel.app/ping-favicon-black.svg',
  themeColor: '#000000', // Changed to black to match the new theme
  appleWebApp: {
    title: 'Ping',
    statusBarStyle: 'default',
    capable: true
  }
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
        <Analytics />
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

