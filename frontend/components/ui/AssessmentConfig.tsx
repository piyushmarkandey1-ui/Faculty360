'use client'

import { useState, useEffect } from 'react'
import { Sliders, Save, AlertTriangle, CheckCircle2, Loader2, Plus, Trash2 } from 'lucide-react'
import { Button } from './Button'
import { Badge } from './Badge'

interface Parameter {
  id: string
  name: string
  weight: number
  max_score: number
  evidence_requirement: string
  rule: string
}

interface Category {
  id: string
  name: string
  weight: number
  parameters: Parameter[]
}

export function AssessmentConfig() {
  const [config, setConfig] = useState<{ categories: Category[] } | null>(null)
  const [version, setVersion] = useState<string>('Loading...')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    fetchFramework()
  }, [])

  const fetchFramework = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      const res = await fetch(`${baseUrl}/api/assessment/framework`, {
        headers: session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}
      })
      if (!res.ok) throw new Error('Failed to fetch framework')
      const data = await res.json()
      setConfig(data.config)
      setVersion(data.version)
    } catch (err: any) {
      setErrorMsg(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!config) return
    setErrorMsg(null)
    setSuccessMsg(null)
    setSaving(true)
    
    // Client side validation
    const totalWeight = config.categories.reduce((acc, cat) => acc + cat.weight, 0)
    if (Math.abs(totalWeight - 1.0) > 0.01) {
      setErrorMsg(`Total category weight must sum to 1.0 (Currently ${totalWeight.toFixed(2)})`)
      setSaving(false)
      return
    }

    for (const cat of config.categories) {
      const pWeight = cat.parameters.reduce((acc, p) => acc + p.weight, 0)
      if (Math.abs(pWeight - 1.0) > 0.01) {
        setErrorMsg(`Parameters in '${cat.name}' must sum to 1.0 (Currently ${pWeight.toFixed(2)})`)
        setSaving(false)
        return
      }
    }

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      const res = await fetch(`${baseUrl}/api/assessment/framework`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
        },
        body: JSON.stringify(config)
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: 'Failed to publish' }))
        throw new Error(errorData.detail || 'Failed to publish')
      }

      const data = await res.json()
      setVersion(data.version)
      setSuccessMsg(`Successfully published version ${data.version}`)
      setTimeout(() => setSuccessMsg(null), 3000)
    } catch (err: any) {
      setErrorMsg(err.message)
    } finally {
      setSaving(false)
    }
  }

  const updateCategoryWeight = (catId: string, val: string) => {
    if (!config) return
    const num = parseFloat(val) || 0
    setConfig({
      ...config,
      categories: config.categories.map(c => c.id === catId ? { ...c, weight: num } : c)
    })
  }

  const updateParam = (catId: string, paramId: string, field: string, val: string) => {
    if (!config) return
    const num = parseFloat(val) || 0
    setConfig({
      ...config,
      categories: config.categories.map(c => {
        if (c.id !== catId) return c
        return {
          ...c,
          parameters: c.parameters.map(p => p.id === paramId ? { ...p, [field]: num } : p)
        }
      })
    })
  }

  if (loading) return <div className="p-5 border rounded-xl bg-[var(--bg-elevated)] flex justify-center"><Loader2 className="animate-spin text-[var(--accent)]" /></div>
  if (!config) return <div className="p-5 border rounded-xl bg-[var(--bg-elevated)] text-[var(--danger)]">Failed to load configuration.</div>

  const totalCatWeight = config.categories.reduce((acc, cat) => acc + cat.weight, 0)
  const isValid = Math.abs(totalCatWeight - 1.0) <= 0.01

  return (
    <div className="p-5 rounded-xl border flex flex-col bg-[var(--bg-elevated)] border-[var(--border-subtle)] col-span-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-[var(--bg-base)] text-[var(--accent)]">
            <Sliders size={16} />
          </div>
          <div>
            <h3 className="font-medium text-sm text-[var(--text-primary)]">Assessment Framework Configuration</h3>
            <p className="text-xs text-[var(--text-secondary)]">Adjust scoring weights and thresholds globally.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="neutral">v{version}</Badge>
          <Badge variant={isValid ? 'success' : 'danger'}>
            Total Weight: {(totalCatWeight * 100).toFixed(0)}%
          </Badge>
        </div>
      </div>

      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
        {config.categories.map(cat => {
          const paramTotal = cat.parameters.reduce((acc, p) => acc + p.weight, 0)
          const pValid = Math.abs(paramTotal - 1.0) <= 0.01
          return (
            <div key={cat.id} className="p-4 border border-[var(--border-subtle)] rounded-lg bg-[var(--bg-base)]">
              <div className="flex justify-between items-center mb-3 pb-2 border-b border-[var(--border-subtle)]">
                <h4 className="font-medium text-sm text-[var(--text-primary)]">{cat.name}</h4>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--text-muted)]">Category Weight:</span>
                  <input 
                    type="number" step="0.05" min="0" max="1" 
                    value={cat.weight} onChange={(e) => updateCategoryWeight(cat.id, e.target.value)}
                    className="w-16 px-2 py-1 text-xs bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded text-white outline-none"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-2 text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">
                  <div className="col-span-5">Parameter</div>
                  <div className="col-span-3">Max Score</div>
                  <div className="col-span-4">Weight inside Category {pValid ? '' : <span className="text-[var(--danger)]">({(paramTotal*100).toFixed(0)}%)</span>}</div>
                </div>
                {cat.parameters.map(param => (
                  <div key={param.id} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-5 text-xs text-[var(--text-secondary)] truncate">{param.name}</div>
                    <div className="col-span-3">
                      <input 
                        type="number" step="5" min="0" max="100" 
                        value={param.max_score} onChange={(e) => updateParam(cat.id, param.id, 'max_score', e.target.value)}
                        className="w-full px-2 py-1 text-xs bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded text-white outline-none"
                      />
                    </div>
                    <div className="col-span-4">
                      <input 
                        type="number" step="0.05" min="0" max="1" 
                        value={param.weight} onChange={(e) => updateParam(cat.id, param.id, 'weight', e.target.value)}
                        className="w-full px-2 py-1 text-xs bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded text-white outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs">
          {errorMsg && <span className="text-[var(--danger)] flex items-center gap-1"><AlertTriangle size={14} /> {errorMsg}</span>}
          {successMsg && <span className="text-[var(--success)] flex items-center gap-1"><CheckCircle2 size={14} /> {successMsg}</span>}
        </div>
        <Button 
          variant="primary" size="sm" 
          onClick={handleSave} 
          disabled={saving || !isValid}
          className="gap-2 shrink-0"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Save & Publish Framework
        </Button>
      </div>
    </div>
  )
}
