'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Mail, Star, Clock } from 'lucide-react'

export function HeroAnimation() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="relative w-full md:w-[35vw] h-[40vh] min-h-[300px] opacity-70 pointer-events-none select-none">
      <div className="absolute inset-0 flex items-center justify-center md:justify-start">
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="absolute"
            initial={{ 
              y: 40 * i,
              x: -20 * i,
              opacity: 1 - (i * 0.2),
              scale: 1 - (i * 0.05),
            }}
            animate={{
              y: [40 * i, -20, 40 * i],
              opacity: [1 - (i * 0.2), 1, 1 - (i * 0.2)],
            }}
            transition={{
              duration: 5,
              delay: i * 0.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <div className="relative w-[300px] h-[120px]">
              <div className="absolute inset-0 rounded-xl bg-black/90 border border-sky-500/30 shadow-lg shadow-sky-500/20 p-4 backdrop-blur-sm">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${i === 0 ? 'bg-sky-500/20' : 'bg-gray-800/50'}`}>
                    <Mail className={`h-5 w-5 ${i === 0 ? 'text-sky-400' : 'text-gray-400'}`} />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="h-2.5 w-2/3 rounded-full bg-gradient-to-r from-sky-400 to-blue-500" />
                    <div className="h-2 w-1/2 rounded-full bg-gray-700" />
                  </div>
                  <div className="flex gap-2">
                    {i === 0 && <Star className="h-5 w-5 text-yellow-500" />}
                    {i === 1 && <Clock className="h-5 w-5 text-gray-400" />}
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="h-2 w-full rounded-full bg-gray-700/50" />
                  <div className="h-2 w-4/5 rounded-full bg-gray-700/50" />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
} 