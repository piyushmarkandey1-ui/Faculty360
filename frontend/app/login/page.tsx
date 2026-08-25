'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ROUTES } from '@/lib/constants/routes'
import { APP_NAME } from '@/lib/constants/config'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccessMsg(null)

    const supabase = createClient()

    if (mode === 'signup') {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (signUpError) {
        setError(signUpError.message)
        setIsLoading(false)
        return
      }

      if (data.session) {
        // Auto signed-in
        router.refresh()
        router.push(ROUTES.dashboard)
      } else {
        setSuccessMsg('Account created successfully! You can now sign in.')
        setMode('signin')
        setIsLoading(false)
      }
    } else {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        setError(authError.message)
        setIsLoading(false)
        return
      }

      router.refresh()
      router.push(ROUTES.dashboard)
    }
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
              AL
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
              AI-Enabled Academic Profile Analytics for Evidence-Based Faculty Assessment.
            </p>
          </motion.div>

          <div style={{ color: 'var(--text-muted)' }} className="text-xs font-semibold tracking-wider uppercase">
            Smart India Hackathon 2026 • PS64
          </div>
        </div>
      </div>

      {/* Right panel - Auth form */}
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
              AL
            </div>
            <span className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
              {APP_NAME}
            </span>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex p-1 rounded-xl mb-6 border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
            <button
              type="button"
              onClick={() => { setMode('signin'); setError(null); setSuccessMsg(null); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'signin' 
                  ? 'bg-[var(--accent)] text-white shadow-sm' 
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setError(null); setSuccessMsg(null); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'signup' 
                  ? 'bg-[var(--accent)] text-white shadow-sm' 
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Create Account
            </button>
          </div>

          <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            {mode === 'signin' ? 'Sign In' : 'Create Account'}
          </h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
            {mode === 'signin' ? 'Institutional access & review portal' : 'Register for institutional access'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {mode === 'signup' && (
                <motion.div
                  key="fullName"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-1.5 overflow-hidden"
                >
                  <label className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>Full Name</label>
                  <input 
                    type="text" 
                    required={mode === 'signup'}
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border text-sm focus:outline-none transition-colors"
                    style={{ 
                      background: 'var(--bg-surface)', 
                      borderColor: 'var(--border-default)',
                      color: 'var(--text-primary)'
                    }}
                    placeholder="Dr. Rajesh Sharma"
                  />
                </motion.div>
              )}
            </AnimatePresence>

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
                placeholder="admin@acadlens.ac.in"
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
              {isLoading 
                ? (mode === 'signin' ? 'Authenticating...' : 'Creating Account...') 
                : (mode === 'signin' ? 'Sign In' : 'Sign Up')}
            </Button>

            {error && (
              <div className="mt-3 px-3.5 py-2.5 rounded-lg text-sm border" style={{ background: 'var(--danger-muted)', borderColor: 'var(--danger)', color: 'var(--danger)' }}>
                {error}
              </div>
            )}

            {successMsg && (
              <div className="mt-3 px-3.5 py-2.5 rounded-lg text-sm border" style={{ background: 'rgba(46, 155, 114, 0.12)', borderColor: 'var(--success)', color: 'var(--success)' }}>
                {successMsg}
              </div>
            )}
          </form>
        </motion.div>
      </div>
    </div>
  )
}