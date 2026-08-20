"use client";

import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { useRef } from "react";
import { ArrowRight, ShieldCheck, Database, Award, CheckCircle2 } from "lucide-react";
import { SectionReveal } from "@/components/ui/SectionReveal";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { ROUTES } from "@/lib/constants/routes";

const qualityStats = [
  { value: 87, label: "Profile Completeness", suffix: "%", color: "var(--accent)" },
  { value: 91, label: "Verification Confidence", suffix: "%", color: "var(--info)" },
  { value: 14, label: "Duplicates Merged", suffix: "", color: "var(--highlight)" },
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
        style={{ background: "#FFFFFF", borderTop: "1px solid var(--border-default)" }}
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

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {qualityStats.map((stat, i) => (
              <SectionReveal key={stat.label} delay={i * 0.08}>
                <div
                  className="text-center p-6 rounded-2xl border transition-all duration-200 hover:shadow-sm"
                  style={{ background: "var(--bg-base)", borderColor: "var(--border-default)" }}
                >
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
                  <div className="text-xs font-medium leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    {stat.label}
                  </div>
                </div>
              </SectionReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA — Deep Navy Contrast Section */}
      <section
        className="py-28 text-center relative overflow-hidden"
        style={{ background: "#17233C", color: "#FFFFFF" }}
      >
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-10"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
          aria-hidden="true"
        />

        <div className="container-page max-w-3xl relative z-10">
          <SectionReveal>
            <div className="text-xs font-bold uppercase tracking-wider mb-6 text-[var(--accent)]">
              A³P-Web · Smart India Hackathon 2026
            </div>
            <h2
              className="text-display mb-6"
              style={{ color: "#FFFFFF", lineHeight: 1.15 }}
            >
              Academic contribution <span style={{ color: "#38BDF8" }}>deserves more</span> than a publication count.
            </h2>
            <p className="text-base leading-relaxed mb-10 text-slate-300 max-w-2xl mx-auto">
              From fragmented data to connected evidence to explainable insight — A³P-Web gives institutions the tools to assess faculty contribution with precision, fairness, and full auditability.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href={ROUTES.dashboard}
                className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 shadow-lg group"
                style={{ background: "#0F8B8D", color: "#FFFFFF" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#12A2A4")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "#0F8B8D")}
              >
                Explore Platform
                <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
              <Link
                href={ROUTES.faculty.list}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-medium border transition-all duration-200"
                style={{ color: "#FFFFFF", borderColor: "rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.05)" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.12)";
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.4)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)";
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.2)";
                }}
              >
                View Faculty Directory
              </Link>
            </div>
          </SectionReveal>

          {/* Footer note */}
          <SectionReveal delay={0.2}>
            <div
              className="mt-16 pt-8 text-xs text-center text-slate-400 border-t"
              style={{ borderColor: "rgba(255,255,255,0.1)" }}
            >
              A³P-Web Prototype · Rules Calculate. AI Interprets. Humans Decide.
            </div>
          </SectionReveal>
        </div>
      </section>
    </>
  );
}
