"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useRef, useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
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

function ConvergingNetworkBackground() {
  const shouldReduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden" aria-hidden="true">
      <svg viewBox="0 0 1000 600" className="w-full h-full object-cover">
        <defs>
          <linearGradient id="cta-line-fade" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0F8B8D" stopOpacity="0" />
            <stop offset="50%" stopColor="#0F8B8D" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#0F8B8D" stopOpacity="1" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Converging lines */}
        {[
          "M 100 100 Q 300 200 500 300",
          "M 900 100 Q 700 200 500 300",
          "M 100 500 Q 300 400 500 300",
          "M 900 500 Q 700 400 500 300",
          "M 500 50 Q 500 150 500 300",
          "M 500 550 Q 500 450 500 300",
        ].map((pathD, i) => (
          <motion.path
            key={i}
            d={pathD}
            stroke="url(#cta-line-fade)"
            strokeWidth="1"
            fill="none"
            initial={shouldReduceMotion ? { pathLength: 1 } : { pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 2, delay: i * 0.2, ease: "easeOut" }}
          />
        ))}

        {/* Central unified node */}
        <motion.circle
          cx="500" cy="300" r="4" fill="#0F8B8D"
          initial={shouldReduceMotion ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, delay: 1.5 }}
        />
        
        {/* Subtle continuous pulse */}
        {!shouldReduceMotion && (
          <circle cx="500" cy="300" r="16" fill="none" stroke="#0F8B8D" strokeWidth="1" opacity="0.3">
            <animate attributeName="r" values="8;24;8" dur="4s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.5;0;0.5" dur="4s" repeatCount="indefinite" />
          </circle>
        )}
      </svg>
    </div>
  );
}

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
            <div className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: "var(--accent)" }}>
              Data Quality
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4" style={{ color: "var(--text-primary)" }}>
              Precision you can audit.
            </h2>
            <p className="mt-4 text-base leading-relaxed max-w-lg" style={{ color: "var(--text-secondary)" }}>
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
                    className="text-3xl font-extrabold mb-2 font-mono"
                    style={{ color: stat.color }}
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
                  <div className="text-[11px] font-bold uppercase tracking-wider leading-relaxed" style={{ color: "var(--text-secondary)" }}>
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
        className="py-32 text-center relative overflow-hidden"
        style={{ background: "#17233C", color: "#FFFFFF" }}
      >
        <ConvergingNetworkBackground />

        <div className="container-page max-w-3xl relative z-10">
          <SectionReveal>
            <div className="text-[10px] font-bold uppercase tracking-widest mb-6" style={{ color: "#0F8B8D" }}>
              A³P-Web · Smart India Hackathon 2026
            </div>
            
            <div className="space-y-1 mb-8">
              <h2 className="text-4xl md:text-5xl font-extrabold" style={{ color: "#FFFFFF", letterSpacing: "-0.02em" }}>
                ACADEMIC CONTRIBUTION
              </h2>
              <h2 className="text-4xl md:text-5xl font-extrabold" style={{ color: "#FFFFFF", letterSpacing: "-0.02em" }}>
                DESERVES MORE THAN
              </h2>
              <h2 className="text-4xl md:text-5xl font-extrabold" style={{ color: "#0F8B8D", letterSpacing: "-0.02em" }}>
                A PUBLICATION COUNT.
              </h2>
            </div>
            
            <p className="text-lg leading-relaxed mb-12 text-slate-300 max-w-2xl mx-auto">
              From fragmented data to connected evidence to explainable insight — A³P-Web gives institutions the tools to assess faculty contribution with precision, fairness, and full auditability.
            </p>
            
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href={ROUTES.dashboard}
                className="inline-flex items-center gap-2.5 px-8 py-4 rounded-xl text-sm font-semibold shadow-[0_0_20px_rgba(15,139,141,0.2)] group relative overflow-hidden transition-all duration-300"
                style={{ background: "#0F8B8D", color: "#FFFFFF" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "#12A2A4";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 0 30px rgba(15,139,141,0.4)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "#0F8B8D";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 0 20px rgba(15,139,141,0.2)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(0px)";
                }}
              >
                Explore Platform
                <span className="transition-transform duration-300 group-hover:translate-x-1.5">
                  <ArrowRight size={16} />
                </span>
              </Link>
              <Link
                href={ROUTES.faculty.list}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-sm font-medium border transition-all duration-300 hover:-translate-y-0.5"
                style={{ color: "#FFFFFF", borderColor: "rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.05)" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.1)";
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.3)";
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
          <SectionReveal delay={0.4}>
            <div
              className="mt-20 pt-8 text-xs font-medium text-slate-400 border-t flex justify-between items-center"
              style={{ borderColor: "rgba(255,255,255,0.1)" }}
            >
              <span>A³P-Web Prototype</span>
              <span>Rules Calculate. AI Interprets. Humans Decide.</span>
            </div>
          </SectionReveal>
        </div>
      </section>
    </>
  );
}
