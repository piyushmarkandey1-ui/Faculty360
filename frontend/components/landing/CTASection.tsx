"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionReveal } from "@/components/ui/SectionReveal";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { ROUTES } from "@/lib/constants/routes";

const qualityStats = [
  { value: 87, label: "Profile Completeness", suffix: "%", color: "var(--accent)" },
  { value: 94, label: "Record Verification", suffix: "%", color: "var(--success)" },
  { value: 14, label: "Duplicates Resolved", suffix: "", color: "var(--info)" },
  { value: 3, label: "Conflicts Flagged", suffix: "", color: "var(--warning)" },
  { value: 100, label: "Evidence Traceability", suffix: "%", color: "var(--success)" },
];

export function CTASection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <>
      {/* Data quality section */}
      <section
        className="py-24"
        style={{ borderTop: "1px solid var(--border-faint)" }}
        ref={ref}
      >
        <div className="container-page">
          <SectionReveal className="max-w-xl mb-16">
            <div className="text-label mb-4">Data Quality</div>
            <h2 className="text-h1" style={{ color: "var(--text-primary)" }}>
              Precision you can audit.
            </h2>
            <p className="mt-4 text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              A³P-Web distinguishes clearly between profile completeness, data quality, and assessment confidence — three separate indicators, never conflated.
            </p>
          </SectionReveal>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-px overflow-hidden rounded-xl" style={{ border: "1px solid var(--border-subtle)", background: "var(--border-subtle)" }}>
            {qualityStats.map((stat, i) => (
              <SectionReveal key={stat.label} delay={i * 0.08}>
                <div className="text-center px-6 py-8" style={{ background: "var(--bg-surface)" }}>
                  <div
                    className="text-3xl font-bold mb-2"
                    style={{ color: stat.color, fontFamily: "var(--font-mono)" }}
                  >
                    {inView ? (
                      <AnimatedCounter
                        value={stat.value}
                        format={(n) => `${Math.round(n)}${stat.suffix}`}
                      />
                    ) : (
                      `0${stat.suffix}`
                    )}
                  </div>
                  <div className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                    {stat.label}
                  </div>
                </div>
              </SectionReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section
        className="py-32 text-center"
        style={{ borderTop: "1px solid var(--border-faint)" }}
      >
        <div className="container-page max-w-2xl">
          <SectionReveal>
            <div className="text-label mb-8">A³P-Web</div>
            <h2
              className="text-display mb-8"
              style={{ color: "var(--text-primary)" }}
            >
              Academic contribution{" "}
              <span style={{ color: "var(--accent-light)" }}>deserves more</span>{" "}
              than a publication count.
            </h2>
            <p className="text-base leading-relaxed mb-10" style={{ color: "var(--text-secondary)" }}>
              From fragmented data to connected evidence to explainable insight — A³P-Web gives institutions the tools to assess faculty contribution with precision, fairness, and full auditability.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href={ROUTES.dashboard}
                className="inline-flex items-center gap-2.5 px-7 py-3 rounded-xl text-sm font-medium transition-all duration-200 group"
                style={{ background: "var(--accent)", color: "var(--text-inverse)" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--accent-light)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--accent)")}
              >
                Explore Platform
                <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
              <Link
                href={ROUTES.faculty.list}
                className="inline-flex items-center gap-2 px-7 py-3 rounded-xl text-sm border transition-all duration-200"
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
                View Faculty Directory
              </Link>
            </div>
          </SectionReveal>

          {/* Footer note */}
          <SectionReveal delay={0.2}>
            <div
              className="mt-20 pt-8 text-xs text-center"
              style={{ color: "var(--text-muted)", borderTop: "1px solid var(--border-faint)" }}
            >
              Smart India Hackathon 2026 · PS64 · A³P-Web Prototype
              <br className="mb-1" />
              Rules Calculate. AI Interprets. Humans Decide.
            </div>
          </SectionReveal>
        </div>
      </section>
    </>
  );
}
