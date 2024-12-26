'use client'

import Link from 'next/link'
import { Github, Twitter } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t border-gray-800">
      <div className="max-w-[120rem] mx-auto px-6 md:px-12 lg:px-24 py-12 md:py-16">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="space-y-4">
            <div className="text-xl font-semibold">ping</div>
            <p className="text-sm text-gray-400 max-w-[20rem]">
              Making email work for humans
            </p>
          </div>
          
          <div className="flex flex-col md:flex-row gap-8 md:gap-16">
            <div className="space-y-4">
              <div className="text-sm font-medium">Links</div>
              <nav className="flex flex-col gap-3">
                <Link href="/about" className="text-sm text-gray-400 hover:text-gray-300 transition-colors">
                  About
                </Link>
                <Link href="/blog" className="text-sm text-gray-400 hover:text-gray-300 transition-colors">
                  Blog
                </Link>
                <Link href="/privacy" className="text-sm text-gray-400 hover:text-gray-300 transition-colors">
                  Privacy
                </Link>
              </nav>
            </div>

            <div className="space-y-4">
              <div className="text-sm font-medium">Connect</div>
              <nav className="flex flex-col gap-3">
                <a 
                  href="https://twitter.com/yourusername" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-gray-400 hover:text-gray-300 transition-colors inline-flex items-center gap-2"
                >
                  <Twitter className="h-4 w-4" />
                  <span>Twitter</span>
                </a>
                <a 
                  href="https://github.com/yourusername/ping" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-gray-400 hover:text-gray-300 transition-colors inline-flex items-center gap-2"
                >
                  <Github className="h-4 w-4" />
                  <span>GitHub</span>
                </a>
              </nav>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="text-sm text-gray-400">
            © {new Date().getFullYear()} Ping. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  )
} 