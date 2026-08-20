'use client'

import React, { useState } from 'react'
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, Box } from 'lucide-react'

// Assuming ROUTES is defined here. We fall back gracefully just in case.
const ROUTES = {
  dashboard: '/dashboard',
  login: '/login'
}

export function LandingNav() {
  const { scrollY } = useScroll()
  const prefersReducedMotion = useReducedMotion()

  const bg = useTransform(scrollY, [0, 80], ['rgba(255,255,255,0)', 'rgba(255,255,255,0.7)'])
  const borderColor = useTransform(scrollY, [0, 80], ['rgba(228,232,239,0)', 'rgba(228,232,239,0.8)'])
  const boxShadow = useTransform(scrollY, [0, 80], ['0px 4px 20px rgba(0,0,0,0)', '0px 4px 24px rgba(0,0,0,0.04)'])
  const backdropFilter = useTransform(scrollY, [0, 80], ['blur(0px) saturate(100%)', 'blur(20px) saturate(180%)'])

  const [hoveredLink, setHoveredLink] = useState<string | null>(null)

  const navLinks = [
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'The Pipeline', href: '#story-section' },
    { label: 'Assessment', href: '#assessment-section' },
    { label: 'Platform', href: ROUTES.dashboard },
  ]

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0, 0, 0.2, 1] }}
      style={prefersReducedMotion ? {
        backgroundColor: 'rgba(255,255,255,0.85)',
        borderBottom: '1px solid rgba(228,232,239,0.8)',
        boxShadow: '0px 4px 24px rgba(0,0,0,0.04)',
        backdropFilter: 'blur(20px) saturate(180%)'
      } : {
        backgroundColor: bg,
        borderBottomWidth: '1px',
        borderBottomStyle: 'solid',
        borderBottomColor: borderColor,
        boxShadow,
        backdropFilter,
        WebkitBackdropFilter: backdropFilter
      }}
    >
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="text-[#0F8B8D] p-1.5 rounded-lg bg-[#0F8B8D]/10 group-hover:bg-[#0F8B8D]/20 transition-colors">
            <Box className="w-6 h-6" />
          </div>
          <span className="font-bold text-xl text-[#17233C] tracking-tight">A³P-Web</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-[#5D6B82] transition-colors relative"
              onMouseEnter={() => setHoveredLink(link.label)}
              onMouseLeave={() => setHoveredLink(null)}
              style={{
                color: hoveredLink === link.label ? '#0F8B8D' : '#5D6B82'
              }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <Link
            href={ROUTES.login}
            className="hidden sm:block text-sm font-medium text-[#5D6B82] hover:text-[#17233C] transition-colors"
          >
            Sign In
          </Link>
          <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
            <Link
              href={ROUTES.dashboard}
              className="group flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#17233C] text-white text-sm font-medium hover:bg-[#0F8B8D] transition-colors shadow-sm"
            >
              <span>Explore Platform</span>
              <motion.div
                className="flex items-center justify-center"
                variants={{
                  hover: { x: 3 }
                }}
                transition={{ duration: 0.2 }}
              >
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-[3px]" />
              </motion.div>
            </Link>
          </motion.div>
        </div>
      </div>
    </motion.header>
  )
}
