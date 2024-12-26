'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Bot, Zap, Layers, ArrowRight, Mail } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { EmailDialog } from './EmailDialog'
import { HeroAnimation } from './HeroAnimation'
import { Footer } from './Footer'

const styles = {
  container: "max-w-[120rem] mx-auto px-6 md:px-12 lg:px-24",
  badge: "inline-flex items-center rounded-full px-5 py-1.5 text-sm font-medium tracking-wide",
  heading: "text-[2.5rem] sm:text-[3.5rem] md:text-[5rem] lg:text-[6.5rem] font-bold tracking-tight leading-[0.95]",
  gradient: "bg-gradient-to-r from-sky-400 via-blue-500 to-sky-600",
}

export function LandingPage() {
  const [mounted, setMounted] = useState(false)
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'r') setIsEmailDialogOpen(true)
    }
    window.addEventListener('keypress', handleKeyPress)
    return () => window.removeEventListener('keypress', handleKeyPress)
  }, [])

  if (!mounted) return null

  return (
    <div className="flex flex-col min-h-screen overflow-hidden bg-black selection:bg-sky-500/20 selection:text-sky-200">
      <main className="flex-grow relative">
        {/* Enhanced gradient background */}
        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-900/20 via-black to-black" />
          <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
          <div className="absolute inset-0 backdrop-blur-3xl" />
        </div>

        {/* Hero Section */}
        <section className="min-h-[90vh] flex items-center relative overflow-hidden pt-20 pb-32">
          <div className={styles.container}>
            <div className="max-w-[60%] relative z-10">
              <div className="space-y-16">
                {/* Enhanced badge */}
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.8 }}
                >
                  <span className={`${styles.badge} bg-sky-500/10 backdrop-blur-sm border border-sky-500/20 shadow-lg shadow-sky-500/20`}>
                    <Mail className="w-4 h-4 mr-2 text-sky-400" />
                    <span className={`${styles.gradient} bg-clip-text text-transparent`}>
                      Intelligent Email Management
                    </span>
                  </span>
                </motion.div>

                {/* Enhanced heading */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  className="space-y-8"
                >
                  <h1 className={styles.heading}>
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/70">
                      Make email work for you
                    </span>
                  </h1>
                  <p className="text-lg md:text-xl text-gray-400 font-light tracking-wide leading-relaxed max-w-xl">
                    AI-powered email filtering that understands your context. 
                    Press <kbd className="px-2 py-1 bg-sky-500/10 rounded-md border border-sky-500/20 font-mono text-sm text-sky-400">R</kbd> to begin.
                  </p>
                </motion.div>

                {/* Enhanced CTA buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.8 }}
                  className="flex flex-wrap gap-4"
                >
                  <Button 
                    size="lg"
                    className={`${styles.gradient} text-white hover:opacity-90 text-base px-8 h-12 rounded-full shadow-lg shadow-sky-500/20`}
                    asChild
                  >
                    <Link href="/register">
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="text-base px-8 h-12 rounded-full border-sky-500/20 hover:bg-sky-500/10 text-sky-400"
                    onClick={() => setIsEmailDialogOpen(true)}
                  >
                    Contact
                  </Button>
                </motion.div>
              </div>
            </div>
          </div>
          <HeroAnimation />
        </section>

        {/* Stats Section */}
        <section className="py-24 relative border-t border-sky-500/10">
          <div className={styles.container}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
              {[
                { number: "2x", label: "Faster Email Processing" },
                { number: "90%", label: "Less Email Anxiety" },
                { number: "24/7", label: "AI-Powered Filtering" },
                { number: "1-Click", label: "Gmail Integration" },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.8 }}
                  viewport={{ once: true }}
                  className="text-center space-y-2"
                >
                  <div className={`text-3xl md:text-4xl font-bold ${styles.gradient} bg-clip-text text-transparent`}>
                    {stat.number}
                  </div>
                  <div className="text-sm text-gray-400">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-32 relative border-t border-sky-500/10">
          <div className={styles.container}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-4 text-center mb-24"
            >
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                We specialize in email intelligence
              </h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                Building the future of email management with AI
              </p>
            </motion.div>

            <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
              {[
                {
                  icon: <Bot className="h-6 w-6" />,
                  title: "Context Aware",
                  description: "Your knowledge base trains the AI to understand what matters to you."
                },
                {
                  icon: <Zap className="h-6 w-6" />,
                  title: "Relevance Scoring",
                  description: "Only see emails that are relevant to your interests or business needs."
                },
                {
                  icon: <Layers className="h-6 w-6" />,
                  title: "Seamless Integration",
                  description: "Works with your existing email platforms for an effortless setup."
                }
              ].map((feature, i) => (
                <FeatureCard key={feature.title} {...feature} delay={i * 0.2} />
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-32 relative border-t border-sky-500/10">
          <div className={styles.container}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center max-w-3xl mx-auto space-y-8"
            >
              <h3 className="text-3xl md:text-4xl font-bold tracking-tight">
                those who are crazy enough to think
                <br />
                they can change email, are the ones who do
              </h3>
              <p className="text-gray-400 text-lg">
                Let's make something amazing, together.
              </p>
              <Button 
                size="lg" 
                className={`${styles.gradient} text-white hover:opacity-90 text-base px-8 h-12 rounded-full shadow-lg shadow-sky-500/20 mt-4`}
                onClick={() => setIsEmailDialogOpen(true)}
              >
                Get in touch
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
          </div>
        </section>
      </main>
      
      <Footer />
      <EmailDialog 
        isOpen={isEmailDialogOpen} 
        onClose={() => setIsEmailDialogOpen(false)} 
      />
    </div>
  )
}

function FeatureCard({ 
  icon, 
  title, 
  description, 
  delay 
}: { 
  icon: React.ReactNode
  title: string
  description: string
  delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.8 }}
      viewport={{ once: true }}
      className="group relative"
    >
      <div className="relative space-y-6 p-8 rounded-2xl border border-sky-500/10 bg-sky-500/5 backdrop-blur-sm hover:bg-sky-500/10 transition-colors">
        <div className="p-3 w-fit rounded-xl bg-sky-500/10 border border-sky-500/20">
          {icon}
        </div>
        <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
        <p className="text-gray-400 leading-relaxed text-sm">{description}</p>
      </div>
    </motion.div>
  )
}