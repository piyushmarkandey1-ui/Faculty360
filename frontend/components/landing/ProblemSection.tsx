"use client";

import { motion } from "framer-motion";
import { Database, AlertTriangle, BarChart3 } from "lucide-react";
import { SectionReveal } from "@/components/ui/SectionReveal";

const problems = [
  {
    icon: Database,
    title: "Fragmented",
    label: "Data is scattered",
    description:
      "Faculty information lives across Google Scholar, ResearchGate, institutional ERPs, and self-reported forms. No single system has the full picture.",
    items: ["Google Scholar", "ResearchGate", "Institutional Systems", "Spreadsheets"],
    color: "var(--info)",
    colorMuted: "var(--info-muted)",
  },
  {
    icon: AlertTriangle,
    title: "Inconsistent",
    label: "Sources disagree",
    description:
      "The same faculty member appears under different names, affiliations, and publication records across platforms — creating unresolvable confusion.",
    items: ["Different name spellings", "Duplicate publications", "Conflicting h-index", "Mismatched affiliations"],
    color: "var(--warning)",
    colorMuted: "var(--warning-muted)",
  },
  {
    icon: BarChart3,
    title: "Incomplete",
    label: "Metrics miss context",
    description:
      "Research publication counts alone fail to capture teaching quality, mentoring, outreach, institutional contributions, or leadership impact.",
    items: ["Teaching quality unmeasured", "Mentoring invisible", "Outreach untracked", "Leadership unrecognized"],
    color: "var(--danger)",
    colorMuted: "var(--danger-muted)",
  },
];

export function ProblemSection() {
  return (
    <section
      id="how-it-works"
      className="py-24"
      style={{ borderTop: "1px solid var(--border-faint)" }}
    >
      <div className="container-page">
        {/* Section header */}
        <SectionReveal className="max-w-2xl mb-16">
          <div className="text-label mb-4">The Problem</div>
          <h2 className="text-h1 mb-4" style={{ color: "var(--text-primary)" }}>
            Academic data is everywhere.
          </h2>
          <h2 className="text-h1 mb-6" style={{ color: "var(--accent-light)" }}>
            The real problem is connecting it.
          </h2>
          <p className="text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Institutions spend enormous effort manually collecting, reconciling, and verifying faculty data — with results that are still inconsistent, incomplete, and unauditable.
          </p>
        </SectionReveal>

        {/* Problem cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {problems.map((problem, i) => {
            const Icon = problem.icon;
            return (
              <SectionReveal key={problem.title} delay={i * 0.12}>
                <div
                  className="rounded-xl p-6 h-full"
                  style={{
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  {/* Icon */}
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                    style={{ background: problem.colorMuted }}
                  >
                    <Icon size={18} style={{ color: problem.color }} />
                  </div>

                  {/* Label */}
                  <div className="text-label mb-2" style={{ color: problem.color }}>
                    {problem.label}
                  </div>

                  <h3 className="text-h3 mb-3" style={{ color: "var(--text-primary)" }}>
                    {problem.title}
                  </h3>

                  <p className="text-sm leading-relaxed mb-5" style={{ color: "var(--text-secondary)" }}>
                    {problem.description}
                  </p>

                  {/* Items */}
                  <div className="space-y-2">
                    {problem.items.map((item) => (
                      <div key={item} className="flex items-center gap-2">
                        <div
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ background: problem.color, opacity: 0.6 }}
                        />
                        <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                          {item}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </SectionReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
