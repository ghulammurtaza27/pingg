/* eslint-disable react/no-unescaped-entities */
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

const stats = [
  { number: '2x', label: 'Faster Email Processing' },
  { number: '90%', label: 'Less Email Anxiety' },
  { number: '24/7', label: 'AI-Powered Filtering' },
  { number: '1-Click', label: 'Gmail Integration' }
]

const features = [
  {
    icon: <Bot className="h-6 w-6" />,
    title: 'Context Aware',
    description: 'Your knowledge base trains the AI to understand what matters to you.'
  },
  {
    icon: <Zap className="h-6 w-6" />,
    title: 'Relevance Scoring',
    description: 'Only see emails that are relevant to your interests or business needs.'
  },
  {
    icon: <Layers className="h-6 w-6" />,
    title: 'Seamless Integration',
    description: 'Works with your existing email platforms for an effortless setup.'
  }
]

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
        <section className="min-h-[90vh] relative overflow-hidden pt-20 pb-32">
          <div className={styles.container}>
            <div className="flex flex-col md:flex-row items-center gap-12 md:gap-0">
              {/* Content container */}
              <div className="relative z-10 w-full md:max-w-[60%]">
                <div className="space-y-8 md:space-y-16">
                  {/* Badge */}
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

                  {/* Heading */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="space-y-6 md:space-y-8"
                  >
                    <h1 className="text-[2.5rem] sm:text-[3.5rem] md:text-[5rem] lg:text-[6.5rem] font-bold tracking-tight leading-[1] md:leading-[0.95]">
                      <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/70">
                        Make email work for you
                      </span>
                    </h1>
                    <p className="text-base sm:text-lg md:text-xl text-gray-400 font-light tracking-wide leading-relaxed max-w-xl">
                      AI-powered email filtering that understands your context. 
                      Press <kbd className="px-2 py-1 bg-sky-500/10 rounded-md border border-sky-500/20 font-mono text-sm text-sky-400">R</kbd> to begin.
                    </p>
                  </motion.div>

                  {/* Buttons */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                    className="flex flex-col sm:flex-row gap-4"
                  >
                    <Button 
                      size="lg"
                      className={`${styles.gradient} text-white hover:opacity-90 text-base px-8 h-12 rounded-full shadow-lg shadow-sky-500/20 w-full sm:w-auto`}
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
                      className="text-base px-8 h-12 rounded-full border-sky-500/20 hover:bg-sky-500/10 text-sky-400 w-full sm:w-auto"
                      onClick={() => setIsEmailDialogOpen(true)}
                    >
                      Contact
                    </Button>
                  </motion.div>
                </div>
              </div>

              {/* Hero Animation - now part of the flex layout */}
              <div className="w-full md:w-auto md:absolute md:right-[15%] md:top-1/2 md:-translate-y-1/2">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.8 }}
                >
                  <HeroAnimation />
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-24 relative border-t border-sky-500/10">
          <div className={styles.container}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
              {stats.map((stat, i) => (
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
              {features.map((feature, i) => (
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
                Let&apos;s make something amazing, together.
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