'use client'

import { useState, useEffect } from 'react'
import { Sliders, Save, AlertTriangle, CheckCircle2, Loader2, Plus, Trash2, Sparkles, X } from 'lucide-react'
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
  
  // AI Suggestions State
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)

  useEffect(() => {
    fetchFramework()
  }, [])

  const fetchFramework = async () => {
    try {
      const { apiFetch } = await import('@/lib/api/client')
      const data = await apiFetch<any>('/assessment/framework')
      setConfig(data.config)
      setVersion(data.version)
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch framework')
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
      const { apiFetch } = await import('@/lib/api/client')
      const data = await apiFetch<any>('/assessment/framework', {
        method: 'POST',
        body: JSON.stringify(config)
      })

      setVersion(data.version)
      setSuccessMsg(`Successfully published version ${data.version}`)
      setTimeout(() => setSuccessMsg(null), 3000)
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to publish')
    } finally {
      setSaving(false)
    }
  }

  const fetchSuggestions = async () => {
    if (!config) return
    setShowSuggestions(true)
    setLoadingSuggestions(true)
    setErrorMsg(null)
    try {
      const { apiFetch } = await import('@/lib/api/client')
      const data = await apiFetch<any>('/assessment/framework/suggest', {
        method: 'POST',
        body: JSON.stringify(config)
      })
      if (data.suggestions) {
        setSuggestions(data.suggestions)
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to get suggestions')
    } finally {
      setLoadingSuggestions(false)
    }
  }

  const applySuggestion = (s: any) => {
    setSuggestions(suggestions.filter(x => x.id !== s.id))
    // We could parse the payload here to automatically add the parameter if we want
    // But for safety, the user can manually add based on the message.
  }
  
  const ignoreSuggestion = (s: any) => {
    setSuggestions(suggestions.filter(x => x.id !== s.id))
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

  const addCategory = () => {
    if (!config) return
    const newCat: Category = {
      id: `cat_${Date.now()}`,
      name: 'New Category',
      weight: 0.1,
      parameters: []
    }
    setConfig({ ...config, categories: [...config.categories, newCat] })
  }

  const removeCategory = (catId: string) => {
    if (!config) return
    setConfig({ ...config, categories: config.categories.filter(c => c.id !== catId) })
  }

  const addParameter = (catId: string) => {
    if (!config) return
    const newParam: Parameter = {
      id: `param_${Date.now()}`,
      name: 'New Parameter',
      weight: 0.5,
      max_score: 100,
      evidence_requirement: 'institutional_records.example',
      rule: 'count * 10'
    }
    setConfig({
      ...config,
      categories: config.categories.map(c => c.id === catId ? { ...c, parameters: [...c.parameters, newParam] } : c)
    })
  }

  const removeParameter = (catId: string, paramId: string) => {
    if (!config) return
    setConfig({
      ...config,
      categories: config.categories.map(c => c.id === catId ? { ...c, parameters: c.parameters.filter(p => p.id !== paramId) } : c)
    })
  }

  const updateCategoryName = (catId: string, val: string) => {
    if (!config) return
    setConfig({
      ...config,
      categories: config.categories.map(c => c.id === catId ? { ...c, name: val } : c)
    })
  }

  const updateParamText = (catId: string, paramId: string, field: string, val: string) => {
    if (!config) return
    setConfig({
      ...config,
      categories: config.categories.map(c => {
        if (c.id !== catId) return c
        return {
          ...c,
          parameters: c.parameters.map(p => p.id === paramId ? { ...p, [field]: val } : p)
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-[var(--bg-base)] text-[var(--accent)]">
            <Sliders size={16} />
          </div>
          <div>
            <h3 className="font-medium text-sm text-[var(--text-primary)]">Assessment Framework Configuration</h3>
            <p className="text-xs text-[var(--text-secondary)]">Adjust scoring weights and thresholds globally.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="neutral">v{version}</Badge>
          <Badge variant={isValid ? 'success' : 'danger'}>
            Total Weight: {(totalCatWeight * 100).toFixed(0)}%
          </Badge>
          <Button variant="secondary" size="sm" onClick={fetchSuggestions} className="gap-2 text-[var(--warning)] border-[var(--warning)]/30 bg-[var(--warning)]/5 hover:bg-[var(--warning)]/10">
            <Sparkles size={14} /> AI Suggestions
          </Button>
        </div>
      </div>

      {showSuggestions && (
        <div className="mb-4 p-4 rounded-xl border border-[var(--warning)] bg-[var(--warning)]/5 relative">
          <button onClick={() => setShowSuggestions(false)} className="absolute top-2 right-2 p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            <X size={14} />
          </button>
          <h4 className="flex items-center gap-2 font-medium text-sm text-[var(--warning)] mb-3">
            <Sparkles size={16} /> Gemini Framework Analysis
          </h4>
          
          {loadingSuggestions ? (
            <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
              <Loader2 size={14} className="animate-spin" /> Analyzing framework architecture...
            </div>
          ) : suggestions.length === 0 ? (
            <div className="text-xs text-[var(--text-secondary)]">No suggestions at this time. Your framework looks solid!</div>
          ) : (
            <div className="space-y-3">
              {suggestions.map((s, i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs">
                  <div>
                    <div className="font-medium text-[var(--text-primary)] mb-1 capitalize">{s.type.replace('_', ' ')}</div>
                    <div className="text-[var(--text-secondary)]">{s.message}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => ignoreSuggestion(s)}>Ignore</Button>
                    <Button variant="secondary" size="sm" onClick={() => applySuggestion(s)}>Acknowledge</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
        {config.categories.map(cat => {
          const paramTotal = cat.parameters.reduce((acc, p) => acc + p.weight, 0)
          const pValid = Math.abs(paramTotal - 1.0) <= 0.01
          return (
            <div key={cat.id} className="p-4 border border-[var(--border-subtle)] rounded-lg bg-[var(--bg-base)] group relative">
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => removeCategory(cat.id)} className="p-1.5 text-[var(--danger)] hover:bg-[var(--danger)]/10 rounded-md" title="Remove Category">
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 pb-2 border-b border-[var(--border-subtle)] gap-2 pr-8">
                <input 
                  type="text" 
                  value={cat.name} 
                  onChange={(e) => updateCategoryName(cat.id, e.target.value)}
                  className="font-medium text-sm text-[var(--text-primary)] bg-transparent outline-none border-b border-transparent focus:border-[var(--accent)]"
                  placeholder="Category Name"
                />
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-[var(--text-muted)]">Category Weight:</span>
                  <input 
                    type="number" step="0.05" min="0" max="1" 
                    value={cat.weight} onChange={(e) => updateCategoryWeight(cat.id, e.target.value)}
                    className="w-16 px-2 py-1 text-xs bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded text-[var(--text-primary)] outline-none"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-2 text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1 px-1">
                  <div className="col-span-10 sm:col-span-3">Parameter</div>
                  <div className="col-span-12 sm:col-span-3 hidden sm:block">Evidence Source</div>
                  <div className="col-span-12 sm:col-span-2 hidden sm:block">Rule Formula</div>
                  <div className="col-span-6 sm:col-span-1">Max</div>
                  <div className="col-span-6 sm:col-span-2">Weight {pValid ? '' : <span className="text-[var(--danger)]">({(paramTotal*100).toFixed(0)}%)</span>}</div>
                  <div className="col-span-1"></div>
                </div>
                {cat.parameters.map(param => (
                  <div key={param.id} className="grid grid-cols-12 gap-2 items-center p-1 rounded hover:bg-[var(--bg-surface)]">
                    <div className="col-span-12 sm:col-span-3">
                      <input 
                        type="text" value={param.name} 
                        onChange={(e) => updateParamText(cat.id, param.id, 'name', e.target.value)}
                        className="w-full text-xs text-[var(--text-primary)] bg-transparent border border-transparent hover:border-[var(--border-subtle)] focus:border-[var(--accent)] rounded px-1 py-1 outline-none truncate"
                        placeholder="Name"
                      />
                    </div>
                    <div className="col-span-12 sm:col-span-3">
                      <input 
                        type="text" value={param.evidence_requirement} 
                        onChange={(e) => updateParamText(cat.id, param.id, 'evidence_requirement', e.target.value)}
                        className="w-full text-xs text-[var(--text-secondary)] bg-transparent border border-transparent hover:border-[var(--border-subtle)] focus:border-[var(--accent)] rounded px-1 py-1 outline-none font-mono text-[10px]"
                        placeholder="evidence.source"
                      />
                    </div>
                    <div className="col-span-12 sm:col-span-2">
                      <input 
                        type="text" value={param.rule} 
                        onChange={(e) => updateParamText(cat.id, param.id, 'rule', e.target.value)}
                        className="w-full text-xs text-[var(--text-secondary)] bg-transparent border border-transparent hover:border-[var(--border-subtle)] focus:border-[var(--accent)] rounded px-1 py-1 outline-none font-mono text-[10px]"
                        placeholder="count * 10"
                      />
                    </div>
                    <div className="col-span-5 sm:col-span-1">
                      <input 
                        type="number" step="5" min="0" max="100" 
                        value={param.max_score} onChange={(e) => updateParam(cat.id, param.id, 'max_score', e.target.value)}
                        className="w-full px-1.5 py-1 text-xs bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded text-[var(--text-primary)] outline-none"
                      />
                    </div>
                    <div className="col-span-5 sm:col-span-2">
                      <input 
                        type="number" step="0.05" min="0" max="1" 
                        value={param.weight} onChange={(e) => updateParam(cat.id, param.id, 'weight', e.target.value)}
                        className="w-full px-1.5 py-1 text-xs bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded text-[var(--text-primary)] outline-none"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1 flex justify-end">
                      <button onClick={() => removeParameter(cat.id, param.id)} className="p-1 text-[var(--text-muted)] hover:text-[var(--danger)] rounded">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
                <div className="pt-2">
                  <Button variant="ghost" size="sm" onClick={() => addParameter(cat.id)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs h-7 px-2">
                    <Plus size={12} className="mr-1" /> Add Parameter
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
        <Button variant="secondary" size="sm" onClick={addCategory} className="w-full border-dashed border-[var(--border-default)]">
          <Plus size={14} className="mr-2" /> Add New Category
        </Button>
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
