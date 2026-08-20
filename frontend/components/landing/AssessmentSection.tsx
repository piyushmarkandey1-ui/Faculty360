"use client";

import { SectionReveal } from "@/components/ui/SectionReveal";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { motion } from "framer-motion";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";

const radarData = [
  { subject: "Research", value: 81.5, fullMark: 100 },
  { subject: "Teaching", value: 88.0, fullMark: 100 },
  { subject: "Mentoring", value: 72.0, fullMark: 100 },
  { subject: "Innovation", value: 79.0, fullMark: 100 },
  { subject: "Institutional", value: 90.0, fullMark: 100 },
  { subject: "Outreach", value: 65.0, fullMark: 100 },
  { subject: "Leadership", value: 84.0, fullMark: 100 },
];

const quality = [
  { label: "Profile Completeness", value: 87, color: "var(--accent)" },
  { label: "Source Coverage", value: 100, color: "var(--success)" },
  { label: "Verification Rate", value: 94, color: "var(--info)" },
  { label: "Conflict Resolution", value: 78, color: "var(--warning)" },
];

export function AssessmentSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      id="assessment"
      className="py-24"
      style={{ borderTop: "1px solid var(--border-faint)" }}
      ref={ref}
    >
      <div className="container-page">
        {/* Header */}
        <SectionReveal className="max-w-xl mb-16">
          <div className="text-label mb-4">Assessment</div>
          <h2 className="text-h1" style={{ color: "var(--text-primary)" }}>
            One profile.{" "}
            <span style={{ color: "var(--accent-light)" }}>Multiple dimensions.</span>
            <br />
            One explainable view.
          </h2>
        </SectionReveal>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left: Radar chart + score */}
          <SectionReveal>
            <div
              className="rounded-xl p-6"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
              }}
            >
              {/* Score header */}
              <div
                className="flex items-center justify-between pb-5 mb-4"
                style={{ borderBottom: "1px solid var(--border-subtle)" }}
              >
                <div>
                  <div className="text-label mb-1">Overall Assessment Score</div>
                  <div
                    className="text-5xl font-bold"
                    style={{ color: "var(--accent)", fontFamily: "var(--font-mono)" }}
                  >
                    {inView ? <AnimatedCounter value={84.7} format={(n) => n.toFixed(1)} /> : "0.0"}
                  </div>
                  <div className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                    / 100 · Computed by rule engine
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="text-xs px-2.5 py-1 rounded-full" style={{ background: "var(--success-muted)", color: "var(--success)" }}>
                    Confidence 91%
                  </div>
                  <div className="text-xs px-2.5 py-1 rounded-full" style={{ background: "var(--accent-muted)", color: "var(--accent)" }}>
                    Completeness 87%
                  </div>
                </div>
              </div>

              {/* Radar Chart */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={inView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.7, delay: 0.3 }}
                style={{ height: 280 }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                    <PolarGrid stroke="var(--border-subtle)" />
                    <PolarAngleAxis
                      dataKey="subject"
                      tick={{ fill: "var(--text-secondary)", fontSize: 11, fontFamily: "var(--font-sans)" }}
                    />
                    <Radar
                      name="Score"
                      dataKey="value"
                      stroke="var(--accent)"
                      fill="var(--accent)"
                      fillOpacity={0.15}
                      strokeWidth={1.5}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </motion.div>
            </div>
          </SectionReveal>

          {/* Right: Parameter breakdown */}
          <div className="space-y-6">
            {/* Parameter bars */}
            <SectionReveal>
              <div
                className="rounded-xl p-6"
                style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
              >
                <div className="text-label mb-4">Parameter Breakdown</div>
                <div className="space-y-4">
                  {radarData.map((p, i) => (
                    <div key={p.subject}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span style={{ color: "var(--text-secondary)" }}>{p.subject}</span>
                        <span style={{ color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>
                          {p.value}
                        </span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-elevated)" }}>
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: p.value >= 85 ? "var(--success)" : p.value >= 75 ? "var(--accent)" : "var(--warning)" }}
                          initial={{ width: 0 }}
                          animate={inView ? { width: `${p.value}%` } : { width: 0 }}
                          transition={{ duration: 0.8, delay: 0.5 + i * 0.08, ease: [0, 0, 0.2, 1] }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </SectionReveal>

            {/* Quality metrics */}
            <SectionReveal delay={0.15}>
              <div
                className="rounded-xl p-6"
                style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
              >
                <div className="text-label mb-4">Data Quality</div>
                <div className="grid grid-cols-2 gap-4">
                  {quality.map((q) => (
                    <div key={q.label} className="text-center">
                      <div className="text-2xl font-bold mb-1" style={{ color: q.color, fontFamily: "var(--font-mono)" }}>
                        {inView ? <AnimatedCounter value={q.value} format={(n) => `${Math.round(n)}%`} /> : "0%"}
                      </div>
                      <div className="text-xs" style={{ color: "var(--text-muted)" }}>{q.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </SectionReveal>
          </div>
        </div>
      </div>
    </section>
  );
}
