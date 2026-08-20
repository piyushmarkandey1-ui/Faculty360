"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Users, FileQuestion } from "lucide-react";
import { ROUTES } from "@/lib/constants/routes";
import { APP_NAME } from "@/lib/constants/config";

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6 text-center"
      style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}
    >
      {/* Background Grid Pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: `linear-gradient(var(--border-faint) 1px, transparent 1px), linear-gradient(90deg, var(--border-faint) 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse 60% 60% at 50% 50%, black 20%, transparent 100%)",
        }}
        aria-hidden="true"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 max-w-md w-full p-8 rounded-2xl border"
        style={{
          background: "var(--bg-surface)",
          borderColor: "var(--border-subtle)",
        }}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold"
            style={{
              background: "var(--accent)",
              color: "var(--text-inverse)",
              fontFamily: "var(--font-mono)",
            }}
          >
            A³
          </div>
          <span
            className="text-sm font-semibold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            {APP_NAME}
          </span>
        </div>

        {/* 404 Visual Icon */}
        <div
          className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center"
          style={{
            background: "var(--accent-muted)",
            border: "1px solid var(--border-subtle)",
            color: "var(--accent)",
          }}
        >
          <FileQuestion size={32} />
        </div>

        {/* Title & Description */}
        <h1
          className="text-4xl font-extrabold mb-2 tracking-tight"
          style={{ color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}
        >
          404
        </h1>

        <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
          Page not found.
        </h2>

        <p className="text-sm mb-8 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          The requested academic intelligence view could not be located. The link may be broken or the route does not exist.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href={ROUTES.dashboard}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150"
            style={{
              background: "var(--accent)",
              color: "var(--text-inverse)",
            }}
          >
            <ArrowLeft size={16} />
            <span>Back to Dashboard</span>
          </Link>

          <Link
            href={ROUTES.faculty.list}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border transition-all duration-150"
            style={{
              background: "var(--bg-elevated)",
              borderColor: "var(--border-default)",
              color: "var(--text-primary)",
            }}
          >
            <Users size={16} />
            <span>Faculty Directory</span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
