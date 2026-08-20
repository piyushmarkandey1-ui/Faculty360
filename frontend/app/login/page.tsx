'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ROUTES } from '@/lib/constants/routes'
import { APP_NAME } from '@/lib/constants/config'
import { Button } from '@/components/ui/Button'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('admin@a3pweb.ac.in')
  const [password, setPassword] = useState('demo2026')
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      router.push(ROUTES.dashboard)
    }, 800)
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-base)' }}>
      {/* Left panel - Visual brand */}
      <div className="hidden lg:flex w-[58%] flex-col relative overflow-hidden border-r border-[var(--border-default)]" style={{ background: 'var(--bg-surface)' }}>
        <div className="absolute inset-0 z-0">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ duration: 1.5 }}
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'radial-gradient(ellipse at 30% 40%, var(--accent-muted) 0%, transparent 60%)',
            }}
          />
        </div>

        <div className="relative z-10 flex flex-col justify-between h-full p-16">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold shadow-sm"
              style={{
                background: "var(--accent)",
                color: "var(--text-inverse)",
                fontFamily: "var(--font-mono)",
              }}
            >
              A³
            </div>
            <span
              className="text-xl font-bold tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              {APP_NAME}
            </span>
          </div>

          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="text-label mb-4">Institutional Portal</div>
            <h1 className="text-4xl font-extrabold leading-tight mb-6" style={{ color: 'var(--text-primary)' }}>
              Rules Calculate.<br/>
              <span style={{ color: 'var(--accent)' }}>AI Interprets.</span><br/>
              Humans Decide.
            </h1>
            <p className="text-base max-w-md leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              AI-Enabled Academic Profile Analytics Using Multi-Source Public Web and Institutional Data.
            </p>
          </motion.div>

          <div style={{ color: 'var(--text-muted)' }} className="text-xs font-semibold tracking-wider uppercase">
            Smart India Hackathon 2026 • PS64
          </div>
        </div>
      </div>

      {/* Right panel - Login form */}
      <div className="w-full lg:w-[42%] flex items-center justify-center p-8 sm:p-12 lg:p-16 relative">
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
              A³
            </div>
            <span className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
              {APP_NAME}
            </span>
          </div>

          <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Sign In</h2>
          <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>Institutional administrator login</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>Institutional Email</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border text-sm focus:outline-none transition-colors"
                style={{ 
                  background: 'var(--bg-surface)', 
                  borderColor: 'var(--border-default)',
                  color: 'var(--text-primary)'
                }}
                placeholder="admin@a3pweb.ac.in"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>Password</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border text-sm focus:outline-none transition-colors font-mono"
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
              className="w-full py-2.5 mt-2 font-semibold" 
              disabled={isLoading}
            >
              {isLoading ? 'Authenticating...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-8 p-4 rounded-xl text-xs border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
            <p style={{ color: 'var(--accent)' }} className="mb-1 text-[11px] uppercase tracking-wider font-bold">Demo Credentials</p>
            <p style={{ color: 'var(--text-primary)' }}><strong>Email:</strong> admin@a3pweb.ac.in</p>
            <p style={{ color: 'var(--text-primary)' }}><strong>Password:</strong> demo2026</p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
