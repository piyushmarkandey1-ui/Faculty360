'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, ShieldCheck, Database, ArrowRight, UserCheck, Sparkles, AlertCircle } from 'lucide-react'
import { ROUTES } from '@/lib/constants/routes'
import { APP_NAME } from '@/lib/constants/config'
import { Button } from '@/components/ui/Button'
import { loginUser, registerUser, demoLoginUser } from '@/lib/api/client'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isDemoLoading, setIsDemoLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const handleDemoAccess = async () => {
    setIsDemoLoading(true)
    setError(null)
    setSuccessMsg(null)

    try {
      await demoLoginUser()
      window.location.href = ROUTES.dashboard
    } catch (err: any) {
      setError(err?.message || 'Failed to start demo session. Please try again.')
      setIsDemoLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccessMsg(null)

    try {
      if (mode === 'signup') {
        await registerUser(email, password, fullName)
        setSuccessMsg('Account created successfully! Directing to dashboard...')
        setTimeout(() => {
          window.location.href = ROUTES.dashboard
        }, 500)
      } else {
        await loginUser(email, password)
        setSuccessMsg('Signed in successfully! Directing to dashboard...')
        setTimeout(() => {
          window.location.href = ROUTES.dashboard
        }, 300)
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please verify credentials.')
      setIsLoading(false)
    }
  }

  const fillCredentials = (demoEmail: string, demoPass: string) => {
    setMode('signin')
    setEmail(demoEmail)
    setPassword(demoPass)
    setError(null)
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-base)' }}>
      {/* Left panel - Visual brand & Architecture Highlights */}
      <div className="hidden lg:flex w-[55%] flex-col justify-between p-16 relative overflow-hidden border-r border-[var(--border-default)]" style={{ background: 'var(--bg-surface)' }}>
        <div className="absolute inset-0 z-0 pointer-events-none">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ duration: 1.5 }}
            className="absolute inset-0 opacity-25"
            style={{
              backgroundImage: 'radial-gradient(ellipse at 30% 35%, var(--accent-muted) 0%, transparent 65%)',
            }}
          />
        </div>

        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shadow-md"
              style={{
                background: "var(--accent)",
                color: "var(--text-inverse)",
                fontFamily: "var(--font-mono)",
              }}
            >
              AL
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight block" style={{ color: "var(--text-primary)" }}>
                {APP_NAME}
              </span>
              <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                Institutional Assessment Intelligence
              </span>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border" style={{ background: 'rgba(249, 115, 22, 0.08)', borderColor: 'rgba(249, 115, 22, 0.3)', color: '#f97316' }}>
            <Database size={13} />
            Tiger Data TimescaleDB
          </div>
        </div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="relative z-10 my-auto py-8"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono font-semibold tracking-wide uppercase mb-4" style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
            <Sparkles size={12} />
            Evidence-Based Faculty Assessment
          </div>
          <h1 className="text-4xl font-extrabold leading-tight mb-5" style={{ color: 'var(--text-primary)' }}>
            Rules Calculate.<br/>
            <span style={{ color: 'var(--accent)' }}>AI Interprets.</span><br/>
            Humans Decide.
          </h1>
          <p className="text-base max-w-lg leading-relaxed mb-8" style={{ color: 'var(--text-secondary)' }}>
            Empowering institutional committees with automated academic profile deduplication, multi-source verification, and time-series productivity analytics.
          </p>

          {/* Architectural Benefits Checklist */}
          <div className="space-y-3.5 max-w-md">
            <div className="flex items-start gap-3 p-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)]">
              <Zap size={18} className="text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-[var(--text-primary)]">Zero-Roadblock Evaluation</p>
                <p className="text-[11px] text-[var(--text-muted)]">Built-in 1-Click Judge Mode eliminates external authentication barriers.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)]">
              <Database size={18} className="text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-[var(--text-primary)]">Tiger Data Cloud Engine</p>
                <p className="text-[11px] text-[var(--text-muted)]">Native PostgreSQL & TimescaleDB hypertables track longitudinal academic growth.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)]">
              <ShieldCheck size={18} className="text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-[var(--text-primary)]">Automated Conflict Resolution</p>
                <p className="text-[11px] text-[var(--text-muted)]">Deduplicates citations and claims across Google Scholar, ORCID, and HR systems.</p>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="relative z-10 flex items-center justify-between text-xs font-medium border-t border-[var(--border-subtle)] pt-6" style={{ color: 'var(--text-muted)' }}>
          <span>Faculty360 Enterprise</span>
          <span>Institutional Intelligence System</span>
        </div>
      </div>

      {/* Right panel - Auth form & 1-Click Judge Access */}
      <div className="w-full lg:w-[45%] flex items-center justify-center p-6 sm:p-10 lg:p-14 relative">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile brand header */}
          <div className="mb-6 lg:hidden flex items-center justify-between">
            <div className="flex items-center gap-2.5">
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
            <span className="text-xs px-2.5 py-1 rounded bg-[var(--accent-subtle)] text-[var(--accent)] font-semibold">
              Tiger Data
            </span>
          </div>

          {/* ⚡ PROMINENT 1-CLICK JUDGE / EVALUATOR DEMO CARD */}
          <div className="p-4 rounded-xl border border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent mb-6 shadow-sm">
            <div className="flex items-start justify-between gap-3 mb-2.5">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-500">
                  <Zap size={16} />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">
                    Hackathon Evaluator & Judge Mode
                  </h3>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    Bypass authentication hurdles with 1 click
                  </p>
                </div>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500 text-black">
                Instant
              </span>
            </div>

            <p className="text-xs text-[var(--text-secondary)] mb-3 leading-relaxed">
              Instantly logs in with institutional review privileges, 10 preloaded faculty profiles, and live TimescaleDB trajectory metrics.
            </p>

            <Button
              type="button"
              onClick={handleDemoAccess}
              disabled={isDemoLoading || isLoading}
              className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2"
            >
              {isDemoLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Entering Judge Dashboard...</span>
                </>
              ) : (
                <>
                  <Zap size={14} className="fill-current" />
                  <span>1-Click Evaluator Demo Access</span>
                  <ArrowRight size={14} />
                </>
              )}
            </Button>
          </div>

          {/* Divider with label */}
          <div className="relative flex items-center justify-center my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--border-default)]" />
            </div>
            <span className="relative px-3 text-xs uppercase tracking-wider font-semibold text-[var(--text-muted)] bg-[var(--bg-base)]">
              Or Sign In With Account
            </span>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex p-1 rounded-xl mb-5 border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
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

          {/* Form */}
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
              disabled={isLoading || isDemoLoading}
            >
              {isLoading 
                ? (mode === 'signin' ? 'Authenticating via Tiger Data...' : 'Creating User Profile...') 
                : (mode === 'signin' ? 'Sign In' : 'Register Account')}
            </Button>

            {/* Quick Demo Credentials Autofill */}
            {mode === 'signin' && (
              <div className="pt-2">
                <p className="text-[11px] text-[var(--text-muted)] mb-1.5">Quick fill test credentials:</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => fillCredentials('admin@acadlens.ac.in', 'admin123')}
                    className="text-[11px] px-2.5 py-1 rounded border border-[var(--border-default)] hover:border-[var(--accent)] hover:text-[var(--accent)] bg-[var(--bg-surface)] text-[var(--text-secondary)] transition-colors flex items-center gap-1.5"
                  >
                    <UserCheck size={12} />
                    admin@acadlens.ac.in
                  </button>
                  <button
                    type="button"
                    onClick={() => fillCredentials('evaluator@hackbios.xyz', 'hackbios2026')}
                    className="text-[11px] px-2.5 py-1 rounded border border-[var(--border-default)] hover:border-[var(--accent)] hover:text-[var(--accent)] bg-[var(--bg-surface)] text-[var(--text-secondary)] transition-colors flex items-center gap-1.5"
                  >
                    <UserCheck size={12} />
                    evaluator@hackbios.xyz
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-3 px-3.5 py-2.5 rounded-lg text-xs border flex items-center gap-2" style={{ background: 'var(--danger-muted)', borderColor: 'var(--danger)', color: 'var(--danger)' }}>
                <AlertCircle size={15} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="mt-3 px-3.5 py-2.5 rounded-lg text-xs border" style={{ background: 'rgba(46, 155, 114, 0.12)', borderColor: 'var(--success)', color: 'var(--success)' }}>
                {successMsg}
              </div>
            )}
          </form>

          {/* Footer note */}
          <div className="mt-8 pt-4 border-t border-[var(--border-subtle)] text-center">
            <p className="text-[11px] text-[var(--text-muted)]">
              Powered by <span className="font-semibold text-[var(--text-secondary)]">Tiger Data PostgreSQL (v18.6 + TimescaleDB 2.30.2)</span>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}