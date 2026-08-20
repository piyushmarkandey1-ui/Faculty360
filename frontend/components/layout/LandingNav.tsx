"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const navLinks = [
  { label: "How It Works", href: "#how-it-works" },
  { label: "The Pipeline", href: "#pipeline" },
  { label: "Assessment", href: "#assessment" },
  { label: "Platform", href: ROUTES.dashboard },
];

import { ROUTES } from "@/lib/constants/routes";

export function LandingNav() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.0, 0.0, 0.2, 1] }}
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        background: "rgba(11,14,20,0.85)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border-faint)",
      }}
    >
      <div className="container-page flex items-center h-14 gap-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
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
            style={{ color: "var(--text-primary)", fontFamily: "var(--font-sans)" }}
          >
            A³P-Web
          </span>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-6 flex-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm transition-colors duration-150"
              style={{ color: "var(--text-secondary)" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "var(--text-primary)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--text-secondary)")
              }
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* CTA */}
        <div className="flex items-center gap-3 ml-auto">
          <Link
            href={ROUTES.login}
            className="text-sm px-4 py-1.5 rounded-lg border transition-all duration-150"
            style={{
              color: "var(--text-primary)",
              borderColor: "var(--border-default)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)";
              (e.currentTarget as HTMLElement).style.color = "var(--accent)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "var(--border-default)";
              (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
            }}
          >
            Sign In
          </Link>
          <Link
            href={ROUTES.dashboard}
            className="text-sm px-4 py-1.5 rounded-lg font-medium transition-all duration-150"
            style={{
              background: "var(--accent)",
              color: "var(--text-inverse)",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.background =
                "var(--accent-light)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.background = "var(--accent)")
            }
          >
            Explore Platform
          </Link>
        </div>
      </div>
    </motion.header>
  );
}
