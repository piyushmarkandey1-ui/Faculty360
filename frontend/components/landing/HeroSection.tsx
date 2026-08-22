"use client";

import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { useRef, useEffect, useState } from "react";
import { ArrowRight, ChevronDown, Sparkles } from "lucide-react";
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
            stroke={src.active ? "var(--accent)" : "var(--border-default)"}
            strokeWidth={src.active ? 1.5 : 1}
            strokeDasharray={src.active ? "none" : "3 3"}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={inView ? { pathLength: 1, opacity: src.active ? 0.7 : 0.4 } : {}}
            transition={{ duration: 1.2, delay: 0.3 + i * 0.15, ease: [0, 0, 0.2, 1] }}
          />
        ))}

        {/* Output lines */}
        {outputs.map((out, i) => (
          <motion.path
            key={out.id}
            d={`M ${centerX + 20} ${centerY} C ${(centerX + 20 + outputX) / 2} ${centerY}, ${(centerX + 20 + outputX) / 2} ${out.y + 10}, ${outputX} ${out.y + 10}`}
            fill="none"
            stroke="var(--accent-secondary)"
            strokeWidth={1.5}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={inView ? { pathLength: 1, opacity: 0.7 } : {}}
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
              rx={6}
              fill={src.active ? "var(--bg-surface)" : "var(--bg-elevated)"}
              stroke={src.active ? "var(--border-default)" : "var(--border-subtle)"}
              strokeWidth={1}
              className="shadow-sm"
            />
            <circle cx={sourceX + 8} cy={src.y + 11} r={3} fill={src.active ? "var(--success)" : "var(--text-muted)"} />
            <text
              x={sourceX + 17}
              y={src.y + 15}
              fill={src.active ? "var(--text-primary)" : "var(--text-muted)"}
              fontSize={9}
              fontWeight={600}
              fontFamily="var(--font-sans)"
            >
              {src.label}
            </text>
          </motion.g>
        ))}

        {/* AcadLens center node */}
        <motion.g initial={{ scale: 0, opacity: 0 }} animate={inView ? { scale: 1, opacity: 1 } : {}} transition={{ delay: 0.8, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}>
          <circle cx={centerX} cy={centerY} r={30} fill="var(--bg-surface)" stroke="var(--accent)" strokeWidth={2} className="shadow-md" />
          <circle cx={centerX} cy={centerY} r={24} fill="var(--accent-muted)" />
          <text
            x={centerX}
            y={centerY + 4}
            textAnchor="middle"
            fill="var(--accent)"
            fontSize={9.5}
            fontWeight="bold"
            fontFamily="var(--font-mono)"
          >
            AcadLens
          </text>
        </motion.g>

        {/* Output nodes */}
        {outputs.map((out, i) => (
          <motion.g key={out.id} initial={{ opacity: 0, x: 10 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ delay: 1.6 + i * 0.15 }}>
            <rect
              x={outputX}
              y={out.y}
              width={90}
              height={22}
              rx={6}
              fill="var(--bg-surface)"
              stroke="var(--accent-secondary)"
              strokeWidth={1}
              className="shadow-sm"
            />
            <text
              x={outputX + 45}
              y={out.y + 15}
              textAnchor="middle"
              fill="var(--text-primary)"
              fontSize={9}
              fontWeight={600}
              fontFamily="var(--font-sans)"
            >
              {out.label}
            </text>
          </motion.g>
        ))}
      </svg>
    </div>
  );
}

// ─── Dashboard Preview Card ─────────────────────────────────────

function PreviewCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.5, ease: [0.0, 0.0, 0.2, 1] }}
      className="p-6 rounded-2xl border shadow-md relative overflow-hidden"
      style={{ background: "var(--bg-surface)", borderColor: "var(--border-default)" }}
    >
      {/* Mini top bar */}
      <div className="flex items-center justify-between pb-4 mb-4" style={{ borderBottom: "1px solid var(--border-default)" }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs" style={{ background: "var(--accent-muted)", color: "var(--accent)" }}>
            RK
          </div>
          <div>
            <div className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Dr. Rajesh Kumar Sharma</div>
            <div className="text-xs" style={{ color: "var(--text-secondary)" }}>Associate Professor · Information Technology</div>
          </div>
        </div>
        <div className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: "var(--success-muted)", color: "var(--success)" }}>
          Score: 84.7
        </div>
      </div>

      {/* Mini grid */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: "Publications", val: "87" },
          { label: "Citations", val: "1,842" },
          { label: "h-index", val: "21" },
        ].map((item) => (
          <div key={item.label} className="p-3 rounded-lg text-center" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-faint)" }}>
            <div className="text-xs text-[var(--text-muted)] mb-0.5">{item.label}</div>
            <div className="text-sm font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>{item.val}</div>
          </div>
        ))}
      </div>

      {/* Mini progress bars */}
      <div className="space-y-2">
        {[
          { label: "Research Output", score: 85, color: "var(--param-research)" },
          { label: "Publication Quality", score: 78, color: "var(--param-teaching)" },
          { label: "Research Impact", score: 82, color: "var(--param-mentoring)" },
        ].map((bar) => (
          <div key={bar.label}>
            <div className="flex justify-between text-xs mb-1 font-medium">
              <span style={{ color: "var(--text-secondary)" }}>{bar.label}</span>
              <span style={{ color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>{bar.score}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-elevated)" }}>
              <div className="h-full rounded-full" style={{ width: `${bar.score}%`, background: bar.color }} />
            </div>
          </div>
        ))}
      </div>

      {/* Bottom tag */}
      <div className="mt-4 pt-3 flex items-center justify-between text-[11px] font-medium text-[var(--text-muted)] border-t border-[var(--border-subtle)]">
        <span>Unified Profile · 4 Data Sources</span>
        <span className="text-[var(--accent)] font-semibold flex items-center gap-1">
          <Sparkles size={11} /> Explainable Evidence
        </span>
      </div>
    </motion.div>
  );
}

// ─── Main Hero Section ──────────────────────────────────────────

const headline = [
  "FROM FRAGMENTED DATA",
  "TO CONNECTED EVIDENCE.",
  "TO EXPLAINABLE INSIGHT.",
];

export function HeroSection() {
  return (
    <section className="relative min-h-[92vh] flex items-center pt-24 pb-16 overflow-hidden" style={{ background: "var(--bg-base)" }}>
      {/* Background Grid Pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: `linear-gradient(var(--border-faint) 1px, transparent 1px), linear-gradient(90deg, var(--border-faint) 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse 70% 70% at 50% 40%, black 20%, transparent 100%)",
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
          background: "radial-gradient(ellipse, rgba(15,139,141,0.06) 0%, transparent 70%)",
          top: "20%",
          left: "10%",
          filter: "blur(50px)",
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
                    color: i === headline.length - 1 ? "var(--accent)" : "var(--text-primary)",
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
              className="text-base mb-8 max-w-md leading-relaxed font-normal"
              style={{ color: "var(--text-secondary)" }}
            >
              AcadLens resolves fragmented faculty information from Google Scholar, ResearchGate, and institutional systems into a single, evidence-backed, assessable profile.
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
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200 shadow-sm group"
                style={{ background: "var(--text-primary)", color: "var(--text-inverse)" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--accent)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--text-primary)")}
              >
                Explore Platform
                <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium border transition-all duration-200"
                style={{ color: "var(--text-primary)", borderColor: "var(--border-default)", background: "var(--bg-surface)" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)";
                  (e.currentTarget as HTMLElement).style.color = "var(--accent)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--border-default)";
                  (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
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
              className="mt-10 pt-6 flex gap-6 border-t border-[var(--border-default)]"
            >
              {[
                { label: "Rules Calculate.", color: "var(--success)" },
                { label: "AI Interprets.", color: "var(--info)" },
                { label: "Humans Decide.", color: "var(--accent)" },
              ].map((item) => (
                <div key={item.label} className="text-xs font-bold" style={{ color: item.color }}>
                  {item.label}
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right — Data flow visualization + preview card */}
          <div className="space-y-6">
            <DataFlowDiagram />
            <PreviewCard />
          </div>
        </div>
      </div>
    </section>
  );
}
