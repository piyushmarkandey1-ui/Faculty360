"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  Sliders,
  Database,
  RefreshCw,
  Shield,
  Bell,
  Check,
  Globe,
  Lock,
  Cpu,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SourceBadge } from "@/components/ui/SourceBadge";
import { InstitutionalUploadCard } from "@/components/ui/InstitutionalUploadCard";

export default function SettingsPage() {
  const [syncing, setSyncing] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleManualSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
    }, 1200);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-wider mb-1 font-semibold text-[var(--accent)]">
            System Configuration
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Platform Settings
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Manage institutional configuration, framework rules, data source connectors, and sync policies
          </p>
        </div>

        <Button variant="primary" onClick={handleSave} className="gap-2">
          {saved ? <CheckCircle2 size={16} /> : <Sliders size={16} />}
          {saved ? "Configuration Saved" : "Save Changes"}
        </Button>
      </div>

      {/* 1. Institution Settings */}
      <section className="p-6 rounded-xl border space-y-4" style={{ background: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
        <div className="flex items-center gap-3 pb-3 border-b border-[var(--border-subtle)]">
          <div className="p-2 rounded-lg bg-[var(--bg-elevated)] text-[var(--accent)]">
            <Building2 size={18} />
          </div>
          <div>
            <h2 className="font-semibold text-base" style={{ color: "var(--text-primary)" }}>
              1. Institution Profile
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Authorized Higher Education Institution metadata
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
              Institution Name
            </label>
            <input
              type="text"
              defaultValue="National Institute of Technology, Warangal"
              className="w-full px-3.5 py-2.5 rounded-lg text-sm bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
              Institution Code / AISHE ID
            </label>
            <input
              type="text"
              defaultValue="NITW-HEI-2026-IN"
              className="w-full px-3.5 py-2.5 rounded-lg text-sm bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] outline-none focus:border-[var(--accent)] font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
              Current Academic Year
            </label>
            <select className="w-full px-3.5 py-2.5 rounded-lg text-sm bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]">
              <option value="2025-2026">2025 – 2026 (Active)</option>
              <option value="2024-2025">2024 – 2025</option>
            </select>
          </div>
        </div>
      </section>

      {/* 2. Assessment Framework */}
      <section className="p-6 rounded-xl border space-y-4" style={{ background: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
        <div className="flex items-center gap-3 pb-3 border-b border-[var(--border-subtle)]">
          <div className="p-2 rounded-lg bg-[var(--bg-elevated)] text-[var(--accent)]">
            <Cpu size={18} />
          </div>
          <div>
            <h2 className="font-semibold text-base" style={{ color: "var(--text-primary)" }}>
              2. Assessment Framework
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Rules-based calculation model and parameter weighting
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
            <div className="text-xs text-[var(--text-muted)] mb-1">Active Calculation Model</div>
            <div className="text-sm font-semibold text-[var(--text-primary)] mb-2">
              AcadLens Faculty Assessment Framework 2026
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="accent" size="sm">
                v1.0.4
              </Badge>
              <Badge variant="success" size="sm">
                Deterministic
              </Badge>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
            <div className="text-xs text-[var(--text-muted)] mb-1">Parameter Weighting Configuration</div>
            <div className="text-xs text-[var(--text-secondary)] space-y-1 mt-2 font-mono">
              <div className="flex justify-between">
                <span>Research Output:</span>
                <span>35% weight</span>
              </div>
              <div className="flex justify-between">
                <span>Publication Quality:</span>
                <span>25% weight</span>
              </div>
              <div className="flex justify-between">
                <span>Research Impact (h-index):</span>
                <span>20% weight</span>
              </div>
              <div className="flex justify-between">
                <span>Profile Completeness:</span>
                <span>10% weight</span>
              </div>
              <div className="flex justify-between">
                <span>Source Coverage:</span>
                <span>10% weight</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Data Sources */}
      <section className="p-6 rounded-xl border space-y-4" style={{ background: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
        <div className="flex items-center gap-3 pb-3 border-b border-[var(--border-subtle)]">
          <div className="p-2 rounded-lg bg-[var(--bg-elevated)] text-[var(--accent)]">
            <Globe size={18} />
          </div>
          <div>
            <h2 className="font-semibold text-base" style={{ color: "var(--text-primary)" }}>
              3. Multi-Source Connectors
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Status of public web scrapers and authorized institutional systems
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {[
            {
              source: "google_scholar" as const,
              name: "Google Scholar (Apify)",
              status: "Connected",
              badgeVariant: "success" as const,
              description: "Active web scraping pipeline via Apify Actor.",
            },
            {
              source: "researchgate" as const,
              name: "ResearchGate Scraper",
              status: "Connected",
              badgeVariant: "success" as const,
              description: "Publication & co-author graph extraction.",
            },
            {
              source: "institutional" as const,
              name: "Institutional ERP / DB",
              status: "Connected",
              badgeVariant: "success" as const,
              description: "Authorized internal database synchronization.",
            },
            {
              source: "orcid" as const,
              name: "ORCID Public API",
              status: "Available",
              badgeVariant: "info" as const,
              description: "OAuth 2.0 public record connector.",
            },
          ].map((item) => (
            <div
              key={item.source}
              className="p-4 rounded-xl border bg-[var(--bg-elevated)] border-[var(--border-subtle)] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <SourceBadge source={item.source} status="active" />
                  <Badge variant={item.badgeVariant} size="sm">
                    {item.status}
                  </Badge>
                </div>
                <h4 className="font-medium text-sm text-[var(--text-primary)] mb-1">
                  {item.name}
                </h4>
                <p className="text-xs text-[var(--text-secondary)]">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Synchronization */}
      <section className="p-6 rounded-xl border space-y-4" style={{ background: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[var(--bg-elevated)] text-[var(--accent)]">
              <RefreshCw size={18} />
            </div>
            <div>
              <h2 className="font-semibold text-base" style={{ color: "var(--text-primary)" }}>
                4. Synchronization Engine & Data Import
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Manage automated scraping schedules and manual data uploads
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleManualSync}
            className="gap-2"
          >
            <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
            Trigger Global Sync
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 pb-4 border-b border-[var(--border-subtle)]">
          {/* Batch Data Import */}
          <InstitutionalUploadCard />

          {/* Sync Settings Placeholder for Future */}
          <div className="p-5 rounded-xl border flex flex-col bg-[var(--bg-surface)] border-[var(--border-subtle)] justify-center items-center text-center">
            <h3 className="font-medium text-sm text-[var(--text-primary)] mb-2">Automated Sync Schedule</h3>
            <p className="text-xs text-[var(--text-secondary)] max-w-xs mx-auto mb-4">
              Scraping pipelines run automatically based on the schedule configured below.
            </p>
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="neutral">Every 24 Hours</Badge>
              <Badge variant="neutral">Delta Updates Only</Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div>
            <div className="text-xs text-[var(--text-muted)] mb-1">Last Global Sync</div>
            <div className="text-sm font-semibold text-[var(--text-primary)]">
              Today, 10:00 AM IST
            </div>
          </div>

          <div>
            <div className="text-xs text-[var(--text-muted)] mb-1">Automated Sync Frequency</div>
            <select className="w-full mt-1 px-3 py-1.5 rounded-lg text-xs bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] outline-none">
              <option value="daily">Daily (Nightly at 02:00 AM)</option>
              <option value="weekly">Weekly</option>
              <option value="manual">Manual Trigger Only</option>
            </select>
          </div>

          <div>
            <div className="text-xs text-[var(--text-muted)] mb-1">Sync Ingestion Mode</div>
            <div className="text-sm font-semibold text-[var(--text-primary)] mt-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[var(--success)]" />
              Incremental + Deduplicated
            </div>
          </div>
        </div>
      </section>

      {/* 5. Security & Access */}
      <section className="p-6 rounded-xl border space-y-4" style={{ background: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
        <div className="flex items-center gap-3 pb-3 border-b border-[var(--border-subtle)]">
          <div className="p-2 rounded-lg bg-[var(--bg-elevated)] text-[var(--accent)]">
            <Shield size={18} />
          </div>
          <div>
            <h2 className="font-semibold text-base" style={{ color: "var(--text-primary)" }}>
              5. Security & Access
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Institutional administrator credentials & session parameters
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div>
            <div className="text-xs text-[var(--text-muted)] mb-1">Current User</div>
            <div className="text-sm font-semibold text-[var(--text-primary)]">
              admin@acadlens.ac.in
            </div>
          </div>

          <div>
            <div className="text-xs text-[var(--text-muted)] mb-1">Access Role</div>
            <div className="text-sm font-semibold text-[var(--text-primary)]">
              Institutional Administrator
            </div>
          </div>

          <div>
            <div className="text-xs text-[var(--text-muted)] mb-1">Session Status</div>
            <div className="text-sm font-semibold text-[var(--success)] flex items-center gap-1">
              <Lock size={12} /> Active (Token Authenticated)
            </div>
          </div>
        </div>
      </section>

      {/* 6. Notifications */}
      <section className="p-6 rounded-xl border space-y-4" style={{ background: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
        <div className="flex items-center gap-3 pb-3 border-b border-[var(--border-subtle)]">
          <div className="p-2 rounded-lg bg-[var(--bg-elevated)] text-[var(--accent)]">
            <Bell size={18} />
          </div>
          <div>
            <h2 className="font-semibold text-base" style={{ color: "var(--text-primary)" }}>
              6. Notifications & Alerts
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Automated reminders for data conflicts and verification tasks
            </p>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          {[
            {
              label: "Data Conflict Alerts",
              desc: "Notify when Google Scholar and ResearchGate metrics disagree by > 5%",
              enabled: true,
            },
            {
              label: "Sync Failure Reports",
              desc: "Immediate email notification if Apify scraper or ERP connector fails",
              enabled: true,
            },
            {
              label: "Verification Reminders",
              desc: "Weekly summary of faculty profiles requiring human verification",
              enabled: false,
            },
          ].map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)]"
            >
              <div>
                <div className="text-sm font-medium text-[var(--text-primary)]">
                  {item.label}
                </div>
                <div className="text-xs text-[var(--text-muted)]">{item.desc}</div>
              </div>
              <Badge variant={item.enabled ? "success" : "neutral"} size="sm">
                {item.enabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
