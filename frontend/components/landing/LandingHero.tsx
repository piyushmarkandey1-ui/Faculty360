"use client";

import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight, BookOpen, Fingerprint,
  Building2, Network, GraduationCap, Database, Award,
} from "lucide-react";
import { ROUTES } from "@/lib/constants/routes";
import Shuffle from "@/components/ui/Shuffle";

const TEAL   = "#0F8B8D";
const NAVY   = "#17233C";
const BLUE   = "#4F6BED";
const GOLD   = "#D6A84F";
const WHITE  = "#FFFFFF";
const BORDER = "#E4E8EF";
const SLATE  = "#5D6B82";

const PILLS = [
  { id: "scholar",       Icon: BookOpen,      label: "Google Scholar",    sub: "87 Publications · 1,842 Citations", color: TEAL,      x: -215, y: -132 },
  { id: "orcid",         Icon: Fingerprint,   label: "ORCID",             sub: "Research Identity · 31 Works",      color: "#7C3AED", x:  178, y: -118 },
  { id: "rg",            Icon: Network,       label: "ResearchGate",      sub: "43 Publications · Activity",        color: GOLD,      x:  208, y:   22 },
  { id: "institutional", Icon: Building2,     label: "Institutional Data", sub: "Teaching · Mentoring · Service",   color: BLUE,      x: -218, y:   18 },
  { id: "teaching",      Icon: GraduationCap, label: "Teaching Records",  sub: "12 hrs/wk · 17 Mentored",           color: NAVY,      x: -168, y:  152 },
  { id: "awards",        Icon: Award,         label: "Awards",             sub: "4 Awards · 2 Grants",              color: "#D97706", x:   18, y:  182 },
  { id: "hr",            Icon: Database,      label: "HR / ERP",           sub: "Employment · HR Records",          color: SLATE,     x:  188, y:  148 },
] as const;

const KPI_BARS = [
  { label: "Research Impact",     val: 91, color: TEAL },
  { label: "Teaching Excellence", val: 86, color: BLUE },
  { label: "Mentoring & Service", val: 84, color: GOLD },
];

const CIRCUMFERENCE = 2 * Math.PI * 91;

function ScoreCounter({ run }: { run: boolean }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!run) return;
    let raf: number;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / 800, 1);
      setV(87.4 * (1 - Math.pow(1 - p, 4)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run]);
  return <>{v.toFixed(1)}</>;
}

type Phase = 0 | 1 | 2 | 3;

function HeroAnimation() {
  const [phase,          setPhase]          = useState<Phase>(0);
  const [loopKey,        setLoopKey]        = useState(0);
  const [runCounter,     setRunCounter]     = useState(false);
  const [connectedCount, setConnectedCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const timers       = useRef<ReturnType<typeof setTimeout>[]>([]);
  // FIX: Provide an initial value to useRef to satisfy TypeScript
  const seqRef       = useRef<(() => void) | null>(null);

  useEffect(() => {
    seqRef.current = () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
      setPhase(0);
      setRunCounter(false);
      setConnectedCount(0);
      setLoopKey((k) => k + 1);

      const T: ReturnType<typeof setTimeout>[] = [];

      T.push(setTimeout(() => setPhase(1), 1500));

      for (let i = 0; i < 7; i++) {
        T.push(setTimeout(() => setConnectedCount(i + 1), 1500 + i * 150 + 400));
      }

      T.push(setTimeout(() => setPhase(2), 3000));
      T.push(setTimeout(() => setPhase(3), 3800));
      T.push(setTimeout(() => setRunCounter(true), 3800 + 400));
      T.push(setTimeout(() => seqRef.current?.(), 8000));

      timers.current = T;
    };
  });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) seqRef.current?.(); },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => { io.disconnect(); timers.current.forEach(clearTimeout); };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full flex items-center justify-center" style={{ height: 440 }}>
      <div className="relative" style={{ width: 520, height: 400 }}>

        {PILLS.map((pill, idx) => {
          const { Icon } = pill;
          return (
            <motion.div
              key={`${pill.id}-${loopKey}`}
              className="absolute flex items-center gap-3 px-3 pr-5 py-2.5 rounded-xl"
              style={{
                background: WHITE, border: `1px solid ${pill.color}30`,
                boxShadow: "0 4px 14px rgba(23,35,60,0.07)",
                left: "50%", top: "50%", marginLeft: -100, marginTop: -25,
                willChange: "transform, opacity", zIndex: 5,
              }}
              initial={{ x: pill.x, y: pill.y, opacity: 1, scale: 1 }}
              animate={
                phase === 0 ? { 
                  x: pill.x, y: [pill.y, pill.y - 6, pill.y], opacity: 1, scale: 1,
                  transition: {
                    y: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: idx * 0.2 },
                    default: { duration: 0 }
                  }
                }
                : phase === 1 ? { 
                  x: 0, y: 0, opacity: 0.88, scale: 0.78,
                  transition: { duration: 0.6, ease: "easeInOut", delay: idx * 0.15 } 
                }
                : { 
                  x: 0, y: 0, opacity: 0, scale: 0.22,
                  transition: { duration: 0.16, ease: "easeIn" } 
                }
              }
            >
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: pill.color + "18", color: pill.color }}>
                <Icon size={18} />
              </div>
              <div className="pointer-events-none select-none">
                <div className="text-sm font-bold whitespace-nowrap" style={{ color: NAVY }}>{pill.label}</div>
                <div className="text-[10px] font-medium whitespace-nowrap" style={{ color: SLATE }}>{pill.sub}</div>
              </div>
            </motion.div>
          );
        })}

        <AnimatePresence>
          {phase < 3 && (
            <motion.div key="core"
              className="absolute flex flex-col items-center justify-center rounded-full"
              style={{
                width: 200, height: 200, left: "50%", top: "50%",
                marginLeft: -100, marginTop: -100,
                background: WHITE, border: `2px solid ${BORDER}`,
                willChange: "transform, opacity", zIndex: 10, overflow: "visible",
              }}
              initial={{ scale: 0.88, opacity: 0 }}
              animate={
                phase === 2
                  ? { scale: 1.08, opacity: 1,
                      boxShadow: [`0 0 0px ${TEAL}00`, `0 0 52px ${TEAL}66`, `0 0 22px ${TEAL}33`] }
                  : { scale: 1, opacity: 1, boxShadow: "0 8px 30px rgba(23,35,60,0.07)" }
              }
              exit={{ scale: 3.6, opacity: 0, transition: { duration: 0.42, ease: "easeOut" } }}
              transition={{ duration: 0.36, ease: "easeOut" }}
            >
              {/* Phase 2 pulsing ring */}
              {phase === 2 && (
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{ border: `2px solid ${TEAL}` }}
                  initial={{ scale: 1, opacity: 0.8 }}
                  animate={{ scale: 1.5, opacity: 0 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              )}

              <div className="text-[11px] font-bold uppercase tracking-widest mb-1 relative z-10" style={{ color: SLATE }}>AcadLens Core</div>
              <div className="text-sm font-semibold relative z-10"
                style={{ color: phase === 2 ? TEAL : phase === 1 ? NAVY : SLATE }}>
                {phase === 0 ? "7 Sources Detected" : phase === 1 ? `${connectedCount}/7 Connected` : "Fusing Data..."}
              </div>
              <svg className="absolute inset-0 pointer-events-none"
                style={{ width: 200, height: 200, transform: "rotate(-90deg)" }} viewBox="0 0 200 200">
                <circle cx="100" cy="100" r="91" fill="none" stroke={BORDER} strokeWidth="3" />
                <motion.circle
                  cx="100" cy="100" r="91" fill="none"
                  stroke={TEAL} strokeWidth="3.5" strokeLinecap="round"
                  strokeDasharray={CIRCUMFERENCE}
                  initial={{ strokeDashoffset: CIRCUMFERENCE }}
                  animate={{
                    strokeDashoffset:
                      phase >= 2 ? 0 : phase === 1 ? 0 : CIRCUMFERENCE,
                  }}
                  transition={
                    phase >= 2 ? { duration: 0.3, ease: "easeOut" }
                    : phase === 1 ? { duration: 1.5, ease: "easeInOut" }
                    : { duration: 0 }
                  }
                />
              </svg>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {phase === 3 && (
            <motion.div key="card" className="absolute overflow-hidden"
              style={{
                left: "50%", top: "50%", marginLeft: -210, marginTop: -178,
                width: 420, background: WHITE, border: `1px solid ${BORDER}`,
                boxShadow: "0 24px 64px rgba(23,35,60,0.13)",
                willChange: "transform, opacity", zIndex: 20,
              }}
              initial={{ scale: 0.15, opacity: 0, borderRadius: "50%" }}
              animate={{ scale: 1,    opacity: 1, borderRadius: "20px" }}
              transition={{ type: "spring", stiffness: 120, damping: 22, mass: 0.8 }}
            >
              <div style={{ padding: 24 }}>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.4, ease: "easeOut" }}>
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-extrabold flex-shrink-0"
                      style={{ background: TEAL + "18", border: `2px solid ${TEAL}`, color: TEAL }}>AS</div>
                    <div>
                      <div className="text-lg font-extrabold" style={{ color: NAVY, letterSpacing: "-0.02em" }}>Dr. Ananya Sharma</div>
                      <div className="text-xs font-medium" style={{ color: SLATE }}>Professor · Computer Science · NIT Warangal</div>
                    </div>
                  </div>
                </motion.div>
                <motion.div className="grid grid-cols-2 gap-3 mb-5"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.4, ease: "easeOut" }}>
                  <div className="p-3 rounded-xl" style={{ background: TEAL + "0D", border: `1px solid ${TEAL}22` }}>
                    <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: SLATE }}>Overall Score</div>
                    <div className="text-3xl font-extrabold" style={{ color: TEAL }}><ScoreCounter run={runCounter} /></div>
                  </div>
                  <div className="p-3 rounded-xl" style={{ background: "#f8fafc", border: `1px solid ${BORDER}` }}>
                    <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: SLATE }}>Evidence</div>
                    <div className="text-3xl font-extrabold" style={{ color: NAVY }}>7 <span className="text-lg font-bold" style={{ color: SLATE }}>Src</span></div>
                  </div>
                </motion.div>
                <div className="space-y-3">
                  {KPI_BARS.map((bar, i) => (
                    <motion.div key={bar.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 + i * 0.1, duration: 0.4, ease: "easeOut" }}>
                      <div className="flex justify-between text-[11px] font-bold mb-1.5">
                        <span style={{ color: SLATE }}>{bar.label}</span>
                        <span style={{ color: NAVY }}>{bar.val}</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: BORDER }}>
                        <motion.div className="h-full rounded-full"
                          style={{ background: bar.color, transformOrigin: "left center" }}
                          initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
                          transition={{ delay: 1.0 + i * 0.1, duration: 0.4, ease: "easeOut" }} />
                      </div>
                    </motion.div>
                  ))}
                </div>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2, duration: 0.3 }}>
                  <Link href={ROUTES.dashboard}
                    className="flex items-center justify-center w-full mt-5 py-3 rounded-xl text-sm font-bold gap-2 transition-all hover:opacity-90"
                    style={{ background: NAVY, color: WHITE }}>
                    Explore Platform <ArrowRight size={14} />
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}

export function LandingHero() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="relative min-h-[92vh] flex items-center pt-20 pb-16 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true"
        style={{
          backgroundImage: `linear-gradient(${BORDER} 1px, transparent 1px), linear-gradient(90deg, ${BORDER} 1px, transparent 1px)`,
          backgroundSize: "52px 52px", opacity: 0.25,
          maskImage: "radial-gradient(ellipse 70% 70% at 60% 40%, black 10%, transparent 90%)",
        }} />
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute" style={{ width: 700, height: 600, background: `radial-gradient(ellipse, ${TEAL}0A 0%, transparent 70%)`, top: "-10%", right: "10%", filter: "blur(40px)" }} />
        <div className="absolute" style={{ width: 500, height: 400, background: `radial-gradient(ellipse, ${BLUE}07 0%, transparent 70%)`, bottom: "5%", left: "5%", filter: "blur(50px)" }} />
      </div>
      <div className="container-page relative z-10 w-full flex flex-col lg:flex-row items-center gap-8 lg:gap-0">
        <motion.div className="w-full lg:w-[45%] lg:pr-16 flex items-center"
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.55, ease: [0.4, 0, 0.2, 1] }}>
          <div className="w-full">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.0, ease: "easeOut" }}
              className="flex items-center gap-2 mb-6">
              <span className="inline-block w-6 h-px" style={{ backgroundColor: TEAL, opacity: 0.8 }} />
              <span className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: TEAL }}>Smart India Hackathon 2026 · PS64</span>
            </motion.div>
            <div className="pl-5 border-l-4" style={{ borderColor: TEAL }}>
              <motion.div
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 30, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.7, delay: 0.1, ease: [0, 0, 0.2, 1] }}>
                <span className="block font-black leading-[1.05]"
                  style={{ fontSize: "clamp(3.2rem, 5vw, 5.1rem)", color: NAVY, letterSpacing: "-0.035em" }}>Fragmented Data</span>
              </motion.div>
              <motion.div
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 30, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.7, delay: 0.2, ease: [0, 0, 0.2, 1] }}>
                <Shuffle text="to Explainable Insight" tag="span"
                  className="block font-bold leading-[1.05]"
                  style={{ fontSize: "clamp(2.6rem, 3.9vw, 4.2rem)", color: TEAL, letterSpacing: "-0.03em" }}
                  textAlign="left" shuffleDirection="right" duration={0.38} animationMode="evenodd"
                  shuffleTimes={1} ease="power3.out" stagger={0.025} threshold={0.15}
                  triggerOnce={true} triggerOnHover={true} respectReducedMotion={true} />
              </motion.div>
            </div>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.38, ease: "easeOut" }}
              className="mt-8 pl-5 flex flex-col gap-5">
              <p className="text-sm leading-relaxed max-w-xs" style={{ color: SLATE }}>
                Multi-source academic profile analytics. Deduplication, evidence scoring, and transparent AI assessment.
              </p>
              <Link href={ROUTES.dashboard}
                className="inline-flex items-center gap-2 self-start px-5 py-2.5 rounded-lg border text-sm font-semibold transition-all duration-200"
                style={{ color: NAVY, borderColor: BORDER, background: WHITE }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = TEAL; (e.currentTarget as HTMLElement).style.color = TEAL; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = BORDER; (e.currentTarget as HTMLElement).style.color = NAVY; }}>
                Explore Platform <ArrowRight size={14} />
              </Link>
            </motion.div>
          </div>
        </motion.div>
        <motion.div className="w-full lg:w-[55%]"
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.1, delay: 0.3, ease: "easeOut" }}>
          <HeroAnimation />
        </motion.div>
      </div>
    </section>
  );
}
