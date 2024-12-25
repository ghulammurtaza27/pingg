'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Bot, Zap, Layers } from 'lucide-react'

export function LandingPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow relative">
        {/* Grid pattern background */}
        <div 
          className="fixed inset-0 -z-10 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Cpath d='M0 0h40v40H0V0zm1 1v38h38V1H1z' fill='%23333333'/%3E%3C/svg%3E")`,
            backgroundSize: '40px 40px',
            opacity: '0.07'
          }}
        />

        {/* Hero Section */}
        <section className="relative py-32 md:py-48">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center text-center space-y-8">
              <h1 className="text-5xl md:text-7xl font-bold tracking-tighter">
                Stop Missing Important Emails
              </h1>
              <p className="text-xl md:text-2xl text-gray-400 max-w-[800px]">
                Ping filters emails based on your knowledge base. Only see what matters.
              </p>
            </div>
          </div>
        </section>
        
        {/* Features Section */}
        <section className="py-24 md:py-32">
          <div className="container px-4 md:px-6">
            <div className="grid gap-8 md:grid-cols-3">
              <FeatureCard
                icon={<Bot className="h-8 w-8" />}
                title="Smart Filtering"
                description="AI learns from your knowledge base to prioritize emails that truly matter to you."
              />
              <FeatureCard
                icon={<Zap className="h-8 w-8" />}
                title="Relevance Scoring"
                description="Only see emails that are relevant to your interests or business needs."
              />
              <FeatureCard
                icon={<Layers className="h-8 w-8" />}
                title="Seamless Integration"
                description="Works with your existing email platforms for an effortless setup."
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="relative rounded-lg border border-gray-800 bg-black/50 backdrop-blur-sm p-8">
      <div className="flex flex-col space-y-4">
        {icon}
        <h3 className="text-xl font-semibold">{title}</h3>
        <p className="text-gray-400 leading-relaxed">{description}</p>
      </div>
    </div>
  )
}