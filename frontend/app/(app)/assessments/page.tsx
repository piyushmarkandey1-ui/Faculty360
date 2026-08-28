'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
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
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { ROUTES } from "@/lib/constants/routes";
import { formatRelativeTime } from "@/lib/utils/format";
import { apiFetch } from "@/lib/api/client";

export default function AssessmentsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [assessmentRows, setAssessmentRows] = useState<any[]>([]);
  const [expandedFacultyId, setExpandedFacultyId] = useState<string | null>(null);

  useEffect(() => {
    apiFetch('/assessments').then((res: any) => {
      const rows = res.items.map((item: any) => ({
        id: item.id,
        facultyId: item.faculty.id,
        name: item.faculty.canonical_name,
        department: item.faculty.department,
        designation: item.faculty.designation,
        score: item.total_score || 0,
        confidence: item.confidence_score || 0,
        completeness: item.faculty.completeness_score || 0,
        status: item.status || "draft",
        lastAssessed: item.created_at,
        framework: item.assessment_frameworks ? `${item.assessment_frameworks.name} v${item.assessment_frameworks.version}` : 'Legacy Framework',
      }));
      setAssessmentRows(rows);
    }).catch(console.error);
  }, []);

  // Group by faculty
  const groupedAssessments = assessmentRows.reduce((acc, row) => {
    if (!acc[row.facultyId]) {
      acc[row.facultyId] = {
        facultyId: row.facultyId,
        name: row.name,
        department: row.department,
        designation: row.designation,
        completeness: row.completeness,
        assessments: []
      }
    }
    acc[row.facultyId].assessments.push(row)
    return acc
  }, {} as Record<string, any>)

  const facultyGroups = Object.values(groupedAssessments).map((g: any) => {
    g.assessments.sort((a: any, b: any) => new Date(b.lastAssessed).getTime() - new Date(a.lastAssessed).getTime())
    return g
  })

  const filteredGroups = facultyGroups.filter((g: any) => {
    const latest = g.assessments[0]
    if (statusFilter === "All") return true;
    return latest.status.toLowerCase() === statusFilter.toLowerCase();
  });

  // Calculate summary metrics
  const avgScore = assessmentRows.length > 0 ? (
    assessmentRows.reduce((acc, r) => acc + r.score, 0) / assessmentRows.length
  ).toFixed(1) : "0.0";

  const avgConfidence = assessmentRows.length > 0 ? Math.round(
    assessmentRows.reduce((acc, r) => acc + r.confidence, 0) / assessmentRows.length
  ) : 0;

  const pendingCount = assessmentRows.filter(
    (r) => r.status === "draft" || r.status === "submitted"
  ).length;

  return (
    <div className="space-y-8 pb-20">
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
          <Link href="/assessments/new">
            <Button variant="primary" className="gap-2">
              <Sparkles size={16} />
              Go for New Assessment
            </Button>
          </Link>
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
              <Badge variant="success" size="sm">
                Active
              </Badge>
            </div>
            <h3
              className="text-base font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              System Defaults Automatically Selected
            </h3>
            <p
              className="text-xs mt-1 leading-relaxed"
              style={{ color: "var(--text-secondary)" }}
            >
              Go to Settings to create or activate a new custom framework.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 shrink-0 border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-6 border-[var(--border-subtle)]">
          <div>
            <div className="text-xs text-[var(--text-muted)]">Active Assessments</div>
            <div className="text-sm font-semibold text-[var(--text-primary)]">{assessmentRows.length}</div>
          </div>
        </div>
      </motion.div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Avg Assessment Score", value: parseFloat(avgScore), suffix: "/ 100", icon: BarChart3, color: "var(--accent)" },
          { label: "Avg Data Confidence", value: avgConfidence, suffix: "%", icon: ShieldCheck, color: "var(--success)" },
          { label: "Approved Evaluations", value: assessmentRows.length - pendingCount, suffix: "", icon: CheckCircle2, color: "var(--info)" },
          { label: "Pending Reviews", value: pendingCount, suffix: "", icon: Clock, color: "var(--warning)" },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
              className="p-4 rounded-xl border relative overflow-hidden"
              style={{
                background: "var(--bg-surface)",
                borderColor: "var(--border-subtle)",
              }}
            >
              <div
                className="absolute top-0 right-0 p-4 opacity-10"
                style={{ color: stat.color }}
              >
                <Icon size={40} />
              </div>
              <div className="text-xs font-semibold uppercase tracking-wider mb-2 text-[var(--text-muted)]">
                {stat.label}
              </div>
              <div className="flex items-baseline gap-1">
                <span style={{ color: "var(--text-primary)" }}>
                  <AnimatedCounter
                    value={stat.value}
                    className="text-2xl font-bold"
                    duration={800}
                    format={(n) => (stat.value % 1 !== 0 ? n.toFixed(1) : Math.round(n).toString())}
                  />
                </span>
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
        className="rounded-xl border overflow-hidden flex flex-col bg-[var(--bg-surface)] border-[var(--border-subtle)]"
      >
        <div className="p-4 border-b border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold text-base text-[var(--text-primary)]">
              Faculty Assessments
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Click on a faculty member to view their complete assessment history over time
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

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-b border-[var(--border-subtle)] text-xs font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5 w-8"></th>
                <th className="px-5 py-3.5">Faculty</th>
                <th className="px-5 py-3.5">Department</th>
                <th className="px-5 py-3.5 text-center">Framework</th>
                <th className="px-5 py-3.5 text-center">Score</th>
                <th className="px-5 py-3.5 text-center">Confidence</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {filteredGroups.map((group: any) => {
                const latest = group.assessments[0]
                const isExpanded = expandedFacultyId === group.facultyId
                const hasHistory = group.assessments.length > 1
                
                return (
                  <React.Fragment key={group.facultyId}>
                    <tr
                      onClick={() => setExpandedFacultyId(isExpanded ? null : group.facultyId)}
                      className={`hover:bg-[var(--bg-hover)] transition-colors cursor-pointer group ${isExpanded ? 'bg-[var(--bg-hover)]' : ''}`}
                    >
                      <td className="px-3 py-4 text-center">
                        {hasHistory ? (
                          <div className="p-1 rounded bg-[var(--bg-elevated)] text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors inline-flex">
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                        <Link href={ROUTES.faculty.assessment(group.facultyId)} className="block">
                          <div className="font-semibold text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors">
                            {group.name}
                          </div>
                          <div className="text-xs text-[var(--text-muted)]">{group.designation}</div>
                        </Link>
                      </td>
                      <td className="px-5 py-4 text-xs text-[var(--text-secondary)] font-medium">
                        {group.department}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <Badge variant="neutral">{latest.framework}</Badge>
                      </td>
                      <td className="px-5 py-4 text-center font-mono font-bold text-base text-[var(--accent)]">
                        {latest.score.toFixed(1)}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <ConfidenceBadge confidence={latest.confidence} />
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant={latest.status === "approved" ? "success" : latest.status === "submitted" ? "info" : "neutral"}>
                          {latest.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-xs text-[var(--text-secondary)]">
                        {formatRelativeTime(latest.lastAssessed)}
                        {hasHistory && <div className="text-[10px] text-[var(--accent)] mt-0.5">{group.assessments.length} total records</div>}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={ROUTES.faculty.assessment(group.facultyId)}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center justify-center p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all bg-[var(--bg-elevated)] text-[var(--text-primary)] hover:text-[var(--accent)]"
                        >
                          <ArrowUpRight size={16} />
                        </Link>
                      </td>
                    </tr>
                    
                    <AnimatePresence>
                      {isExpanded && hasHistory && group.assessments.slice(1).map((hist: any, hIdx: number) => (
                        <motion.tr 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          key={hist.id || hIdx} 
                          className="bg-[var(--bg-elevated)]/50 text-xs border-l-[3px] border-l-[var(--accent)]"
                        >
                          <td className="px-3 py-3"></td>
                          <td className="px-5 py-3 text-[var(--text-muted)] pl-8 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full border border-[var(--text-muted)]" />
                            Historical Record
                          </td>
                          <td className="px-5 py-3 text-[var(--text-muted)]">
                            {hist.department}
                          </td>
                          <td className="px-5 py-3 text-center">
                            <Badge variant="neutral" className="scale-90">{hist.framework}</Badge>
                          </td>
                          <td className="px-5 py-3 text-center font-mono font-semibold text-[var(--text-primary)] opacity-80">
                            {hist.score.toFixed(1)}
                          </td>
                          <td className="px-5 py-3 text-center opacity-80 scale-90 origin-center">
                            <ConfidenceBadge confidence={hist.confidence} />
                          </td>
                          <td className="px-5 py-3">
                            <Badge variant="neutral" className="scale-90">{hist.status}</Badge>
                          </td>
                          <td className="px-5 py-3 text-[var(--text-muted)]">
                            {new Date(hist.lastAssessed).toLocaleDateString()}
                          </td>
                          <td className="px-5 py-3 text-right">
                            <Link
                              href={ROUTES.faculty.assessment(group.facultyId)}
                              className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
                            >
                              View
                            </Link>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </React.Fragment>
                )
              })}
              {filteredGroups.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[var(--text-muted)] text-sm">
                    No faculty assessments match the selected filter.
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
