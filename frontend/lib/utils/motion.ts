'use client'

import type { Variants, Transition, Easing } from 'framer-motion'

export const EASE_OUT: Easing = [0, 0, 0.2, 1]
export const EASE_INOUT: Easing = [0.4, 0, 0.2, 1]

export const defaultTransition: Transition = {
  duration: 0.55,
  ease: EASE_OUT,
}

export const fastTransition: Transition = {
  duration: 0.35,
  ease: EASE_OUT,
}

// fadeUp: opacity+translateY+blur reveal
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24, filter: 'blur(6px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.55, ease: [0,0,0.2,1] } },
}

// fadeIn: just opacity
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } },
}

// scaleIn: scale+opacity
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0,0,0.2,1] } },
}

// slideReveal: from right
export const slideReveal: Variants = {
  hidden: { opacity: 0, x: 24 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: [0,0,0.2,1] } },
}

// staggerContainer
export const staggerContainer = (stagger = 0.1, delay = 0): Variants => ({
  hidden: {},
  visible: { transition: { staggerChildren: stagger, delayChildren: delay } },
})

// hoverLift - use as whileHover on motion elements
export const hoverLift = {
  y: -4,
  boxShadow: '0 12px 30px rgba(23,35,60,0.12)',
  transition: { duration: 0.2, ease: [0,0,0.2,1] },
}

// softPulse - subtle breathing animation
export const softPulse: Variants = {
  animate: {
    scale: [1, 1.025, 1],
    transition: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' },
  },
}

// pressScale - for button press
export const pressScale = { scale: 0.97 }
