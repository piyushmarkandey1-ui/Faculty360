"use client";

import { SectionReveal } from "@/components/ui/SectionReveal";
import { TrendingUp, BookOpen, AlertCircle, ArrowUpRight } from "lucide-react";

const insights = [
  {
    type: "TREND",
    icon: TrendingUp,
    color: "var(--success)",
    colorMuted: "var(--success-muted)",
    title: "Research output increased 50% over the observed period.",
    detail: "Publication count rose from 58 to 87. Citation velocity also improved.",
    hasEvidence: true,
  },
  {
    type: "STRENGTH",
    icon: BookOpen,
    color: "var(--info)",
    colorMuted: "var(--info-muted)",
    title: "Strong and consistent teaching performance across all observed cycles.",
    detail: "Teaching parameter scores are in the top 15% of assessed faculty.",
    hasEvidence: true,
  },
  {
    type: "POTENTIAL IMPROVEMENT",
    icon: ArrowUpRight,
    color: "var(--accent)",
    colorMuted: "var(--accent-muted)",
    title: "Outreach contribution is comparatively lower than other parameters.",
    detail: "Outreach scored 65.0 / 100. Community engagement activities are underrepresented in source data.",
    hasEvidence: false,
  },
  {
    type: "ANOMALY",
    icon: AlertCircle,
    color: "var(--warning)",
    colorMuted: "var(--warning-muted)",
    title: "Publication metadata contains source-level differences requiring review.",
    detail: "3 publications show year discrepancies between Google Scholar and institutional records.",
    hasEvidence: true,
  },
];

export function InsightsSection() {
  return (
    <section className="py-24" style={{ borderTop: "1px solid var(--border-faint)" }}>
      <div className="container-page">
        {/* Header */}
        <SectionReveal className="max-w-2xl mb-6">
          <div className="text-label mb-4">AI Layer</div>
          <h2 className="text-h1" style={{ color: "var(--text-primary)" }}>
            AI helps interpret the data.
          </h2>
          <h2 className="text-h1 mb-6" style={{ color: "var(--accent-light)" }}>
            It doesn&apos;t replace the rules.
          </h2>
        </SectionReveal>

        {/* Core principle callout */}
        <SectionReveal>
          <div
            className="rounded-xl px-6 py-5 mb-12 flex flex-wrap gap-8 items-center"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-default)",
            }}
          >
            {[
              { label: "Rules Calculate.", desc: "All scores are produced by the deterministic rule engine", color: "var(--success)" },
              { label: "AI Interprets.", desc: "The LLM reads results and generates advisory narrative", color: "var(--info)" },
              { label: "Humans Decide.", desc: "Administrators review evidence and approve assessments", color: "var(--accent)" },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-3 flex-1 min-w-52">
                <div className="w-1 h-12 rounded-full shrink-0 mt-1" style={{ background: item.color }} />
                <div>
                  <div className="text-sm font-semibold mb-1" style={{ color: item.color }}>{item.label}</div>
                  <div className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </SectionReveal>

        {/* Insight cards */}
        <div className="grid md:grid-cols-2 gap-5">
          {insights.map((insight, i) => {
            const Icon = insight.icon;
            return (
              <SectionReveal key={insight.type} delay={i * 0.1}>
                <div
                  className="rounded-xl p-5 h-full flex flex-col"
                  style={{
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: insight.colorMuted }}
                    >
                      <Icon size={15} style={{ color: insight.color }} />
                    </div>
                    <span
                      className="text-[11px] font-bold tracking-widest uppercase"
                      style={{ color: insight.color }}
                    >
                      {insight.type}
                    </span>
                    <span
                      className="ml-auto text-[10px] px-2 py-0.5 rounded-full"
                      style={{
                        background: "var(--bg-elevated)",
                        color: "var(--text-muted)",
                        border: "1px solid var(--border-faint)",
                      }}
                    >
                      ADVISORY
                    </span>
                  </div>

                  <p className="text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
                    {insight.title}
                  </p>
                  <p className="text-xs leading-relaxed flex-1" style={{ color: "var(--text-secondary)" }}>
                    {insight.detail}
                  </p>

                  {insight.hasEvidence && (
                    <button
                      className="mt-3 self-start text-[11px] px-3 py-1 rounded-lg transition-colors"
                      style={{
                        color: "var(--text-muted)",
                        border: "1px solid var(--border-subtle)",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
                        (e.currentTarget as HTMLElement).style.borderColor = "var(--border-default)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
                        (e.currentTarget as HTMLElement).style.borderColor = "var(--border-subtle)";
                      }}
                    >
                      View Evidence →
                    </button>
                  )}
                </div>
              </SectionReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
