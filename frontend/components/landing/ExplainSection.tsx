"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { SectionReveal } from "@/components/ui/SectionReveal";

const chain = [
  {
    id: "overall",
    level: 0,
    label: "84.7 Overall Score",
    detail: "Computed by A³P Rule Engine v1.0.0",
    meta: "7 parameters · 14 KPIs",
    children: ["research"],
  },
  {
    id: "research",
    level: 1,
    label: "Research — 81.5 / 100",
    detail: "Category: Research Output",
    meta: "3 contributing KPIs",
    children: ["pub-count"],
  },
  {
    id: "pub-count",
    level: 2,
    label: "Publication Count — 68.0 / 100",
    detail: "rule: research_output.publication_count v1.0.0",
    meta: "raw_value = 87",
    children: ["publications"],
  },
  {
    id: "publications",
    level: 3,
    label: "87 Canonical Publications",
    detail: "After deduplication across all sources",
    meta: "14 duplicates resolved",
    children: ["sources"],
  },
  {
    id: "sources",
    level: 4,
    label: "Source Evidence",
    detail: "Google Scholar: 82 found · Institutional: 87 records",
    meta: "source_record_id: gs-run-2026-08-19",
    children: [],
  },
];

export function ExplainSection() {
  const [expanded, setExpanded] = useState<string>("overall");

  const expandedIndex = chain.findIndex((c) => c.id === expanded);
  const visible = chain.slice(0, expandedIndex + 2);

  return (
    <section className="py-24" style={{ background: "#FFFFFF", borderTop: "1px solid var(--border-default)" }}>
      <div className="container-page">
        <SectionReveal className="max-w-xl mb-16">
          <div className="text-label mb-4">Explainability</div>
          <h2 className="text-h1" style={{ color: "var(--text-primary)" }}>
            Every score should have a story.
          </h2>
          <p className="mt-4 text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Click through any score to trace it back to the exact rule, metric, evidence record, and source that produced it.
          </p>
        </SectionReveal>

        <SectionReveal>
          <div className="max-w-2xl mx-auto">
            {/* Chain label */}
            <div className="flex items-center gap-3 mb-4 text-xs" style={{ color: "var(--text-muted)" }}>
              {["Score", "Parameter", "KPI", "Metric", "Evidence"].map((label, i) => (
                <span key={label} className="flex items-center gap-2">
                  <span
                    className="px-2 py-0.5 rounded"
                    style={{
                      background: i <= expandedIndex ? "var(--accent-muted)" : "var(--bg-elevated)",
                      color: i <= expandedIndex ? "var(--accent)" : "var(--text-muted)",
                      border: "1px solid var(--border-faint)",
                    }}
                  >
                    {label}
                  </span>
                  {i < 4 && <ChevronRight size={10} />}
                </span>
              ))}
            </div>

            {/* Chain cards */}
            <div className="space-y-2">
              {visible.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  style={{ paddingLeft: `${item.level * 20}px` }}
                >
                  {/* Connector line */}
                  {item.level > 0 && (
                    <div
                      className="w-px h-3 mb-1"
                      style={{
                        background: "var(--border-default)",
                        marginLeft: "16px",
                      }}
                    />
                  )}

                  <button
                    onClick={() =>
                      item.children.length > 0 && setExpanded(item.children[0])
                    }
                    className="w-full text-left"
                    disabled={item.children.length === 0}
                  >
                    <div
                      className="px-4 py-3.5 rounded-xl transition-all duration-200"
                      style={{
                        background: expanded === item.id || (i === expandedIndex + 1) ? "var(--bg-elevated)" : "var(--bg-surface)",
                        border: `1px solid ${expanded === item.id ? "var(--accent)" : "var(--border-subtle)"}`,
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div
                            className="text-sm font-medium mb-0.5"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {item.label}
                          </div>
                          <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
                            {item.detail}
                          </div>
                          <div
                            className="text-[11px] mt-1"
                            style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}
                          >
                            {item.meta}
                          </div>
                        </div>
                        {item.children.length > 0 && (
                          <div
                            className="shrink-0 text-xs px-2 py-1 rounded"
                            style={{
                              background: "var(--accent-muted)",
                              color: "var(--accent)",
                              fontSize: "10px",
                            }}
                          >
                            Drill down →
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                </motion.div>
              ))}
            </div>

            {expandedIndex >= chain.length - 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 text-center"
              >
                <button
                  onClick={() => setExpanded("overall")}
                  className="text-xs px-3 py-1.5 rounded-lg"
                  style={{ color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}
                >
                  Reset drill-down
                </button>
              </motion.div>
            )}
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}
