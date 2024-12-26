'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Bot, Zap, Layers, ArrowRight, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

const gradientClasses = {
  background: "bg-gradient-to-r from-sky-500 to-blue-600",
  backgroundHover: "hover:from-sky-600 hover:to-blue-700",
  text: "bg-gradient-to-r from-sky-400 to-blue-400",
  border: "border-sky-500/20",
  borderHover: "hover:border-sky-500/50",
  bgTranslucent: "from-sky-900/50 to-blue-900/50",
  iconBg: "from-sky-500/20 to-blue-500/20"
}

export function LandingPage() {
  const [mounted, setMounted] = useState(false)

  const benefits = [
    "Never miss important emails",
    "Save hours of email sorting",
    "Reduce email anxiety",
    "Focus on what matters"
  ]

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="flex flex-col min-h-screen overflow-hidden">
      <main className="flex-grow relative">
        {/* Animated gradient background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-900/20 via-black to-black" />
          <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
        </div>

        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center py-32 md:py-48">
          <div className="container px-4 md:px-6 mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="flex flex-col items-center text-center space-y-8 max-w-4xl mx-auto"
            >
              {/* Floating badge */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className={`rounded-full bg-gradient-to-r ${gradientClasses.iconBg} border ${gradientClasses.border} px-4 py-2 mb-8`}
              >
                <span className={`text-sm font-medium ${gradientClasses.text} bg-clip-text text-transparent`}>
                  Intelligent Email Management
                </span>
              </motion.div>

              <motion.h1
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="text-5xl md:text-7xl font-bold tracking-tighter"
              >
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">
                  Stop Missing Important Emails
                </span>
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className="text-xl md:text-2xl text-gray-400 max-w-[800px]"
              >
                Ping filters emails based on your knowledge base. Only see what matters.
              </motion.p>

              {/* Benefits list */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="grid grid-cols-2 gap-4 mt-8"
              >
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={benefit}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.1, duration: 0.6 }}
                    className="flex items-center space-x-2"
                  >
                    <CheckCircle2 className="h-5 w-5 text-sky-500" />
                    <span className="text-gray-300">{benefit}</span>
                  </motion.div>
                ))}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="flex flex-col sm:flex-row gap-4 mt-8"
              >
                <Button 
                  size="lg" 
                  className={`${gradientClasses.background} ${gradientClasses.backgroundHover} text-lg px-8`}
                  asChild
                >
                  <Link href="/register">
                    Get Started
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Link href="/how-it-works">
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="text-lg px-8 border-gray-700 hover:bg-gray-800"
                  >
                    Learn More
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>
        
        {/* Features Section */}
        <section className="py-24 md:py-32 relative">
          <div className="container px-4 md:px-6 mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Powerful Features
              </h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                Everything you need to take control of your inbox
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto"
            >
              <FeatureCard
                icon={<Bot className="h-8 w-8" />}
                title="Smart Filtering"
                description="AI learns from your knowledge base to prioritize emails that truly matter to you."
                delay={0}
                gradientClasses={gradientClasses}
              />
              <FeatureCard
                icon={<Zap className="h-8 w-8" />}
                title="Relevance Scoring"
                description="Only see emails that are relevant to your interests or business needs."
                delay={0.2}
                gradientClasses={gradientClasses}
              />
              <FeatureCard
                icon={<Layers className="h-8 w-8" />}
                title="Seamless Integration"
                description="Works with your existing email platforms for an effortless setup."
                delay={0.4}
                gradientClasses={gradientClasses}
              />
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 relative">
          <div className="container px-4 md:px-6 mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className={`relative rounded-2xl overflow-hidden bg-gradient-to-r ${gradientClasses.bgTranslucent} p-8 md:p-12`}
            >
              <div className="relative z-10 text-center max-w-2xl mx-auto">
                <h3 className="text-2xl md:text-3xl font-bold mb-4">
                  Ready to transform your inbox?
                </h3>
                <p className="text-gray-300 mb-8">
                  Join thousands of professionals who have already simplified their email workflow.
                </p>
                <Button 
                  size="lg" 
                  className={`${gradientClasses.background} ${gradientClasses.backgroundHover} text-lg px-8`}
                  asChild
                >
                  <Link href="/register">
                    Get Started Now
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
    </div>
  )
}

function FeatureCard({ 
  icon, 
  title, 
  description, 
  delay,
  gradientClasses 
}: { 
  icon: React.ReactNode
  title: string
  description: string
  delay: number
  gradientClasses: {
    background: string
    backgroundHover: string
    text: string
    border: string
    borderHover: string
    bgTranslucent: string
    iconBg: string
  }
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.8 }}
      viewport={{ once: true }}
      whileHover={{ scale: 1.05 }}
      className={`relative rounded-lg border border-gray-800 bg-black/50 backdrop-blur-sm p-8 ${gradientClasses.borderHover} transition-all`}
    >
      <div className="flex flex-col space-y-4">
        <div className={`p-2 w-fit rounded-lg bg-gradient-to-br ${gradientClasses.iconBg}`}>
          {icon}
        </div>
        <h3 className="text-xl font-semibold">{title}</h3>
        <p className="text-gray-400 leading-relaxed">{description}</p>
      </div>
    </motion.div>
  )
}