"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { 
  ArrowRight, BookOpen, Fingerprint, 
  Building2, Network, GraduationCap, Database, 
  Award, RefreshCw 
} from "lucide-react";
import { ROUTES } from "@/lib/constants/routes";
import Shuffle from "@/components/ui/Shuffle";

const TEAL = "#0F8B8D";
const NAVY = "#17233C";
const BLUE = "#4F6BED";
const GOLD = "#D6A84F";
const WHITE = "#FFFFFF";
const BORDER = "#E4E8EF";
const SLATE = "#5D6B82";

// ─── SOURCE NODE CONFIG ───────────────────────────────────────────────────────
const DRAG_SOURCES = [
  { id: "scholar", label: "Google Scholar", icon: BookOpen, color: TEAL, cx: -168, cy: -126, details: "87 Publications · 1,842 Citations" },
  { id: "orcid", label: "ORCID", icon: Fingerprint, color: "#7C3AED", cx: 168, cy: -109, details: "Research Identity · 31 Works" },
  { id: "institutional", label: "Institutional Data", icon: Building2, color: BLUE, cx: -202, cy: 8, details: "Teaching · Mentoring · Service" },
  { id: "researchgate", label: "ResearchGate", icon: Network, color: GOLD, cx: 202, cy: 25, details: "43 Publications · Activity" },
  { id: "teaching", label: "Teaching Records", icon: GraduationCap, color: NAVY, cx: -151, cy: 134, details: "12 hrs/wk · 17 Mentored" },
  { id: "hr", label: "HR / ERP", icon: Database, color: SLATE, cx: 151, cy: 143, details: "Employment · HR Records" },
  { id: "awards", label: "Awards", icon: Award, color: "#D97706", cx: 0, cy: 168, details: "4 Awards · 2 Grants" },
];

// ─── ANIMATED COUNTER ────────────────────────────────────────────────────────
function AnimatedCounter({ value, decimals = 0 }: { value: number, decimals?: number }) {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let start = 0;
    const duration = 1000;
    const startTime = performance.now();
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const ease = 1 - Math.pow(1 - progress, 4);
      setCount(start + (value - start) * ease);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [value]);
  
  return <>{count.toFixed(decimals)}</>;
}

// ─── DRAG HERO COMPONENT ───────────────────────────────────────────────────────
function DragHero({ onPhaseChange }: { onPhaseChange?: (phase: "collecting" | "fusion" | "profile") => void }) {
  const shouldReduceMotion = useReducedMotion();
  const [connectedSources, setConnectedSources] = useState<string[]>([]);
  const [phase, setPhase] = useState<"collecting" | "fusion" | "profile">("collecting");
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // Responsive scaling to fit perfectly in container and mobile
  useEffect(() => {
    if (!wrapperRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0].contentRect.width;
      if (width < 520 && width > 0) {
        setScale(width / 520);
      } else {
        setScale(1);
      }
    });
    observer.observe(wrapperRef.current);
    return () => observer.disconnect();
  }, []);

  const handleDragEnd = (e: any, info: any, sourceId: string) => {
    if (phase !== "collecting") return;
    const container = containerRef.current?.getBoundingClientRect();
    if (!container) return;
    
    const centerX = container.left + container.width / 2;
    const centerY = container.top + container.height / 2;
    
    const distance = Math.hypot(info.point.x - centerX, info.point.y - centerY);
    
    // Drop radius accounts for scale
    if (distance < 150 * scale) {
      handleConnect(sourceId);
    }
  };

  const handleConnect = (sourceId: string) => {
    if (phase !== "collecting" || connectedSources.includes(sourceId)) return;
    const next = [...connectedSources, sourceId];
    setConnectedSources(next);
    if (next.length === DRAG_SOURCES.length) {
      setPhase("fusion");
      onPhaseChange?.("fusion");
      setTimeout(() => {
        setPhase("profile");
        onPhaseChange?.("profile");
      }, 1400);
    } else {
      onPhaseChange?.("collecting");
    }
  };

  const reset = () => {
    setPhase("collecting");
    onPhaseChange?.("collecting");
    setConnectedSources([]);
  };

  return (
    <div ref={wrapperRef} className="relative w-full h-[320px] lg:h-[400px] flex items-center justify-center">
      <div 
        ref={containerRef}
        className="relative w-[520px] h-[400px] flex items-center justify-center origin-center"
        style={{ transform: `scale(${scale})` }}
      >
        {/* SVG Connection Lines */}
        <svg viewBox="-360 -250 720 500" className="absolute inset-0 w-full h-full pointer-events-none z-0">
          {DRAG_SOURCES.map((source, i) => {
            const isConnected = connectedSources.includes(source.id);
            if (!isConnected || phase === "profile") return null;
            
            const pathId = `path-${source.id}`;
            const d = `M ${source.cx} ${source.cy} Q ${source.cx * 0.4} ${source.cy * 0.4} 0 0`;
            
            return (
              <g key={`connection-${source.id}`}>
                <path id={pathId} d={d} stroke={source.color} strokeWidth="2" fill="none" opacity="0.3" strokeDasharray="5 5" />
                {phase === "collecting" && !shouldReduceMotion && (
                  <circle r="4" fill={source.color}>
                    <animateMotion dur={`${1.5 + (i % 3) * 0.3}s`} repeatCount="indefinite">
                      <mpath href={`#${pathId}`} />
                    </animateMotion>
                  </circle>
                )}
                {phase === "fusion" && !shouldReduceMotion && (
                  <>
                    <circle r="5" fill={source.color}>
                      <animateMotion dur="0.4s" repeatCount="indefinite">
                        <mpath href={`#${pathId}`} />
                      </animateMotion>
                    </circle>
                    <circle r="5" fill={source.color}>
                      <animateMotion dur="0.4s" begin="0.2s" repeatCount="indefinite">
                        <mpath href={`#${pathId}`} />
                      </animateMotion>
                    </circle>
                  </>
                )}
              </g>
            );
          })}
        </svg>

        {/* Central Chamber */}
        <motion.div 
          className="absolute flex flex-col items-center justify-center rounded-full bg-white z-10"
          animate={{
            scale: phase === "fusion" ? [1, 1.05, 0.95, 1.1, 1] : phase === "profile" ? 0 : 1,
            opacity: phase === "profile" ? 0 : 1,
            borderColor: connectedSources.length > 0 ? TEAL : BORDER,
            boxShadow: phase === "fusion" 
              ? `0 0 60px ${TEAL}80` 
              : "0 12px 40px rgba(23,35,60,0.08)",
          }}
          transition={{ duration: phase === "fusion" ? 1.4 : 0.4 }}
          style={{ width: 200, height: 200, borderWidth: 2 }}
        >
          {phase === "collecting" && (
            <motion.div 
              className="flex flex-col items-center text-center px-4"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            >
              <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                AcadLens Core
              </div>
              <div className="text-sm font-semibold text-slate-700">
                {connectedSources.length === 0 
                  ? "Drag sources here" 
                  : `${connectedSources.length} / ${DRAG_SOURCES.length} Connected`}
              </div>
              {connectedSources.length === 0 && (
                <div className="text-[10px] text-slate-400 mt-2 max-w-[140px] md:hidden">
                  (Or tap cards to connect)
                </div>
              )}
            </motion.div>
          )}

          {phase === "fusion" && (
            <motion.div 
              className="text-lg font-bold"
              style={{ color: TEAL }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 0.5 }}
            >
              Fusing Data...
            </motion.div>
          )}

          {/* Progress Ring */}
          {(phase === "collecting" || phase === "fusion") && (
            <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
              <circle cx="100" cy="100" r="91" fill="none" stroke={BORDER} strokeWidth="4" opacity="0.5" />
              <motion.circle 
                cx="100" cy="100" r="91" fill="none" stroke={TEAL} strokeWidth="4"
                strokeDasharray="571.8" // 2 * pi * 91
                initial={{ strokeDashoffset: 571.8 }}
                animate={{ strokeDashoffset: 571.8 - (571.8 * connectedSources.length) / DRAG_SOURCES.length }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </svg>
          )}

          {/* Connected Source Tokens on the Ring */}
          <AnimatePresence>
            {(phase === "collecting" || phase === "fusion") && connectedSources.map((id, index) => {
              const source = DRAG_SOURCES.find(s => s.id === id);
              if (!source) return null;
              // Distribute tokens evenly around the ring
              const angle = (index / DRAG_SOURCES.length) * Math.PI * 2 - Math.PI / 2;
              const cx = Math.cos(angle) * 91;
              const cy = Math.sin(angle) * 91;
              const Icon = source.icon;

              return (
                <motion.div
                  key={`token-${id}`}
                  initial={{ scale: 0, x: 0, y: 0 }}
                  animate={{ scale: 1, x: cx, y: cy }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="absolute left-[88px] top-[88px] flex items-center justify-center w-7 h-7 rounded-full bg-white shadow-md border"
                  style={{ borderColor: source.color, color: source.color, zIndex: 15 }}
                >
                  <Icon size={14} />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {/* Floating Draggable Source Cards */}
        <AnimatePresence>
          {phase === "collecting" && DRAG_SOURCES.map((source) => {
            const isConnected = connectedSources.includes(source.id);
            if (isConnected) return null;
            
            const Icon = source.icon;
            return (
              <motion.div
                key={source.id}
                drag
                dragConstraints={containerRef}
                dragElastic={0.2}
                dragMomentum={false}
                onDragEnd={(e, info) => handleDragEnd(e, info, source.id)}
                initial={{ x: source.cx, y: source.cy, opacity: 0, scale: 0.8 }}
                animate={{ x: source.cx, y: source.cy, opacity: 1, scale: 1 }}
                exit={{ x: 0, y: 0, opacity: 0, scale: 0.4, transition: { duration: 0.5, ease: "anticipate" } }}
                whileHover={{ scale: 1.05, zIndex: 30 }}
                whileDrag={{ scale: 1.1, rotate: 3, cursor: "grabbing", zIndex: 40 }}
                className="absolute z-20 flex items-center gap-3 bg-white p-3 pr-5 rounded-xl shadow-lg border cursor-grab transition-colors"
                style={{ 
                  borderColor: source.color + '40', 
                  marginLeft: '-100px', // Center approx horizontally
                  marginTop: '-30px', // Center approx vertically
                }}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleConnect(source.id);
                  }
                }}
                onClick={() => {
                  // Fallback for touch devices without drag capability
                  handleConnect(source.id);
                }}
                aria-label={`Connect ${source.label}`}
                role="button"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-lg shrink-0" style={{ backgroundColor: source.color + '1A', color: source.color }}>
                  <Icon size={20} />
                </div>
                <div className="pointer-events-none select-none">
                  <div className="text-sm font-bold whitespace-nowrap" style={{ color: NAVY }}>{source.label}</div>
                  <div className="text-[10px] font-medium whitespace-nowrap" style={{ color: SLATE }}>{source.details}</div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Profile Reveal */}
        <AnimatePresence>
          {phase === "profile" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: "spring", bounce: 0.4, duration: 0.8 }}
              className="absolute z-30 bg-white rounded-2xl shadow-2xl border p-7 w-full max-w-[360px]"
              style={{ borderColor: BORDER }}
            >
              {/* Profile Header */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-slate-50 border-2 flex items-center justify-center text-xl font-bold shrink-0" style={{ borderColor: TEAL, color: TEAL }}>
                  AS
                </div>
                <div>
                  <div className="text-xl font-extrabold" style={{ color: NAVY, letterSpacing: '-0.02em' }}>Dr. Ananya Sharma</div>
                  <div className="text-sm font-medium" style={{ color: SLATE }}>Professor · Computer Science</div>
                </div>
              </div>
              
              {/* Top Stats */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Overall Score</div>
                  <div className="text-3xl font-extrabold" style={{ color: TEAL }}>
                    <AnimatedCounter value={87.4} decimals={1} />
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Evidence</div>
                  <div className="text-3xl font-extrabold" style={{ color: NAVY }}>
                    <AnimatedCounter value={7} /> <span className="text-lg font-bold text-slate-400">Src</span>
                  </div>
                </div>
              </div>
              
              {/* Breakdown */}
              <div className="space-y-3 mb-8">
                {[
                  { label: "Research Impact", val: 91, color: TEAL },
                  { label: "Teaching Excellence", val: 86, color: BLUE },
                  { label: "Mentoring & Service", val: 84, color: GOLD }
                ].map((stat, i) => (
                  <div key={stat.label} className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs font-bold uppercase tracking-wide">
                      <span style={{ color: SLATE }}>{stat.label}</span>
                      <span style={{ color: NAVY }}>{stat.val}</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <motion.div 
                        className="h-full rounded-full" 
                        style={{ backgroundColor: stat.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${stat.val}%` }}
                        transition={{ duration: 1, delay: 0.2 + i * 0.1, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Actions */}
              <Link 
                href={ROUTES.dashboard} 
                className="flex items-center justify-center w-full py-3.5 rounded-xl text-white text-sm font-bold gap-2 shadow-sm transition-all hover:opacity-90 hover:scale-[1.02]" 
                style={{ backgroundColor: NAVY }}
              >
                Explore Complete Profile <ArrowRight size={16} />
              </Link>
              
              <button 
                onClick={reset}
                className="flex items-center justify-center w-full mt-4 py-2 text-xs font-bold gap-1.5 transition-colors opacity-60 hover:opacity-100"
                style={{ color: SLATE }}
              >
                <RefreshCw size={12} /> Reset Interactive Demo
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── HERO SECTION ─────────────────────────────────────────────────────────────
export function LandingHero() {
  const shouldReduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLElement>(null);
  const [heroPhase, setHeroPhase] = useState<"collecting" | "fusion" | "profile">("collecting");

  const isRevealed = heroPhase === "profile";

  return (
    <section
      ref={containerRef}
      className="relative min-h-[92vh] flex items-center pt-20 pb-16 overflow-hidden"
    >
      {/* Subtle grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          backgroundImage: `linear-gradient(${BORDER} 1px, transparent 1px), linear-gradient(90deg, ${BORDER} 1px, transparent 1px)`,
          backgroundSize: "52px 52px",
          opacity: 0.25,
          maskImage: "radial-gradient(ellipse 70% 70% at 60% 40%, black 10%, transparent 90%)",
        }}
      />

      {/* Ambient glows */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute"
          style={{
            width: 700, height: 600,
            background: `radial-gradient(ellipse, ${TEAL}0A 0%, transparent 70%)`,
            top: "-10%", right: "10%",
            filter: "blur(40px)",
          }}
        />
        <div
          className="absolute"
          style={{
            width: 500, height: 400,
            background: `radial-gradient(ellipse, ${BLUE}07 0%, transparent 70%)`,
            bottom: "5%", left: "5%",
            filter: "blur(50px)",
          }}
        />
      </div>

      <div className="container-page relative z-10 w-full flex flex-col lg:flex-row items-center gap-8 lg:gap-0">
        {/* LEFT: Hero headline — 45% on desktop */}
        <motion.div
          className="w-full lg:w-[45%] lg:pr-16 flex items-center"
          animate={{
            opacity: isRevealed ? 0.45 : 1,
            y: isRevealed ? -14 : 0,
          }}
          transition={{
            duration: shouldReduceMotion ? 0 : 0.55,
            ease: [0.4, 0, 0.2, 1],
          }}
        >
          <div className="w-full">

            {/* Eyebrow label */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.0, ease: "easeOut" }}
              className="flex items-center gap-2 mb-6"
            >
              <span
                className="inline-block w-6 h-px"
                style={{ backgroundColor: TEAL, opacity: 0.8 }}
              />
              <span
                className="text-xs font-bold uppercase tracking-[0.18em]"
                style={{ color: TEAL }}
              >
                Smart India Hackathon 2026 · PS64
              </span>
            </motion.div>

            {/* Headline block — left border accent + two lines */}
            <div
              className="pl-5 border-l-4"
              style={{ borderColor: TEAL }}
            >
              {/* Line 1: FRAGMENTED DATA — primary visual hook, heaviest weight */}
              <motion.div
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 30, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.7, delay: 0.1, ease: [0, 0, 0.2, 1] }}
              >
                <span
                  className="block font-black leading-[1.05]"
                  style={{
                    fontSize: "clamp(3.2rem, 5vw, 5.1rem)",
                    color: NAVY,
                    letterSpacing: "-0.035em",
                  }}
                >
                  Fragmented Data
                </span>
              </motion.div>

              {/* Line 2: to Explainable Insight — Shuffle animation in teal */}
              <motion.div
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 30, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.7, delay: 0.2, ease: [0, 0, 0.2, 1] }}
              >
                <Shuffle
                  text="to Explainable Insight"
                  tag="span"
                  className="block font-bold leading-[1.05]"
                  style={{
                    fontSize: "clamp(2.6rem, 3.9vw, 4.2rem)",
                    color: TEAL,
                    letterSpacing: "-0.03em",
                  }}
                  textAlign="left"
                  shuffleDirection="right"
                  duration={0.38}
                  animationMode="evenodd"
                  shuffleTimes={1}
                  ease="power3.out"
                  stagger={0.025}
                  threshold={0.15}
                  triggerOnce={true}
                  triggerOnHover={true}
                  respectReducedMotion={true}
                />
              </motion.div>
            </div>

            {/* Descriptor + CTA — fills the empty space below */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.38, ease: "easeOut" }}
              className="mt-8 pl-5 flex flex-col gap-5"
            >
              <p
                className="text-sm leading-relaxed max-w-xs"
                style={{ color: SLATE }}
              >
                Multi-source academic profile analytics. Deduplication, evidence scoring, and transparent AI assessment.
              </p>

              <Link
                href={ROUTES.dashboard}
                className="inline-flex items-center gap-2 self-start px-5 py-2.5 rounded-lg border text-sm font-semibold transition-all duration-200"
                style={{ color: NAVY, borderColor: BORDER, background: WHITE }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = TEAL;
                  (e.currentTarget as HTMLElement).style.color = TEAL;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = BORDER;
                  (e.currentTarget as HTMLElement).style.color = NAVY;
                }}
              >
                Explore Platform
                <ArrowRight size={14} />
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* RIGHT: Interactive drag experience — 55% on desktop */}
        <motion.div
          className="w-full lg:w-[55%]"
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.1, delay: 0.3, ease: "easeOut" }}
        >
          <DragHero onPhaseChange={setHeroPhase} />
        </motion.div>
      </div>
    </section>
  );
}


