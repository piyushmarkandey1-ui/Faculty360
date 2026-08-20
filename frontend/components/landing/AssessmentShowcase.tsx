"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useInView, useReducedMotion, animate } from "framer-motion";
import { SectionReveal } from "@/components/ui/SectionReveal";
import { Info, CheckCircle2 } from "lucide-react";

const TEAL = "#0F8B8D";
const NAVY = "#17233C";
const BLUE = "#4F6BED";
const GOLD = "#D6A84F";
const WHITE = "#FFFFFF";
const BORDER = "#E4E8EF";
const SLATE = "#5D6B82";
const EMERALD = "#2E9B72";
const VIOLET = "#7C3AED";

const SCORE_RADIUS = 78;
const CIRCUMFERENCE = 2 * Math.PI * SCORE_RADIUS; // ≈ 490

const PARAMS = [
  { label: "Research",    val: 81.5, color: TEAL },
  { label: "Teaching",    val: 88.0, color: BLUE },
  { label: "Mentoring",   val: 72.0, color: VIOLET },
  { label: "Innovation",  val: 79.0, color: GOLD },
];

const EVIDENCE_CHAIN = [
  { title: "Overall Score",         val: "84.7 / 100",                   color: TEAL },
  { title: "Research Parameter",    val: "81.5 (40% weight)",            color: BLUE },
  { title: "Publication Output KPI",val: "24.0 / 30",                    color: NAVY },
  { title: "Canonical Publications",val: "87 (deduped from 102)",        color: EMERALD },
  { title: "Source Evidence",       val: "Google Scholar + Institutional", color: TEAL },
];

// ─── ANIMATED SCORE RING ─────────────────────────────────────────────────────
function ScoreRing({ inView }: { inView: boolean }) {
  const shouldReduceMotion = useReducedMotion();
  const scoreRef = useRef<HTMLSpanElement>(null);
  const ringRef = useRef<SVGCircleElement>(null);

  const targetScore = 84.7;
  const targetOffset = CIRCUMFERENCE * (1 - targetScore / 100);

  useEffect(() => {
    if (!inView) return;

    // Animate the number counter
    if (scoreRef.current) {
      const ctrl = animate(0, targetScore, {
        duration: shouldReduceMotion ? 0.01 : 1.6,
        ease: [0, 0, 0.2, 1],
        onUpdate: (v) => {
          if (scoreRef.current) scoreRef.current.textContent = v.toFixed(1);
        },
      });
      return () => ctrl.stop();
    }
  }, [inView, shouldReduceMotion, targetScore]);

  useEffect(() => {
    if (!inView || !ringRef.current) return;
    // Animate the ring stroke
    const ring = ringRef.current;
    ring.style.transition = shouldReduceMotion
      ? "none"
      : "stroke-dashoffset 1.6s cubic-bezier(0,0,0.2,1) 0.2s";
    ring.style.strokeDashoffset = `${targetOffset}`;
  }, [inView, shouldReduceMotion, targetOffset]);

  const confidenceBar = inView ? "91%" : "0%";
  const completenessBar = inView ? "87%" : "0%";

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Circular score indicator */}
      <div className="relative" style={{ width: 200, height: 200 }}>
        <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
          {/* Track */}
          <circle
            cx="100" cy="100" r={SCORE_RADIUS}
            fill="none"
            stroke={BORDER}
            strokeWidth="8"
          />
          {/* Progress ring */}
          <circle
            ref={ringRef}
            cx="100" cy="100" r={SCORE_RADIUS}
            fill="none"
            stroke={TEAL}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE}
          />
        </svg>
        {/* Score in center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            ref={scoreRef}
            className="font-extrabold font-mono leading-none"
            style={{ fontSize: "2.4rem", color: NAVY }}
          >
            0.0
          </span>
          <span className="text-xs font-semibold mt-1" style={{ color: SLATE }}>
            / 100
          </span>
        </div>
      </div>

      {/* Confidence + Completeness */}
      <div className="w-full space-y-3">
        {[
          { label: "Assessment Confidence", val: 91, barWidth: confidenceBar, color: TEAL },
          { label: "Profile Completeness", val: 87, barWidth: completenessBar, color: BLUE },
        ].map((item) => (
          <div key={item.label} className="space-y-1">
            <div className="flex justify-between text-xs font-bold">
              <span style={{ color: SLATE }}>{item.label}</span>
              <span className="font-mono" style={{ color: item.color }}>{item.val}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: BORDER }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: item.barWidth,
                  background: item.color,
                  transition: shouldReduceMotion ? "none" : "width 1.4s cubic-bezier(0,0,0.2,1) 0.4s",
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Label */}
      <div className="text-[10px] font-bold uppercase tracking-widest text-center px-4 py-2 rounded-lg" style={{ background: TEAL + "10", color: TEAL }}>
        Deterministic Assessment
      </div>
    </div>
  );
}

// ─── EVIDENCE CHAIN ───────────────────────────────────────────────────────────
function EvidenceChain({ inView }: { inView: boolean }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="p-8 rounded-2xl border bg-white shadow-md h-full" style={{ borderColor: BORDER }}>
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-lg font-bold" style={{ color: NAVY }}>Evidence Hierarchy</h3>
        <div
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
          style={{ background: BLUE + "12", color: BLUE }}
        >
          <Info size={13} /> Why this score?
        </div>
      </div>

      {/* Vertical connecting line */}
      <div
        className="space-y-0 relative"
        style={{
          "--line-bg": BORDER,
        } as React.CSSProperties}
      >
        {/* Static line */}
        <div
          className="absolute left-[11px] top-4 w-px"
          style={{
            background: `linear-gradient(${TEAL}40, ${BORDER})`,
            height: inView ? "calc(100% - 2rem)" : "0%",
            transition: shouldReduceMotion ? "none" : "height 1.2s cubic-bezier(0,0,0.2,1) 0.3s",
          }}
        />

        {EVIDENCE_CHAIN.map((node, i) => (
          <motion.div
            key={i}
            className="flex gap-5 relative z-10 pb-5 last:pb-0"
            initial={{ opacity: 0, x: -12 }}
            animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -12 }}
            transition={{
              duration: shouldReduceMotion ? 0.2 : 0.45,
              delay: shouldReduceMotion ? 0 : 0.35 + i * 0.1,
              ease: [0, 0, 0.2, 1],
            }}
          >
            <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 bg-white border-2 mt-0.5" style={{ borderColor: node.color }}>
              <div className="w-2 h-2 rounded-full" style={{ background: node.color }} />
            </div>
            <div className="flex-1 pb-3 border-b last:border-0" style={{ borderColor: BORDER }}>
              <div className="flex justify-between items-start mb-0.5">
                <div className="font-bold text-sm" style={{ color: NAVY }}>{node.title}</div>
              </div>
              <div className="text-xs font-mono font-semibold" style={{ color: node.color }}>{node.val}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── PARAMETER BARS ───────────────────────────────────────────────────────────
function ParameterBars({ inView }: { inView: boolean }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="space-y-4 mt-6">
      {PARAMS.map((p, i) => (
        <div key={p.label} className="space-y-1.5">
          <div className="flex justify-between text-xs font-bold">
            <span style={{ color: NAVY }}>{p.label}</span>
            <span className="font-mono" style={{ color: p.color }}>{p.val}</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: BORDER }}>
            <div
              className="h-full rounded-full"
              style={{
                width: inView ? `${p.val}%` : "0%",
                background: p.color,
                transition: shouldReduceMotion ? "none" : `width 1s cubic-bezier(0,0,0.2,1) ${0.5 + i * 0.1}s`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export function AssessmentShowcase() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: "-80px" });

  return (
    <section
      id="assessment-section"
      className="py-24 border-t"
      style={{ background: "#F8FAFA", borderColor: BORDER }}
    >
      <div className="container-page max-w-5xl">
        <SectionReveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4" style={{ color: NAVY }}>
              ASSESSMENT{" "}
              <span style={{ color: TEAL }}>WITHOUT THE BLACK BOX.</span>
            </h2>
            <p className="text-base max-w-2xl mx-auto" style={{ color: SLATE }}>
              Rules calculate scores deterministically. AI provides advisory interpretation. Humans make the final decision.
            </p>
          </div>
        </SectionReveal>

        <div ref={sectionRef}>
          <div className="grid md:grid-cols-[1fr_1.6fr] gap-8 items-start">
            {/* Left: Score Ring + Parameter Bars */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
              transition={{ duration: 0.55, ease: [0, 0, 0.2, 1] }}
              className="p-8 rounded-2xl border bg-white shadow-lg"
              style={{ borderColor: BORDER }}
            >
              <ScoreRing inView={inView} />
              <ParameterBars inView={inView} />
            </motion.div>

            {/* Right: Evidence Chain */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
              transition={{ duration: 0.55, delay: 0.15, ease: [0, 0, 0.2, 1] }}
            >
              <EvidenceChain inView={inView} />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
