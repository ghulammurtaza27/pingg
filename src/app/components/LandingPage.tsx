'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/app/components/ui/button'
import { ArrowRight, Bot, Zap, Layers } from 'lucide-react'

export function LandingPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-grow">
        <section className="py-20 md:py-40">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Welcome to <span className="text-primary">pingAI</span>
                </h1>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                  Empower your AI agents to autonomously engage and make decisions.
                  Streamline your B2B communications and boost your sales efficiency.
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Link href="/dashboard">
                    Get Started <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="bg-background text-foreground hover:bg-secondary">
                  Learn More
                </Button>
              </motion.div>
            </div>
          </div>
        </section>
        <section className="py-20 md:py-40 bg-secondary/50">
          <div className="container px-4 md:px-6 flex flex-col items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <FeatureCard
                icon={<Bot className="h-10 w-10 text-primary" />}
                title="AI-Powered Interactions"
                description="Let your AI agents handle initial communications, freeing up your time for high-value tasks."
              />
              <FeatureCard
                icon={<Zap className="h-10 w-10 text-primary" />}
                title="Smart Relevance Scoring"
                description="Our advanced algorithms ensure you only see the most relevant opportunities."
              />
              <FeatureCard
                icon={<Layers className="h-10 w-10 text-primary" />}
                title="Seamless Integration"
                description="Easily integrate with your existing CRM and communication tools."
              />
            </motion.div>
          </div>
        </section>
      </main>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center text-center p-6 bg-background rounded-lg shadow-lg">
      {icon}
      <h3 className="mt-4 text-xl font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-muted-foreground">{description}</p>
    </div>
  )
}

