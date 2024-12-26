'use client'

import { motion } from 'framer-motion'
import { Brain, Filter, Mail, Database, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const gradientClasses = {
  background: "bg-gradient-to-r from-sky-500 to-blue-600",
  backgroundHover: "hover:from-sky-600 hover:to-blue-700",
  text: "bg-gradient-to-r from-sky-400 to-blue-400",
  border: "border-sky-500/20",
  borderHover: "hover:border-sky-500/50",
  bgTranslucent: "from-sky-900/50 to-blue-900/50",
  iconBg: "from-sky-500/20 to-blue-500/20"
}

export default function HowItWorks() {
  const steps = [
    {
      icon: <Database className="h-8 w-8" />,
      title: "Build Your Knowledge Base",
      description: "Add your important documents, contacts, and business context to create a personalized knowledge base."
    },
    {
      icon: <Mail className="h-8 w-8" />,
      title: "Connect Your Email",
      description: "Securely connect your Gmail account with just a few clicks. We never store your emails."
    },
    {
      icon: <Brain className="h-8 w-8" />,
      title: "AI Analysis",
      description: "Our AI analyzes incoming emails against your knowledge base to determine relevance."
    },
    {
      icon: <Filter className="h-8 w-8" />,
      title: "Smart Filtering",
      description: "Emails are automatically scored and filtered, ensuring you never miss important messages."
    }
  ]

  return (
    <div className="min-h-screen relative">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-900/20 via-black to-black" />
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          {/* Header Section */}
          <div className="max-w-3xl mx-auto text-center mb-20">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className={`inline-block rounded-full bg-gradient-to-r ${gradientClasses.iconBg} border ${gradientClasses.border} px-4 py-2 mb-8`}
            >
              <span className={`text-sm font-medium ${gradientClasses.text} bg-clip-text text-transparent`}>
                Simple 4-Step Process
              </span>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500"
            >
              How Ping Works
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-xl text-gray-400"
            >
              Our intelligent email filtering system helps you focus on what matters most.
            </motion.p>
          </div>

          {/* Steps Section */}
          <div className="relative max-w-5xl mx-auto">
            {/* Connecting Line */}
            <div className={`absolute left-8 top-10 bottom-10 w-px bg-gradient-to-b ${gradientClasses.bgTranslucent} hidden md:block`} />

            <div className="grid gap-12 md:gap-16">
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.2, duration: 0.8 }}
                  viewport={{ once: true }}
                  className="relative flex flex-col md:flex-row gap-8 items-center md:items-start group"
                >
                  <div className={`flex-shrink-0 w-16 h-16 flex items-center justify-center rounded-2xl bg-gradient-to-br ${gradientClasses.iconBg} border ${gradientClasses.border} ${gradientClasses.borderHover} transition-colors`}>
                    {step.icon}
                  </div>
                  <div className="flex-1 md:pt-3">
                    <h3 className="text-2xl font-semibold mb-4 text-center md:text-left">{step.title}</h3>
                    <p className="text-gray-400 leading-relaxed text-center md:text-left">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            viewport={{ once: true }}
            className="mt-20 text-center"
          >
            <div className="inline-flex flex-col items-center gap-4">
              <h3 className="text-2xl font-semibold mb-2">Ready to get started?</h3>
              <Button 
                size="lg" 
                className={`${gradientClasses.background} ${gradientClasses.backgroundHover} text-lg px-8`}
                asChild
              >
                <Link href="/register">
                  Try Ping Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
} 