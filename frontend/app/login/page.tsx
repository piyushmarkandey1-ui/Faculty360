'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ROUTES } from '@/lib/constants/routes'
import { APP_NAME } from '@/lib/constants/config'
import { Button } from '@/components/ui/Button'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    // Simulate network delay
    setTimeout(() => {
      setIsLoading(false)
      router.push(ROUTES.dashboard)
    }, 1000)
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-base)' }}>
      {/* Left panel - Visual brand */}
      <div className="hidden lg:flex w-[60%] flex-col relative overflow-hidden" style={{ background: 'var(--bg-surface)' }}>
        <div className="absolute inset-0 z-0">
          {/* Subtle animated background pattern */}
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ duration: 2 }}
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'radial-gradient(circle at 50% 50%, var(--accent) 0%, transparent 50%)',
              backgroundSize: '100% 100%',
              backgroundPosition: 'center',
            }}
          />
        </div>

        <div className="relative z-10 flex flex-col justify-between h-full p-16">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold"
              style={{
                background: "var(--accent)",
                color: "var(--text-inverse)",
                fontFamily: "var(--font-mono)",
              }}
            >
              AA3
            </div>
            <span
              className="text-xl font-semibold tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              {APP_NAME}
            </span>
          </div>

          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <h1 className="text-5xl font-bold leading-tight mb-6" style={{ color: 'var(--text-primary)' }}>
              Rules Calculate.<br/>
              <span style={{ color: 'var(--accent)' }}>AI Interprets.</span><br/>
              Humans Decide.
            </h1>
            <p className="text-xl max-w-md" style={{ color: 'var(--text-secondary)' }}>
              Institutional academic profile analytics tool for comprehensive faculty evaluation.
            </p>
          </motion.div>

          <div style={{ color: 'var(--text-muted)' }} className="text-sm font-medium tracking-wide">
            Smart India Hackathon 2026 • PS64
          </div>
        </div>
      </div>

      {/* Right panel - Login form */}
      <div className="w-full lg:w-[40%] flex items-center justify-center p-8 sm:p-12 lg:p-16 relative">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          <div className="mb-8 lg:hidden flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
              style={{ background: "var(--accent)", color: "var(--text-inverse)" }}
            >
              AA3
            </div>
            <span className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
              {APP_NAME}
            </span>
          </div>

          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Sign In</h2>
          <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>Enter your institutional credentials to access the platform.</p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Email</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border focus:outline-none transition-colors"
                style={{ 
                  background: 'var(--bg-surface)', 
                  borderColor: 'var(--border-default)',
                  color: 'var(--text-primary)'
                }}
                placeholder="admin@a3pweb.ac.in"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Password</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border focus:outline-none transition-colors"
                style={{ 
                  background: 'var(--bg-surface)', 
                  borderColor: 'var(--border-default)',
                  color: 'var(--text-primary)'
                }}
                placeholder="••••••••"
              />
            </div>

            <Button 
              type="submit" 
              variant="primary" 
              className="w-full py-2.5 mt-2" 
              disabled={isLoading}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-8 p-4 rounded-lg text-sm border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
            <p style={{ color: 'var(--text-secondary)' }} className="mb-1 text-xs uppercase tracking-wider font-semibold">Demo Credentials</p>
            <p style={{ color: 'var(--text-primary)' }}><strong>Email:</strong> admin@a3pweb.ac.in</p>
            <p style={{ color: 'var(--text-primary)' }}><strong>Password:</strong> demo2026</p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
