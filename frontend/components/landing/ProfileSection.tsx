"use client";

import { SectionReveal } from "@/components/ui/SectionReveal";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { motion } from "framer-motion";

const metrics = [
  { label: "Publications", value: 87, suffix: "" },
  { label: "Citations", value: 1842, suffix: "" },
  { label: "h-index", value: 21, suffix: "" },
  { label: "Research Projects", value: 12, suffix: "" },
  { label: "Patents Filed", value: 3, suffix: "" },
  { label: "Students Mentored", value: 17, suffix: "" },
];

const parameters = [
  { label: "Research", score: 81.5 },
  { label: "Teaching", score: 88.0 },
  { label: "Mentoring", score: 72.0 },
  { label: "Innovation", score: 79.0 },
  { label: "Institutional", score: 90.0 },
  { label: "Outreach", score: 65.0 },
  { label: "Leadership", score: 84.0 },
];

const interests = [
  "Machine Learning",
  "Natural Language Processing",
  "Computer Vision",
  "Deep Learning",
  "AI Ethics",
  "Data Mining",
];

export function ProfileSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section
      id="profile"
      className="py-24"
      style={{ borderTop: "1px solid var(--border-faint)" }}
      ref={sectionRef}
    >
      <div className="container-page">
        {/* Header */}
        <SectionReveal className="max-w-xl mb-16">
          <div className="text-label mb-4">Unified Profile</div>
          <h2 className="text-h1" style={{ color: "var(--text-primary)" }}>
            Every faculty member.{" "}
            <span style={{ color: "var(--accent-light)" }}>One complete view.</span>
          </h2>
          <p className="mt-4 text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            A³P-Web resolves sources into a single unified profile — showing metrics, contributions, and evidence in one place.
          </p>
        </SectionReveal>

        {/* Profile card */}
        <SectionReveal>
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-default)",
            }}
          >
            {/* Profile header */}
            <div
              className="px-8 py-6 flex flex-wrap items-start gap-6"
              style={{ borderBottom: "1px solid var(--border-subtle)" }}
            >
              <div className="flex-1 min-w-60">
                <div className="text-label mb-2" style={{ color: "var(--text-muted)" }}>
                  DEMONSTRATION DATA
                </div>
                <h3 className="text-h2 mb-1" style={{ color: "var(--text-primary)" }}>
                  Dr. Rajesh Kumar Sharma
                </h3>
                <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>
                  Associate Professor · Information Technology · NIT Warangal
                </p>
                <div className="flex flex-wrap gap-2">
                  {interests.map((interest) => (
                    <span
                      key={interest}
                      className="text-xs px-2.5 py-1 rounded-full"
                      style={{
                        background: "var(--bg-elevated)",
                        color: "var(--text-secondary)",
                        border: "1px solid var(--border-subtle)",
                      }}
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
              {/* Source coverage */}
              <div className="flex flex-col gap-2">
                {[
                  { label: "Google Scholar", active: true, count: "82 publications" },
                  { label: "ResearchGate", active: true, count: "79 publications" },
                  { label: "Institutional", active: true, count: "87 records" },
                ].map((src) => (
                  <div
                    key={src.label}
                    className="flex items-center gap-2.5 text-xs px-3 py-2 rounded-lg"
                    style={{
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--success)" }} />
                    <span style={{ color: "var(--text-primary)" }}>{src.label}</span>
                    <span style={{ color: "var(--text-muted)" }}>·</span>
                    <span style={{ color: "var(--text-muted)" }}>{src.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Metrics grid */}
            <div className="grid grid-cols-3 sm:grid-cols-6">
              {metrics.map((m, i) => (
                <div
                  key={m.label}
                  className="px-6 py-5 text-center"
                  style={{
                    borderRight: i < metrics.length - 1 ? "1px solid var(--border-faint)" : "none",
                  }}
                >
                  <div
                    className="text-2xl font-bold mb-1"
                    style={{ color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}
                  >
                    {inView ? (
                      <AnimatedCounter value={m.value} />
                    ) : (
                      "0"
                    )}
                  </div>
                  <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                    {m.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Parameter bars */}
            <div className="px-8 py-6" style={{ borderTop: "1px solid var(--border-subtle)" }}>
              <div className="text-label mb-4">Assessment Parameters</div>
              <div className="grid sm:grid-cols-2 gap-x-12 gap-y-4">
                {parameters.map((p, i) => (
                  <div key={p.label}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span style={{ color: "var(--text-secondary)" }}>{p.label}</span>
                      <span style={{ color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>
                        {p.score}
                      </span>
                    </div>
                    <div
                      className="h-1.5 rounded-full overflow-hidden"
                      style={{ background: "var(--bg-elevated)" }}
                    >
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: "var(--accent)" }}
                        initial={{ width: 0 }}
                        animate={inView ? { width: `${p.score}%` } : { width: 0 }}
                        transition={{
                          duration: 0.8,
                          delay: 0.4 + i * 0.08,
                          ease: [0, 0, 0.2, 1],
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}
