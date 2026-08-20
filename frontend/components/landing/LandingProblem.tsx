'use client'

import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { fadeUp } from '@/lib/utils/motion'

export function LandingProblem() {
  const prefersReducedMotion = useReducedMotion()

  const cardVariants: any = {
    hidden: { opacity: 0, y: 30, filter: 'blur(8px)' },
    visible: (custom: number) => ({
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        delay: prefersReducedMotion ? 0 : custom * 0.12,
        duration: 0.6,
        ease: [0, 0, 0.2, 1],
      }
    })
  }

  const hoverEffect = {
    y: -4,
    boxShadow: '0 12px 30px rgba(23,35,60,0.12)',
    borderColor: '#D6A84F' // GOLD
  }

  return (
    <section id="problem-section" className="py-24 bg-[#F7F8F5] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={fadeUp}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-[#17233C] mb-4 tracking-tight">
            The Data Integrity Challenge
          </h2>
          <p className="text-lg text-[#5D6B82]">
            Without standardized processing, disparate sources lead to unreliable assessments.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1: Fragmented */}
          <motion.div
            custom={0}
            initial="hidden"
            whileInView="visible"
            whileHover={prefersReducedMotion ? undefined : hoverEffect}
            viewport={{ once: true, margin: '-50px' }}
            variants={cardVariants}
            className="bg-white rounded-2xl p-8 border border-[#E4E8EF] transition-colors group cursor-default"
          >
            <div className="h-20 mb-6 flex items-center justify-center">
              <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                <motion.g className="group-hover:opacity-50 transition-opacity duration-300">
                  <path d="M20 40 L40 20" stroke="#94A3B8" strokeWidth="2" strokeDasharray="4 4" />
                  <path d="M40 20 L60 40" stroke="#94A3B8" strokeWidth="2" strokeDasharray="4 4" />
                  <path d="M20 40 L40 60" stroke="#94A3B8" strokeWidth="2" strokeDasharray="4 4" />
                </motion.g>
                <circle cx="20" cy="40" r="6" fill="#0F8B8D" />
                <circle cx="40" cy="20" r="6" fill="#0F8B8D" />
                <circle cx="60" cy="40" r="6" fill="#0F8B8D" />
                <circle cx="40" cy="60" r="6" fill="#0F8B8D" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-[#17233C] mb-3">Fragmented</h3>
            <p className="text-[#5D6B82] leading-relaxed">
              Data is scattered across multiple unconnected nodes, preventing a unified view of reality.
            </p>
          </motion.div>

          {/* Card 2: Inconsistent */}
          <motion.div
            custom={1}
            initial="hidden"
            whileInView="visible"
            whileHover={prefersReducedMotion ? undefined : hoverEffect}
            viewport={{ once: true, margin: '-50px' }}
            variants={cardVariants}
            className="bg-white rounded-2xl p-8 border border-[#E4E8EF] transition-colors group cursor-default"
          >
            <div className="h-20 mb-6 flex items-center justify-center">
              <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="10" y="20" width="25" height="12" rx="4" fill="#0F8B8D" opacity="0.2" />
                <rect x="10" y="48" width="25" height="12" rx="4" fill="#0F8B8D" />
                <rect x="45" y="20" width="25" height="12" rx="4" fill="#D6A84F" opacity="0.2" />
                <rect x="45" y="48" width="25" height="12" rx="4" fill="#D6A84F" />
                
                <motion.line 
                  x1="40" y1="15" x2="40" y2="65" 
                  stroke="#D6A84F" 
                  strokeWidth="2" 
                  strokeDasharray="4 4"
                  className="group-hover:opacity-100 opacity-40 transition-opacity duration-300"
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-[#17233C] mb-3">Inconsistent</h3>
            <p className="text-[#5D6B82] leading-relaxed">
              Conflicting metrics across records produce unreliable and unactionable intelligence.
            </p>
          </motion.div>

          {/* Card 3: Incomplete */}
          <motion.div
            custom={2}
            initial="hidden"
            whileInView="visible"
            whileHover={prefersReducedMotion ? undefined : hoverEffect}
            viewport={{ once: true, margin: '-50px' }}
            variants={cardVariants}
            className="bg-white rounded-2xl p-8 border border-[#E4E8EF] transition-colors group cursor-default"
          >
            <div className="h-20 mb-6 flex items-center justify-center">
              <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Silhouette */}
                <circle cx="24" cy="30" r="12" fill="#17233C" opacity="0.1" />
                <path d="M12 60 C12 50, 36 50, 36 60" fill="#17233C" opacity="0.1" />
                
                {/* Filled bars */}
                <rect x="45" y="25" width="25" height="6" rx="3" fill="#0F8B8D" />
                
                {/* Empty dashed bars */}
                <motion.rect 
                  x="45" y="40" width="20" height="6" rx="3" 
                  stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="3 3" fill="none"
                  className="group-hover:stroke-[#D6A84F] transition-colors duration-300"
                />
                <motion.rect 
                  x="45" y="55" width="15" height="6" rx="3" 
                  stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="3 3" fill="none"
                  className="group-hover:stroke-[#D6A84F] transition-colors duration-300"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-[#17233C] mb-3">Incomplete</h3>
            <p className="text-[#5D6B82] leading-relaxed">
              Missing fields and sparse profiles leave dangerous blind spots in assessments.
            </p>
          </motion.div>

        </div>
      </div>
    </section>
  )
}
