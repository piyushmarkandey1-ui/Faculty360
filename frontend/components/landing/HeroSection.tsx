"use client";

import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { useRef, useEffect, useState } from "react";
import { ArrowRight, ChevronDown } from "lucide-react";
import { ROUTES } from "@/lib/constants/routes";

// ─── Data Flow SVG ──────────────────────────────────────────────

const sources = [
  { id: "scholar", label: "Google Scholar", y: 60, active: true },
  { id: "rg", label: "ResearchGate", y: 130, active: true },
  { id: "inst", label: "Institutional", y: 200, active: true },
  { id: "orcid", label: "ORCID", y: 270, active: false },
  { id: "patents", label: "Patents", y: 340, active: false },
];

const outputs = [
  { id: "unified", label: "Unified Profile", y: 110 },
  { id: "assessment", label: "Assessment", y: 180 },
  { id: "insights", label: "Insights", y: 250 },
];

function DataFlowDiagram() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });

  const centerX = 220;
  const centerY = 200;
  const sourceX = 40;
  const outputX = 360;

  return (
    <div ref={ref} className="relative w-full" style={{ height: 400 }}>
      <svg
        viewBox="0 0 480 400"
        className="w-full h-full"
        aria-hidden="true"
      >
        {/* Source connection lines */}
        {sources.map((src, i) => (
          <motion.path
            key={src.id}
            d={`M ${sourceX + 90} ${src.y + 10} C ${(sourceX + 90 + centerX - 20) / 2} ${src.y + 10}, ${(sourceX + 90 + centerX - 20) / 2} ${centerY}, ${centerX - 20} ${centerY}`}
            fill="none"
            stroke={src.active ? "var(--accent)" : "var(--border-subtle)"}
            strokeWidth={src.active ? 1.5 : 1}
            strokeDasharray="1"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={inView ? { pathLength: 1, opacity: src.active ? 0.6 : 0.25 } : {}}
            transition={{ duration: 1.2, delay: 0.3 + i * 0.15, ease: [0, 0, 0.2, 1] }}
          />
        ))}

        {/* Output lines */}
        {outputs.map((out, i) => (
          <motion.path
            key={out.id}
            d={`M ${centerX + 20} ${centerY} C ${(centerX + 20 + outputX) / 2} ${centerY}, ${(centerX + 20 + outputX) / 2} ${out.y + 10}, ${outputX} ${out.y + 10}`}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={1.5}
            strokeDasharray="1"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={inView ? { pathLength: 1, opacity: 0.5 } : {}}
            transition={{ duration: 1.0, delay: 1.4 + i * 0.2, ease: [0, 0, 0.2, 1] }}
          />
        ))}

        {/* Source nodes */}
        {sources.map((src, i) => (
          <motion.g key={src.id} initial={{ opacity: 0, x: -10 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ delay: 0.1 + i * 0.1 }}>
            <rect
              x={sourceX}
              y={src.y}
              width={90}
              height={22}
              rx={4}
              fill={src.active ? "var(--bg-elevated)" : "var(--bg-surface)"}
              stroke={src.active ? "var(--border-default)" : "var(--border-faint)"}
              strokeWidth={1}
            />
            <circle cx={sourceX + 8} cy={src.y + 11} r={3} fill={src.active ? "var(--success)" : "var(--border-subtle)"} />
            <text
              x={sourceX + 17}
              y={src.y + 15}
              fill={src.active ? "var(--text-primary)" : "var(--text-muted)"}
              fontSize={9}
              fontFamily="var(--font-sans)"
            >
              {src.label}
            </text>
          </motion.g>
        ))}

        {/* A³P center node */}
        <motion.g initial={{ scale: 0, opacity: 0 }} animate={inView ? { scale: 1, opacity: 1 } : {}} transition={{ delay: 0.8, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}>
          <circle cx={centerX} cy={centerY} r={28} fill="var(--bg-elevated)" stroke="var(--accent)" strokeWidth={1.5} />
          <circle cx={centerX} cy={centerY} r={22} fill="var(--accent-muted)" />
          <text x={centerX} y={centerY - 4} fill="var(--accent)" fontSize={11} fontWeight="700" textAnchor="middle" fontFamily="var(--font-mono)">A³P</text>
          <text x={centerX} y={centerY + 10} fill="var(--text-secondary)" fontSize={7} textAnchor="middle" fontFamily="var(--font-sans)">Web</text>
        </motion.g>

        {/* Pulse ring on A³P */}
        <motion.circle
          cx={centerX} cy={centerY} r={28}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={1}
          initial={{ scale: 1, opacity: 0.4 }}
          animate={inView ? { scale: [1, 1.5, 1], opacity: [0.4, 0, 0.4] } : {}}
          transition={{ repeat: Infinity, duration: 3, delay: 1.5, ease: "easeInOut" }}
        />

        {/* Output nodes */}
        {outputs.map((out, i) => (
          <motion.g key={out.id} initial={{ opacity: 0, x: 10 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ delay: 1.6 + i * 0.2 }}>
            <rect x={outputX} y={out.y} width={88} height={22} rx={4} fill="var(--bg-elevated)" stroke="var(--border-subtle)" strokeWidth={1} />
            <text x={outputX + 10} y={out.y + 15} fill="var(--text-primary)" fontSize={9} fontFamily="var(--font-sans)">{out.label}</text>
          </motion.g>
        ))}
      </svg>
    </div>
  );
}

// ─── Dashboard Preview Card ──────────────────────────────────────

const params = [
  { label: "Research", value: 81.5, max: 100 },
  { label: "Teaching", value: 88.0, max: 100 },
  { label: "Mentoring", value: 72.0, max: 100 },
  { label: "Innovation", value: 79.0, max: 100 },
];

function DashboardPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.6, ease: [0, 0, 0.2, 1] }}
      className="rounded-xl overflow-hidden"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-default)",
        boxShadow: "0 32px 64px rgba(0,0,0,0.5)",
      }}
    >
      {/* Card header */}
      <div className="px-5 py-4 flex items-center gap-3" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--danger)" }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--warning)" }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--success)" }} />
        </div>
        <span className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
          A³P-Web / Faculty Profile
        </span>
      </div>

      {/* Profile */}
      <div className="px-5 pt-4 pb-3 flex items-start justify-between">
        <div>
          <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Dr. Rajesh Kumar Sharma
          </div>
          <div className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
            Associate Professor · Information Technology
          </div>
          <div className="flex gap-1.5 mt-2">
            {["GS", "RG", "Inst"].map((s, i) => (
              <span key={i} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "var(--accent-muted)", color: "var(--accent)", border: "1px solid var(--border-subtle)" }}>
                {s}
              </span>
            ))}
          </div>
        </div>
        {/* Score ring */}
        <div className="flex flex-col items-center">
          <div className="relative w-14 h-14">
            <svg viewBox="0 0 56 56" className="w-full h-full -rotate-90">
              <circle cx="28" cy="28" r="22" fill="none" stroke="var(--bg-elevated)" strokeWidth="5" />
              <motion.circle
                cx="28" cy="28" r="22" fill="none"
                stroke="var(--accent)" strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 22}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 22 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 22 * (1 - 0.847) }}
                transition={{ duration: 1.2, delay: 1.0, ease: [0, 0, 0.2, 1] }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xs font-bold" style={{ color: "var(--accent)", fontFamily: "var(--font-mono)" }}>84.7</span>
            </div>
          </div>
          <div className="text-[9px] mt-0.5" style={{ color: "var(--text-muted)" }}>Score</div>
        </div>
      </div>

      {/* Parameters */}
      <div className="px-5 pb-4 space-y-2">
        {params.map((p, i) => (
          <div key={p.label}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px]" style={{ color: "var(--text-secondary)" }}>{p.label}</span>
              <span className="text-[10px] font-medium" style={{ color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>{p.value}</span>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--bg-elevated)" }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: "var(--accent)" }}
                initial={{ width: 0 }}
                animate={{ width: `${p.value}%` }}
                transition={{ duration: 0.8, delay: 1.1 + i * 0.1, ease: [0, 0, 0.2, 1] }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 flex items-center justify-between" style={{ borderTop: "1px solid var(--border-faint)", background: "var(--bg-elevated)" }}>
        <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>Confidence: <span style={{ color: "var(--success)" }}>91%</span></span>
        <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>Completeness: <span style={{ color: "var(--accent)" }}>87%</span></span>
        <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: "var(--success-muted)", color: "var(--success)" }}>Active</span>
      </div>
    </motion.div>
  );
}

// ─── Hero Section ────────────────────────────────────────────────

const headline = ["FROM FRAGMENTED DATA", "TO CONNECTED EVIDENCE.", "TO EXPLAINABLE INSIGHT."];

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden pt-14">
      {/* Subtle grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(var(--border-faint) 1px, transparent 1px), linear-gradient(90deg, var(--border-faint) 1px, transparent 1px)`,
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 40%, black 40%, transparent 100%)",
        }}
        aria-hidden="true"
      />

      {/* Ambient glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: 600,
          height: 400,
          borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(192,122,79,0.06) 0%, transparent 70%)",
          top: "20%",
          left: "10%",
          filter: "blur(40px)",
        }}
        aria-hidden="true"
      />

      <div className="container-page relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left — Headline + CTAs */}
          <div>
            {/* Label */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-label mb-6"
            >
              Smart India Hackathon 2026 · PS64
            </motion.div>

            {/* Headline */}
            <div className="space-y-1 mb-6">
              {headline.map((line, i) => (
                <motion.h1
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.65, delay: 0.2 + i * 0.18, ease: [0, 0, 0.2, 1] }}
                  className="text-display block"
                  style={{
                    color: i === headline.length - 1 ? "var(--accent-light)" : "var(--text-primary)",
                    lineHeight: 1.1,
                  }}
                >
                  {line}
                </motion.h1>
              ))}
            </div>

            {/* Subheading */}
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.75 }}
              className="text-base mb-8 max-w-md leading-relaxed"
              style={{ color: "var(--text-secondary)" }}
            >
              A³P-Web resolves fragmented faculty information from Google Scholar, ResearchGate, and institutional systems into a single, evidence-backed, assessable profile.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.9 }}
              className="flex flex-wrap items-center gap-4"
            >
              <Link
                href={ROUTES.dashboard}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group"
                style={{ background: "var(--accent)", color: "var(--text-inverse)" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--accent-light)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--accent)")}
              >
                Explore Platform
                <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm border transition-all duration-200"
                style={{ color: "var(--text-secondary)", borderColor: "var(--border-default)" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--border-strong)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--border-default)";
                }}
              >
                See How It Works
              </a>
            </motion.div>

            {/* Core principle */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.1 }}
              className="mt-10 pt-6 flex gap-6"
              style={{ borderTop: "1px solid var(--border-faint)" }}
            >
              {["Rules Calculate.", "AI Interprets.", "Humans Decide."].map((phrase, i) => (
                <div key={i}>
                  <div className="text-[11px] font-semibold" style={{ color: i === 0 ? "var(--accent)" : i === 1 ? "var(--info)" : "var(--success)" }}>
                    {phrase}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right — Visuals */}
          <div className="relative hidden lg:block">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="grid grid-cols-2 gap-6 items-start"
            >
              {/* Data flow diagram */}
              <div className="col-span-1">
                <DataFlowDiagram />
              </div>
              {/* Dashboard preview */}
              <div className="col-span-1 mt-8">
                <DashboardPreview />
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5"
        aria-hidden="true"
      >
        <span className="text-[10px] text-label">Scroll</span>
        <motion.div
          animate={{ y: [0, 5, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        >
          <ChevronDown size={14} style={{ color: "var(--text-muted)" }} />
        </motion.div>
      </motion.div>
    </section>
  );
}
