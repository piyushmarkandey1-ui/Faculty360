"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FileCheck,
  ShieldCheck,
  BarChart3,
  Sparkles,
  ArrowUpRight,
  Filter,
  CheckCircle2,
  Clock,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { ROUTES } from "@/lib/constants/routes";
import { MOCK_FACULTY_LIST, MOCK_ASSESSMENTS, MOCK_FACULTY_PROFILES } from "@/mock-data";
import { formatRelativeTime } from "@/lib/utils/format";

export default function AssessmentsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("All");

  // Derive assessment rows from mock faculty profiles & list
  const assessmentRows = MOCK_FACULTY_LIST.map((fac) => {
    const profile = MOCK_FACULTY_PROFILES[fac.id] || MOCK_FACULTY_PROFILES["faculty-001"];
    const assessment = profile?.latest_assessment
      ? MOCK_ASSESSMENTS[profile.latest_assessment.id] || MOCK_ASSESSMENTS["assessment-001"]
      : MOCK_ASSESSMENTS["assessment-001"];

    return {
      facultyId: fac.id,
      name: fac.canonical_name,
      department: fac.department,
      designation: fac.designation,
      score: assessment?.total_score ?? 84.7,
      confidence: assessment?.confidence_score ?? 91,
      completeness: fac.completeness_score,
      status: assessment?.status ?? "draft",
      lastAssessed: assessment?.assessed_at ?? fac.last_synced_at ?? "2026-08-20T08:05:00Z",
    };
  });

  const filteredRows = assessmentRows.filter((r) => {
    if (statusFilter === "All") return true;
    return r.status.toLowerCase() === statusFilter.toLowerCase();
  });

  // Calculate summary metrics
  const avgScore = (
    assessmentRows.reduce((acc, r) => acc + r.score, 0) / assessmentRows.length
  ).toFixed(1);

  const avgConfidence = Math.round(
    assessmentRows.reduce((acc, r) => acc + r.confidence, 0) / assessmentRows.length
  );

  const pendingCount = assessmentRows.filter(
    (r) => r.status === "draft" || r.status === "submitted"
  ).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-wider mb-1 font-semibold text-[var(--accent)]">
            Institutional Engine
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Assessment Management
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Deterministic KPI assessment framework & explainable evaluations
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="primary" className="gap-2">
            <Sparkles size={16} />
            Run Cycle Assessment
          </Button>
        </div>
      </div>

      {/* Active Framework Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-5 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4"
        style={{
          background: "var(--bg-surface)",
          borderColor: "var(--border-subtle)",
        }}
      >
        <div className="flex items-start gap-4">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            style={{
              background: "var(--accent-muted)",
              color: "var(--accent)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <Layers size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Active Assessment Framework
              </span>
              <Badge variant="accent" size="sm">
                v1.0
              </Badge>
              <Badge variant="success" size="sm">
                Active
              </Badge>
            </div>
            <h3
              className="text-base font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              A³P-Web Faculty Assessment Framework 2026
            </h3>
            <p
              className="text-xs mt-1 leading-relaxed"
              style={{ color: "var(--text-secondary)" }}
            >
              Includes 5 weighted KPI categories: Research Output, Publication Quality, Research Impact, Profile Completeness, Source Coverage.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 shrink-0 border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-6 border-[var(--border-subtle)]">
          <div>
            <div className="text-xs text-[var(--text-muted)]">Framework Version</div>
            <div className="text-sm font-semibold text-[var(--text-primary)]">v1.0.4-sih</div>
          </div>
          <div>
            <div className="text-xs text-[var(--text-muted)]">Last Global Evaluation</div>
            <div className="text-sm font-semibold text-[var(--text-primary)]">Today, 08:05 AM</div>
          </div>
        </div>
      </motion.div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Evaluated Profiles",
            value: assessmentRows.length,
            suffix: " faculty",
            icon: FileCheck,
            color: "var(--accent)",
          },
          {
            label: "Average Score",
            value: parseFloat(avgScore),
            suffix: " / 100",
            icon: BarChart3,
            color: "var(--info)",
          },
          {
            label: "Assessment Confidence",
            value: avgConfidence,
            suffix: "% avg",
            icon: ShieldCheck,
            color: "var(--success)",
          },
          {
            label: "Pending Assessments",
            value: pendingCount,
            suffix: " pending",
            icon: Clock,
            color: "var(--warning)",
          },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="p-5 rounded-xl border flex flex-col justify-between"
              style={{
                background: "var(--bg-surface)",
                borderColor: "var(--border-subtle)",
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                  {stat.label}
                </span>
                <div
                  className="p-2 rounded-lg"
                  style={{ background: "var(--bg-elevated)", color: stat.color }}
                >
                  <Icon size={16} />
                </div>
              </div>
              <div className="text-2xl font-bold flex items-baseline gap-1" style={{ color: "var(--text-primary)" }}>
                <AnimatedCounter
                  value={stat.value}
                  duration={800}
                  format={(n) => (stat.value % 1 !== 0 ? n.toFixed(1) : Math.round(n).toString())}
                />
                <span className="text-xs font-normal" style={{ color: "var(--text-muted)" }}>
                  {stat.suffix}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Table Section */}
      <div
        className="rounded-xl border overflow-hidden flex flex-col"
        style={{
          background: "var(--bg-surface)",
          borderColor: "var(--border-subtle)",
        }}
      >
        {/* Table Filter Header */}
        <div
          className="p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          <div>
            <h2 className="font-semibold text-base" style={{ color: "var(--text-primary)" }}>
              Faculty Assessments
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Select any row to inspect deterministic parameter breakdown & evidence chain
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Filter size={14} className="text-[var(--text-muted)]" />
            <span className="text-xs text-[var(--text-secondary)] font-medium">Status:</span>
            {["All", "Draft", "Approved", "Submitted"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  statusFilter === st
                    ? "bg-[var(--accent)] text-[var(--text-inverse)]"
                    : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-b border-[var(--border-subtle)] text-xs font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Faculty</th>
                <th className="px-5 py-3.5">Department</th>
                <th className="px-5 py-3.5 text-center">Overall Score</th>
                <th className="px-5 py-3.5 text-center">Confidence</th>
                <th className="px-5 py-3.5 text-center">Completeness</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Last Assessed</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {filteredRows.map((row) => (
                <tr
                  key={row.facultyId}
                  className="hover:bg-[var(--bg-hover)] transition-colors cursor-pointer group"
                >
                  <td className="px-5 py-4">
                    <Link href={ROUTES.faculty.assessment(row.facultyId)} className="block">
                      <div className="font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                        {row.name}
                      </div>
                      <div className="text-xs text-[var(--text-muted)]">{row.designation}</div>
                    </Link>
                  </td>
                  <td className="px-5 py-4 text-xs text-[var(--text-secondary)] font-medium">
                    {row.department}
                  </td>
                  <td className="px-5 py-4 text-center font-mono font-bold text-base text-[var(--accent)]">
                    {row.score.toFixed(1)}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <ConfidenceBadge confidence={row.confidence} />
                  </td>
                  <td className="px-5 py-4 text-center">
                    <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--text-primary)]">
                      <div className="w-12 bg-[var(--bg-elevated)] h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[var(--accent)] rounded-full"
                          style={{ width: `${row.completeness}%` }}
                        />
                      </div>
                      <span>{row.completeness}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <Badge
                      variant={
                        row.status === "approved"
                          ? "success"
                          : row.status === "draft"
                          ? "warning"
                          : "neutral"
                      }
                      size="sm"
                    >
                      {row.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 text-xs text-[var(--text-muted)]">
                    {formatRelativeTime(row.lastAssessed)}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      href={ROUTES.faculty.assessment(row.facultyId)}
                      className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--accent)] hover:text-white transition-colors"
                    >
                      <span>Breakdown</span>
                      <ArrowUpRight size={13} />
                    </Link>
                  </td>
                </tr>
              ))}
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[var(--text-muted)] text-sm">
                    No faculty assessments match the selected status filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
