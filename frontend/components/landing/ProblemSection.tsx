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
      style={{ background: "#FFFFFF", borderTop: "1px solid var(--border-default)" }}
    >
      <div className="container-page">
        {/* Section header */}
        <SectionReveal className="max-w-2xl mb-16">
          <div className="text-label mb-4">The Problem</div>
          <h2 className="text-h1 mb-3" style={{ color: "var(--text-primary)" }}>
            Academic data is everywhere.
          </h2>
          <h2 className="text-h1 mb-6" style={{ color: "var(--accent)" }}>
            The real problem is connecting it.
          </h2>
          <p className="text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Institutions spend enormous effort manually collecting, reconciling, and verifying faculty data — with results that are still inconsistent, incomplete, and unauditable.
          </p>
        </SectionReveal>

        {/* Problem cards grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {problems.map((item, i) => {
            const Icon = item.icon;
            return (
              <SectionReveal key={item.title} delay={i * 0.15}>
                <div
                  className="p-8 rounded-2xl border transition-all duration-200 hover:shadow-md hover:-translate-y-1 h-full flex flex-col justify-between"
                  style={{
                    background: "var(--bg-base)", // Warm Ivory
                    borderColor: "var(--border-default)",
                  }}
                >
                  <div>
                    {/* Header icon */}
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center mb-6"
                      style={{ background: item.colorMuted, color: item.color }}
                    >
                      <Icon size={24} />
                    </div>

                    <div className="text-label mb-2" style={{ color: item.color }}>
                      {item.title}
                    </div>

                    <h3 className="text-xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>
                      {item.label}
                    </h3>

                    <p className="text-sm leading-relaxed mb-6" style={{ color: "var(--text-secondary)" }}>
                      {item.description}
                    </p>
                  </div>

                  {/* Bullet tags */}
                  <div className="space-y-2 pt-4 border-t border-[var(--border-default)]">
                    {item.items.map((point) => (
                      <div key={point} className="flex items-center gap-2 text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: item.color }} />
                        <span>{point}</span>
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
