'use client'

import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Loader2, TrendingUp, AlertTriangle } from 'lucide-react'

export function HistoricalTrends({ facultyId }: { facultyId: string }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchHistory() {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        
        const res = await fetch(`${baseUrl}/faculty/${facultyId}/assessment/history`, {
          headers: session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}
        })
        if (!res.ok) throw new Error('Failed to fetch history')
        const result = await res.json()
        setData(result)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchHistory()
  }, [facultyId])

  if (loading) return <div className="h-[300px] flex items-center justify-center border rounded-xl bg-[var(--bg-elevated)]"><Loader2 className="animate-spin text-[var(--accent)]" /></div>
  if (!data || !data.items || data.items.length === 0) return null

  // Format data for Recharts (oldest to newest)
  // Assumes history items are sorted newest first, so we reverse them
  const chartData = [...data.items].reverse().map(item => {
    const d = new Date(item.created_at)
    const year = d.getFullYear()
    const label = `${d.toLocaleString('default', { month: 'short' })} ${year}`
    
    let cats: any = {}
    if (item.kpi_scores) {
      item.kpi_scores.forEach((k: any) => {
        cats[k.category] = k.computed_score
      })
    }
    
    return {
      name: label,
      total: item.total_score,
      ...cats
    }
  })

  // Extract unique categories for lines
  const categories = new Set<string>()
  data.items.forEach((item: any) => {
    if (item.kpi_scores) {
      item.kpi_scores.forEach((k: any) => categories.add(k.category))
    }
  })
  
  const colors = ['#c07a4f', '#3cb97a', '#4da9d9', '#d9923a', '#9b59b6', '#e74c3c', '#34495e']

  return (
    <div className="p-6 rounded-xl border bg-[var(--bg-elevated)] border-[var(--border-subtle)] space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[var(--bg-base)] text-[var(--accent)]">
            <TrendingUp size={18} />
          </div>
          <div>
            <h3 className="font-semibold text-base text-[var(--text-primary)]">Historical Assessment Trends</h3>
            <p className="text-xs text-[var(--text-muted)]">Longitudinal tracking of performance dimensions</p>
          </div>
        </div>
        {data.is_demo && (
          <div className="flex items-center gap-1 text-xs px-2 py-1 bg-[var(--warning-muted)] text-[var(--warning)] rounded border border-[var(--warning)] border-opacity-20">
            <AlertTriangle size={12} />
            <span>Simulated SIH Demo Data</span>
          </div>
        )}
      </div>

      <div className="h-[350px] w-full pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
            <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip 
              contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)', borderRadius: '8px' }}
              itemStyle={{ color: 'var(--text-primary)', fontSize: '12px' }}
              labelStyle={{ color: 'var(--text-secondary)', marginBottom: '8px' }}
            />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
            <Line type="monotone" dataKey="total" name="Overall Score" stroke="#e4e8f0" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            {Array.from(categories).map((cat, i) => (
              <Line key={cat} type="monotone" dataKey={cat} name={cat} stroke={colors[i % colors.length]} strokeWidth={2} dot={{ r: 3 }} opacity={0.8} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
