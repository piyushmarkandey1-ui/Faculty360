"use client";

import { useState, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { SectionReveal } from "@/components/ui/SectionReveal";

const stages = [
  {
    id: "discover",
    number: "01",
    title: "DISCOVER",
    description: "Identify and connect faculty presence across public academic platforms and authorised institutional systems.",
    visual: <DiscoverVisual />,
  },
  {
    id: "connect",
    number: "02",
    title: "CONNECT",
    description: "Link records from disparate sources to a single canonical faculty entity using deterministic and probabilistic matching.",
    visual: <ConnectVisual />,
  },
  {
    id: "resolve",
    number: "03",
    title: "RESOLVE",
    description: "Detect and surface conflicts between sources. Human reviewers decide which source to trust for each contested field.",
    visual: <ResolveVisual />,
  },
  {
    id: "verify",
    number: "04",
    title: "VERIFY",
    description: "Every claim is linked to its source record and field path. Evidence is immutable and auditable.",
    visual: <VerifyVisual />,
  },
  {
    id: "assess",
    number: "05",
    title: "ASSESS",
    description: "The rule engine computes KPI scores deterministically. Every number traces back to a specific rule version and evidence record.",
    visual: <AssessVisual />,
  },
  {
    id: "explain",
    number: "06",
    title: "EXPLAIN",
    description: "Scores drill down to parameters, KPIs, metrics, evidence, and source — forming a complete, explainable chain.",
    visual: <ExplainVisual />,
  },
];

function DiscoverVisual() {
  return (
    <div className="space-y-3">
      {["Google Scholar", "ResearchGate", "Institutional Data"].map((src, i) => (
        <motion.div
          key={src}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.15, duration: 0.4 }}
          className="flex items-center gap-3 px-4 py-3 rounded-lg"
          style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
        >
          <div className="w-2 h-2 rounded-full" style={{ background: "var(--success)" }} />
          <span className="text-sm" style={{ color: "var(--text-primary)" }}>{src}</span>
          <span className="ml-auto text-xs" style={{ color: "var(--text-muted)" }}>Connected</span>
        </motion.div>
      ))}
    </div>
  );
}

function ConnectVisual() {
  return (
    <div className="space-y-2">
      {[
        { src: "Google Scholar", name: "R K Sharma", match: 97 },
        { src: "ResearchGate", name: "Rajesh K. Sharma", match: 94 },
        { src: "Institutional", name: "Dr. Rajesh Kumar Sharma", match: 100 },
      ].map((item, i) => (
        <motion.div
          key={item.src}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.15 }}
          className="flex items-center gap-3 px-4 py-3 rounded-lg"
          style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
        >
          <div>
            <div className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{item.name}</div>
            <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>{item.src}</div>
          </div>
          <div className="ml-auto">
            <span className="text-xs font-semibold" style={{ color: item.match >= 95 ? "var(--success)" : "var(--warning)" }}>
              {item.match}% match
            </span>
          </div>
        </motion.div>
      ))}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-center py-2"
      >
        <span className="text-xs font-semibold" style={{ color: "var(--accent)" }}>→ Resolved to canonical entity</span>
      </motion.div>
    </div>
  );
}

function ResolveVisual() {
  return (
    <div className="space-y-3">
      <div className="px-4 py-3 rounded-lg" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}>
        <div className="text-xs text-label mb-3">h-index conflict</div>
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-2 rounded" style={{ background: "var(--info-muted)", border: "1px solid var(--border-subtle)" }}>
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>Google Scholar</div>
            <div className="text-xl font-bold mt-1" style={{ color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>22</div>
          </div>
          <div className="text-center p-2 rounded" style={{ background: "var(--success-muted)", border: "1px solid var(--border-subtle)" }}>
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>ResearchGate</div>
            <div className="text-xl font-bold mt-1" style={{ color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>19</div>
          </div>
        </div>
        <div className="mt-3 text-center">
          <span className="text-[11px] px-3 py-1 rounded-full" style={{ background: "var(--warning-muted)", color: "var(--warning)" }}>
            Awaiting human review
          </span>
        </div>
      </div>
    </div>
  );
}

function VerifyVisual() {
  const items = [
    { label: "87 Publications", status: "verified" },
    { label: "Citation count: 1,842", status: "verified" },
    { label: "Publication year 2023 vs 2024", status: "conflict" },
    { label: "Source: google_scholar → record_id: gs-pub-1042", status: "evidence" },
  ];
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.12 }}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs"
          style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-faint)" }}
        >
          <span style={{ color: item.status === "verified" ? "var(--success)" : item.status === "conflict" ? "var(--warning)" : "var(--info)" }}>
            {item.status === "verified" ? "✓" : item.status === "conflict" ? "⚠" : "→"}
          </span>
          <span style={{ color: "var(--text-secondary)" }}>{item.label}</span>
        </motion.div>
      ))}
    </div>
  );
}

function AssessVisual() {
  const bars = [
    { label: "Research Output", score: 81.5 },
    { label: "Teaching", score: 88.0 },
    { label: "Mentoring", score: 72.0 },
    { label: "Innovation", score: 79.0 },
  ];
  return (
    <div>
      <div className="text-center mb-4">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
          className="text-5xl font-bold"
          style={{ color: "var(--accent)", fontFamily: "var(--font-mono)" }}
        >
          84.7
        </motion.div>
        <div className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>/ 100 · Rule Engine</div>
      </div>
      <div className="space-y-2">
        {bars.map((b, i) => (
          <div key={b.label}>
            <div className="flex justify-between text-xs mb-1">
              <span style={{ color: "var(--text-secondary)" }}>{b.label}</span>
              <span style={{ color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>{b.score}</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-elevated)" }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: "var(--accent)" }}
                initial={{ width: 0 }}
                animate={{ width: `${b.score}%` }}
                transition={{ duration: 0.7, delay: 0.3 + i * 0.1, ease: [0, 0, 0.2, 1] }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ExplainVisual() {
  const chain = [
    "84.7 Overall Score",
    "Research Output — 81.5",
    "rule: publication_count v1.0.0",
    "87 canonical publications",
    "google_scholar + institutional",
  ];
  return (
    <div className="space-y-1">
      {chain.map((item, i) => (
        <motion.div
          key={item}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.15 }}
          className="flex items-center gap-2"
        >
          {i > 0 && (
            <div className="ml-4 w-px h-3 self-start mt-0" style={{ background: "var(--border-default)" }} />
          )}
          <div
            className={`flex-1 px-3 py-2 rounded-lg text-xs ${i === 0 ? "font-semibold" : ""}`}
            style={{
              background: i === 0 ? "var(--accent-muted)" : "var(--bg-elevated)",
              border: `1px solid ${i === 0 ? "var(--accent)" : "var(--border-faint)"}`,
              color: i === 0 ? "var(--accent)" : "var(--text-secondary)",
              marginLeft: i > 0 ? `${(i - 1) * 12 + 16}px` : "0",
              fontFamily: i >= 2 ? "var(--font-mono)" : "inherit",
            }}
          >
            {item}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export function PipelineSection() {
  const [active, setActive] = useState(0);

  return (
    <section id="pipeline" className="py-24" style={{ borderTop: "1px solid var(--border-faint)" }}>
      <div className="container-page">
        {/* Header */}
        <SectionReveal className="max-w-xl mb-16">
          <div className="text-label mb-4">The A³P Pipeline</div>
          <h2 className="text-h1" style={{ color: "var(--text-primary)" }}>
            Six stages from raw data to explainable insight.
          </h2>
        </SectionReveal>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Stage navigation */}
          <div className="space-y-2">
            {stages.map((stage, i) => (
              <button
                key={stage.id}
                onClick={() => setActive(i)}
                className="w-full text-left px-5 py-4 rounded-xl transition-all duration-200"
                style={{
                  background: active === i ? "var(--bg-elevated)" : "var(--bg-surface)",
                  border: `1px solid ${active === i ? "var(--accent)" : "var(--border-subtle)"}`,
                }}
              >
                <div className="flex items-start gap-4">
                  <span
                    className="text-xs font-bold shrink-0 mt-0.5"
                    style={{
                      color: active === i ? "var(--accent)" : "var(--text-muted)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {stage.number}
                  </span>
                  <div>
                    <div
                      className="text-sm font-semibold tracking-wide mb-1"
                      style={{ color: active === i ? "var(--text-primary)" : "var(--text-secondary)" }}
                    >
                      {stage.title}
                    </div>
                    {active === i && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="text-xs leading-relaxed"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {stage.description}
                      </motion.p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Stage visual */}
          <div className="sticky top-24 self-start">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.3, ease: [0, 0, 0.2, 1] }}
                className="rounded-xl p-6"
                style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
              >
                <div className="text-label mb-4" style={{ color: "var(--accent)" }}>
                  {stages[active].number} · {stages[active].title}
                </div>
                {stages[active].visual}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
