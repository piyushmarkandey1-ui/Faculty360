'use client'

import React, { useRef, useState, useEffect } from 'react'
import { motion, useScroll, useSpring, useMotionValueEvent, useReducedMotion } from 'framer-motion'
import {
  FileText,
  User,
  BookOpen,
  Award,
  Link2,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Building,
  GraduationCap
} from 'lucide-react'

const TEAL = '#0F8B8D'
const NAVY = '#17233C'
const BLUE = '#4F6BED'
const GOLD = '#D6A84F'
const IVORY = '#F7F8F5'
const WHITE = '#FFFFFF'
const BORDER = '#E4E8EF'
const SLATE = '#5D6B82'
const EMERALD = '#2E9B72'
const CORAL = '#D65A5A'
const AMBER = '#C98A24'

const ACTS = {
  COLLECT: [0.00, 0.28] as [number, number],
  RECONCILE: [0.25, 0.62] as [number, number],
  UNDERSTAND: [0.59, 0.82] as [number, number],
  EXPLAIN: [0.80, 1.00] as [number, number],
}

function sp(progress: number, range: [number, number]) {
  if (range[1] === range[0]) return 1
  return Math.min(1, Math.max(0, (progress - range[0]) / (range[1] - range[0])))
}

function sceneOpacity(progress: number, range: [number, number]): number {
  const enterProgress = sp(progress, [range[0], range[0] + 0.06])
  const exitProgress = sp(progress, [range[1] - 0.07, range[1]])
  return Math.max(0, enterProgress - exitProgress)
}

function sceneScale(progress: number, range: [number, number]): number {
  const enter = sp(progress, [range[0], range[0] + 0.06])
  const exit = sp(progress, [range[1] - 0.07, range[1]])
  return 0.94 + enter * 0.06 - exit * 0.06
}

export function CinematicStory() {
  const containerRef = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end end'] })
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 60, damping: 20 })
  const [p, setP] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])
  useMotionValueEvent(smoothProgress, 'change', setP)

  if (prefersReducedMotion) {
    return (
      <section className="py-24 px-6 md:px-12 bg-[#F7F8F5] text-[#17233C]">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-sm font-bold tracking-widest text-[#0F8B8D] mb-2">01 COLLECT</h2>
            <h3 className="text-3xl font-extrabold mb-4">Ingest everything</h3>
            <p className="text-[#5D6B82]">We pull from Google Scholar, institutional APIs, ORCID, and ResearchGate to gather a complete footprint of a faculty member's work.</p>
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-widest text-[#0F8B8D] mb-2">02 RECONCILE</h2>
            <h3 className="text-3xl font-extrabold mb-4">Resolve Identity & Conflicts</h3>
            <p className="text-[#5D6B82]">Our AI deduplicates variants of names and automatically flags conflicting publication dates or mismatched affiliation data for human review.</p>
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-widest text-[#0F8B8D] mb-2">03 UNDERSTAND</h2>
            <h3 className="text-3xl font-extrabold mb-4">Comprehensive Assessment</h3>
            <p className="text-[#5D6B82]">We synthesize teaching, research, innovation, and mentoring metrics into a unified 360° faculty profile.</p>
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-widest text-[#0F8B8D] mb-2">04 EXPLAIN</h2>
            <h3 className="text-3xl font-extrabold mb-4">Transparent Evidence</h3>
            <p className="text-[#5D6B82]">Every score is backed by a verifiable chain of evidence down to the source systems, accompanied by AI advisories.</p>
          </div>
        </div>
      </section>
    )
  }

  // Calculate active act for sidebar
  let activeActIndex = 0
  if (p >= ACTS.RECONCILE[0] && p < ACTS.UNDERSTAND[0]) activeActIndex = 1
  if (p >= ACTS.UNDERSTAND[0] && p < ACTS.EXPLAIN[0]) activeActIndex = 2
  if (p >= ACTS.EXPLAIN[0]) activeActIndex = 3

  // ACT 01 Computations
  const opCollect = sceneOpacity(p, ACTS.COLLECT)
  const scCollect = sceneScale(p, ACTS.COLLECT)
  const cSp1 = sp(p, [0, 0.12])
  const cSp2 = sp(p, [0.04, 0.16])
  const cSp3 = sp(p, [0.08, 0.20])
  const cPathSp = sp(p, [0.14, 0.26])

  // ACT 02 Computations
  const rPhaseA = [0.25, 0.43] as [number, number]
  const opRecA = sceneOpacity(p, rPhaseA)
  const scRecA = sceneScale(p, rPhaseA)
  
  const rSpA = sp(p, rPhaseA)
  const idConv1 = sp(p, [0.25, 0.35])
  const idConv2 = sp(p, [0.27, 0.37])
  const idConv3 = sp(p, [0.29, 0.39])
  const showMerged = rSpA > 0.75

  const rPhaseB = [0.43, 0.62] as [number, number]
  const opRecB = sceneOpacity(p, rPhaseB)
  const scRecB = sceneScale(p, rPhaseB)
  const rSpB = sp(p, rPhaseB)

  // ACT 03 Computations
  const uPhaseA = [0.59, 0.71] as [number, number]
  const opUndA = sceneOpacity(p, uPhaseA)
  const scUndA = sceneScale(p, uPhaseA)
  const uSpA = sp(p, uPhaseA)

  const uPhaseB = [0.68, 0.82] as [number, number]
  const opUndB = sceneOpacity(p, uPhaseB)
  const scUndB = sceneScale(p, uPhaseB)
  const uSpB = sp(p, uPhaseB)

  // ACT 04 Computations
  const opExp = sp(p, [0.80, 0.86]) // Never exits
  const scExp = 0.94 + opExp * 0.06
  const eLineSp = sp(p, [0.82, 0.98])
  const eAdvisorySp = sp(p, [0.80, 1.0])

  return (
    <div ref={containerRef} className="relative w-full" style={{ height: '450vh' }}>
      <div className="sticky top-0 h-screen w-full overflow-hidden" style={{ backgroundColor: IVORY }}>
        
        {/* Background Grid & Ambient Glow */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-40" 
             style={{ backgroundImage: 'linear-gradient(#E4E8EF 1px, transparent 1px), linear-gradient(90deg, #E4E8EF 1px, transparent 1px)', backgroundSize: '52px 52px' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[120px] opacity-20 pointer-events-none transition-colors duration-1000"
             style={{ backgroundColor: activeActIndex < 2 ? TEAL : BLUE }} />

        {/* ACT 01: COLLECT */}
        {opCollect > 0 && (
          <div className="absolute inset-0 flex items-center justify-center z-10"
               style={{ opacity: opCollect, transform: `scale(${scCollect})` }}>
            <div className="relative w-full max-w-5xl h-[600px]">
              
              {/* Paths */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1000 600">
                <path id="path1" d="M 200 300 Q 350 300 500 330" fill="none" stroke={BORDER} strokeWidth="2"
                      strokeDasharray="400" strokeDashoffset={400 * (1 - cPathSp)} />
                <path id="path2" d="M 500 500 Q 500 415 500 330" fill="none" stroke={BORDER} strokeWidth="2"
                      strokeDasharray="200" strokeDashoffset={200 * (1 - cPathSp)} />
                <path id="path3" d="M 800 300 Q 650 300 500 330" fill="none" stroke={BORDER} strokeWidth="2"
                      strokeDasharray="400" strokeDashoffset={400 * (1 - cPathSp)} />
                
                {mounted && cPathSp > 0.9 && (
                  <>
                    <circle r="4" fill={TEAL}><animateMotion dur="2s" repeatCount="indefinite" path="M 200 300 Q 350 300 500 330" /></circle>
                    <circle r="4" fill={TEAL}><animateMotion dur="2.5s" repeatCount="indefinite" path="M 200 300 Q 350 300 500 330" /></circle>
                    <circle r="4" fill={BLUE}><animateMotion dur="2.2s" repeatCount="indefinite" path="M 500 500 Q 500 415 500 330" /></circle>
                    <circle r="4" fill={BLUE}><animateMotion dur="1.8s" repeatCount="indefinite" path="M 500 500 Q 500 415 500 330" /></circle>
                    <circle r="4" fill={GOLD}><animateMotion dur="2.1s" repeatCount="indefinite" path="M 800 300 Q 650 300 500 330" /></circle>
                    <circle r="4" fill={GOLD}><animateMotion dur="2.6s" repeatCount="indefinite" path="M 800 300 Q 650 300 500 330" /></circle>
                  </>
                )}
              </svg>

              {/* Cards */}
              <div className="absolute top-[200px] left-[80px] w-[240px] bg-white p-5 rounded-xl shadow-lg border border-[#E4E8EF]"
                   style={{ transform: `translateX(${(1 - cSp1) * -120}px)`, opacity: cSp1 }}>
                <div className="text-xs font-bold mb-3 uppercase tracking-wider" style={{ color: TEAL }}>Google Scholar</div>
                <div className="space-y-2 text-sm text-[#17233C]">
                  <div className="flex justify-between"><span>Publications</span><span className="font-semibold">87</span></div>
                  <div className="flex justify-between"><span>Citations</span><span className="font-semibold">1,842</span></div>
                  <div className="flex justify-between"><span>h-index</span><span className="font-semibold">21</span></div>
                </div>
              </div>

              <div className="absolute bottom-[20px] left-1/2 -translate-x-1/2 w-[240px] bg-white p-5 rounded-xl shadow-lg border border-[#E4E8EF]"
                   style={{ transform: `translate(-50%, ${(1 - cSp2) * 80}px)`, opacity: cSp2 }}>
                <div className="text-xs font-bold mb-3 uppercase tracking-wider" style={{ color: BLUE }}>Institutional Data</div>
                <div className="space-y-2 text-sm text-[#17233C]">
                  <div className="flex justify-between"><span>Teaching</span><span className="font-semibold">12 hrs/wk</span></div>
                  <div className="flex justify-between"><span>Mentored</span><span className="font-semibold">17</span></div>
                  <div className="flex justify-between"><span>Committees</span><span className="font-semibold">4</span></div>
                </div>
              </div>

              <div className="absolute top-[200px] right-[80px] w-[240px] bg-white p-5 rounded-xl shadow-lg border border-[#E4E8EF]"
                   style={{ transform: `translateX(${(1 - cSp3) * 120}px)`, opacity: cSp3 }}>
                <div className="text-xs font-bold mb-3 uppercase tracking-wider" style={{ color: GOLD }}>ResearchGate</div>
                <div className="space-y-2 text-sm text-[#17233C]">
                  <div className="flex justify-between"><span>Activity</span><span className="font-semibold">High</span></div>
                  <div className="flex justify-between"><span>Publications</span><span className="font-semibold">43</span></div>
                </div>
              </div>

              {/* Center Node */}
              <div className="absolute top-[330px] left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-[#17233C] flex items-center justify-center shadow-[0_0_20px_rgba(23,35,60,0.3)] animate-pulse">
                  <span className="text-white font-bold text-sm">A³P</span>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ACT 02: RECONCILE - Phase A */}
        {opRecA > 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20"
               style={{ opacity: opRecA, transform: `scale(${scRecA})` }}>
            <div className="text-sm font-bold tracking-widest text-[#0F8B8D] mb-12">RECONCILE — Identity Resolution</div>
            
            <div className="relative w-full max-w-md h-[240px] flex flex-col items-center justify-center">
              {!showMerged ? (
                <div className="space-y-4 w-full relative">
                  <div className="bg-white p-4 rounded-lg shadow border border-[#E4E8EF] flex items-center justify-between"
                       style={{ transform: `translateX(${(1 - idConv1) * -50}px)`, opacity: 1 - (rSpA - 0.6) * 5 }}>
                    <span className="font-medium">Dr. Rajesh Kumar Sharma</span>
                    <span className="text-[10px] uppercase font-bold px-2 py-1 rounded bg-teal-50 text-teal-700">Scholar</span>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow border border-[#E4E8EF] flex items-center justify-between"
                       style={{ transform: `translateX(${(1 - idConv2) * 50}px)`, opacity: 1 - (rSpA - 0.6) * 5 }}>
                    <span className="font-medium">R. K. Sharma</span>
                    <span className="text-[10px] uppercase font-bold px-2 py-1 rounded bg-amber-50 text-amber-700">RGate</span>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow border border-[#E4E8EF] flex items-center justify-between"
                       style={{ transform: `translateX(${(1 - idConv3) * -30}px)`, opacity: 1 - (rSpA - 0.6) * 5 }}>
                    <span className="font-medium">Rajesh K Sharma</span>
                    <span className="text-[10px] uppercase font-bold px-2 py-1 rounded bg-blue-50 text-blue-700">Institution</span>
                  </div>
                </div>
              ) : (
                <div className="bg-white p-6 rounded-xl shadow-xl border-2 border-green-500 w-full flex flex-col items-center"
                     style={{ opacity: (rSpA - 0.75) * 4 }}>
                  <CheckCircle2 className="w-8 h-8 text-green-500 mb-3" />
                  <h4 className="text-xl font-bold text-[#17233C] mb-1">Dr. Rajesh Kumar Sharma</h4>
                  <div className="flex space-x-3 text-sm mt-2">
                    <span className="text-green-600 font-semibold">97% Identity Match</span>
                    <span className="text-[#5D6B82]">4 Sources Unified</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ACT 02: RECONCILE - Phase B */}
        {opRecB > 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20"
               style={{ opacity: opRecB, transform: `scale(${scRecB})` }}>
            
            {rSpB < 0.5 ? (
              <div className="flex flex-col items-center">
                <div className="text-sm font-bold tracking-widest text-[#0F8B8D] mb-8">RECONCILE — Deduplication</div>
                <div className="flex space-x-4 mb-6">
                  {['Scholar', 'Inst', 'ORCID'].map((src, i) => (
                    <div key={i} className="bg-white p-3 rounded shadow border border-[#E4E8EF] text-xs w-32 text-center">
                      <div className="text-gray-400 mb-1">{src}</div>
                      <div className="font-medium truncate">Machine Learning for Smart Agriculture</div>
                    </div>
                  ))}
                </div>
                <div className="text-sm font-bold text-teal-600 flex flex-col items-center">
                  <div className="h-6 w-px bg-teal-600 mb-2"></div>
                  ↓ 1 Canonical Record
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center w-full max-w-2xl">
                <div className="flex items-center space-x-2 text-amber-600 mb-8">
                  <AlertTriangle className="w-6 h-6" />
                  <h3 className="text-xl font-bold">Conflict Detected</h3>
                </div>
                <div className="flex items-stretch justify-center w-full space-x-8 relative">
                  <div className="bg-white p-6 rounded-xl shadow border border-amber-200 w-1/2 flex flex-col items-center z-10">
                    <span className="text-xs font-bold text-[#0F8B8D] mb-2 uppercase">Google Scholar</span>
                    <span className="text-3xl font-bold">2025</span>
                  </div>
                  
                  {/* Connection Line */}
                  <div className="absolute top-1/2 left-[25%] right-[25%] h-[2px] bg-amber-400 -translate-y-1/2 border-dashed border-t-2"></div>
                  
                  <div className="bg-white p-6 rounded-xl shadow border border-amber-200 w-1/2 flex flex-col items-center z-10">
                    <span className="text-xs font-bold text-[#4F6BED] mb-2 uppercase">Institution</span>
                    <span className="text-3xl font-bold">2024</span>
                  </div>
                </div>
                <div className="mt-8 text-sm font-bold bg-amber-100 text-amber-800 px-4 py-2 rounded-full">
                  REVIEW REQUIRED — HUMANS DECIDE
                </div>
              </div>
            )}
          </div>
        )}

        {/* ACT 03: UNDERSTAND - Phase A */}
        {opUndA > 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-30"
               style={{ opacity: opUndA, transform: `scale(${scUndA})` }}>
            <div className="w-full max-w-3xl">
              
              <div className="bg-white rounded-2xl shadow-xl border border-[#E4E8EF] p-8 mb-8 flex items-center space-x-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-500 to-blue-600 text-white flex items-center justify-center text-2xl font-bold shadow-inner">
                  RK
                </div>
                <div>
                  <h2 className="text-3xl font-extrabold text-[#17233C] mb-1">Dr. Rajesh Kumar Sharma</h2>
                  <p className="text-[#5D6B82] font-medium">Associate Professor · Information Technology · NIT Warangal</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Publications', val: 87, icon: FileText, color: 'text-teal-600', bg: 'bg-teal-50' },
                  { label: 'Citations', val: 1842, icon: Link2, color: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: 'h-index', val: 21, icon: Award, color: 'text-purple-600', bg: 'bg-purple-50' },
                  { label: 'Projects', val: 12, icon: Lightbulb, color: 'text-amber-600', bg: 'bg-amber-50' },
                  { label: 'Patents', val: 3, icon: Building, color: 'text-rose-600', bg: 'bg-rose-50' },
                  { label: 'Students Mentored', val: 17, icon: GraduationCap, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                ].map((m, i) => (
                  <div key={i} className="bg-white p-5 rounded-xl shadow border border-[#E4E8EF] flex items-center space-x-4">
                    <div className={`p-3 rounded-lg ${m.bg} ${m.color}`}>
                      <m.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-[#17233C]">{Math.round(uSpA * m.val)}</div>
                      <div className="text-xs text-[#5D6B82] font-semibold uppercase">{m.label}</div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>
        )}

        {/* ACT 03: UNDERSTAND - Phase B */}
        {opUndB > 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-30"
               style={{ opacity: opUndB, transform: `scale(${scUndB})` }}>
            
            <div className="relative w-64 h-64 flex items-center justify-center mb-12">
              <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 200 200">
                <circle cx="100" cy="100" r="80" fill="none" stroke="#E4E8EF" strokeWidth="12" />
                <circle cx="100" cy="100" r="80" fill="none" stroke={TEAL} strokeWidth="12" strokeLinecap="round"
                        strokeDasharray="502" strokeDashoffset={502 * (1 - uSpB * 0.847)} />
              </svg>
              <div className="flex flex-col items-center">
                <span className="text-6xl font-extrabold text-[#0F8B8D]">
                  {(uSpB * 84.7).toFixed(1)}
                </span>
                <span className="text-sm font-bold text-[#5D6B82] uppercase tracking-wider mt-1">A³P Score</span>
              </div>
            </div>

            <div className="w-full max-w-xl space-y-5">
              {[
                { label: 'Research', score: 81.5, color: TEAL },
                { label: 'Teaching', score: 88.0, color: BLUE },
                { label: 'Mentoring', score: 72.0, color: '#7C3AED' },
                { label: 'Innovation', score: 79.0, color: GOLD },
              ].map((param, i) => (
                <div key={i} className="w-full">
                  <div className="flex justify-between text-sm font-semibold mb-2">
                    <span className="text-[#17233C] uppercase">{param.label}</span>
                    <span style={{ color: param.color }}>{param.score.toFixed(1)}</span>
                  </div>
                  <div className="h-3 w-full bg-[#E4E8EF] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-300 ease-out"
                         style={{ backgroundColor: param.color, width: `${uSpB * param.score}%` }} />
                  </div>
                </div>
              ))}
            </div>
            
          </div>
        )}

        {/* ACT 04: EXPLAIN */}
        {opExp > 0 && (
          <div className="absolute inset-0 flex flex-col pt-24 items-center z-40"
               style={{ opacity: opExp, transform: `scale(${scExp})` }}>
            <h2 className="text-2xl md:text-4xl font-extrabold text-[#17233C] mb-12 tracking-tight">
              EVERY SCORE SHOULD HAVE A STORY.
            </h2>
            
            <div className="w-full max-w-5xl flex justify-between relative">
              {/* Evidence Chain */}
              <div className="w-[400px] h-[500px] relative">
                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 500">
                  <path d="M 200 60 L 200 450" fill="none" stroke={BORDER} strokeWidth="4" />
                  <path d="M 200 60 L 200 450" fill="none" stroke={TEAL} strokeWidth="4"
                        strokeDasharray="390" strokeDashoffset={390 * (1 - eLineSp)} />
                </svg>

                {[
                  { text: 'Score: 84.7 / 100', y: 60, color: TEAL },
                  { text: 'Parameter: Research — 81.5', y: 157.5, color: BLUE },
                  { text: 'KPI: Publication Output', y: 255, color: GOLD },
                  { text: 'Metric: 87 Canonical Publications', y: 352.5, color: NAVY },
                  { text: 'Source: Google Scholar + Institutional', y: 450, color: EMERALD },
                ].map((node, i) => {
                  const nodeActive = sp(p, [0.80 + i * 0.03, 0.82 + i * 0.03]) > 0
                  return (
                    <div key={i} className="absolute left-1/2 w-max transition-opacity duration-500 flex items-center"
                         style={{ 
                           top: node.y, 
                           transform: 'translate(-50%, -50%)',
                           opacity: nodeActive ? 1 : 0 
                         }}>
                      <div className="bg-white px-4 py-2 rounded-full shadow-md border font-bold text-sm whitespace-nowrap"
                           style={{ borderColor: node.color, color: node.color }}>
                        {node.text}
                      </div>
                      {nodeActive && (
                        <div className="absolute left-1/2 top-1/2 w-4 h-4 rounded-full -translate-x-1/2 -translate-y-1/2 animate-pulse"
                             style={{ backgroundColor: node.color }} />
                      )}
                    </div>
                  )
                })}
              </div>

              {/* AI Advisory */}
              <div className="flex-1 max-w-sm flex flex-col justify-center space-y-4">
                {[
                  { tag: 'TREND', text: 'Research output increased significantly', color: 'text-blue-600', bg: 'bg-blue-50' },
                  { tag: 'STRENGTH', text: 'Teaching contribution consistently above benchmark', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                  { tag: 'IMPROVEMENT', text: 'Outreach contribution comparatively lower', color: 'text-amber-600', bg: 'bg-amber-50' },
                  { tag: 'ANOMALY', text: 'Publication year conflict flagged for review', color: 'text-rose-600', bg: 'bg-rose-50' },
                ].map((adv, i) => {
                  const show = eAdvisorySp > 0.65 + i * 0.05
                  return (
                    <div key={i} className="bg-white p-4 rounded-xl shadow-lg border border-[#E4E8EF] transition-all duration-700"
                         style={{ 
                           opacity: show ? 1 : 0, 
                           transform: `translateX(${show ? 0 : 20}px)` 
                         }}>
                      <div className={`text-[10px] font-bold px-2 py-1 rounded inline-block mb-2 ${adv.bg} ${adv.color}`}>
                        {adv.tag}
                      </div>
                      <div className="text-sm text-[#17233C] font-medium">{adv.text}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* CHAPTER INDICATOR */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col space-y-6 z-50">
          {['01 COLLECT', '02 RECONCILE', '03 UNDERSTAND', '04 EXPLAIN'].map((title, i) => {
            const isActive = activeActIndex === i
            return (
              <div key={i} className="flex items-center space-x-3 justify-end">
                <span className={`text-xs font-bold transition-colors duration-300 ${isActive ? 'text-[#0F8B8D]' : 'text-[#5D6B82] opacity-50'}`}>
                  {title}
                </span>
                <div className={`rounded-full transition-all duration-300 ${isActive ? 'w-2 h-2 bg-[#0F8B8D]' : 'w-1.5 h-1.5 bg-[#5D6B82] opacity-50'}`} />
              </div>
            )
          })}
        </div>

        {/* PROGRESS BAR */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-[#E4E8EF] z-50">
          <motion.div className="h-full bg-[#0F8B8D] origin-left" style={{ scaleX: scrollYProgress }} />
        </div>

      </div>
    </div>
  )
}
