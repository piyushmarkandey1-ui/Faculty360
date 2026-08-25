"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  Settings,
  ChevronRight,
  X,
  Menu,
  LogOut,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { ROUTES } from "@/lib/constants/routes";
import { APP_NAME } from "@/lib/constants/config";
import { signOut } from "@/app/actions/auth";

const navItems = [
  {
    label: "Dashboard",
    href: ROUTES.dashboard,
    icon: LayoutDashboard,
  },
  {
    label: "Faculty",
    href: ROUTES.faculty.list,
    icon: Users,
  },
  {
    label: "Assessments",
    href: ROUTES.assessments,
    icon: ClipboardCheck,
  },
  {
    label: "Settings",
    href: ROUTES.settings,
    icon: Settings,
  },
];

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
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
  );
}

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <nav
      className={cn("flex flex-col h-full", className)}
      style={{ background: "var(--bg-surface)" }}
    >
      {/* Logo */}
      <div
        className="px-5 py-5 border-b"
        style={{ borderColor: "var(--border-default)" }}
      >
        <Link href={ROUTES.dashboard}>
          <Logo />
        </Link>
      </div>

      {/* Nav */}
      <div className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href ||
            (item.href !== ROUTES.dashboard &&
              pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150",
                "group",
                active
                  ? "text-[var(--accent)] bg-[var(--accent-subtle)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
              )}
            >
              <Icon
                size={16}
                className={cn(
                  "shrink-0 transition-colors",
                  active ? "text-[var(--accent)]" : "text-[var(--text-muted)]"
                )}
              />
              <span className="flex-1">{item.label}</span>
              {active && (
                <ChevronRight
                  size={14}
                  className="text-[var(--accent)] opacity-70"
                />
              )}
            </Link>
          );
        })}
      </div>

      {/* Footer */}
      <div
        className="px-4 py-4 border-t"
        style={{ borderColor: "var(--border-default)" }}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-xs font-semibold"
              style={{ background: "var(--bg-elevated)", color: "var(--accent)" }}
            >
              A
            </div>
            <div className="min-w-0">
              <p
                className="text-xs font-medium truncate"
                style={{ color: "var(--text-primary)" }}
              >
                Admin
              </p>
              <p
                className="text-[11px] truncate"
                style={{ color: "var(--text-muted)" }}
              >
                SIH Demo
              </p>
            </div>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              title="Sign out"
              className="p-1.5 rounded-md hover:bg-[var(--bg-hover)] transition-colors shrink-0"
            >
              <LogOut size={14} style={{ color: "var(--text-muted)" }} />
            </button>
          </form>
        </div>
      </div>
    </nav>
  );
}

export function MobileSidebarToggle() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden p-2 rounded-lg hover:bg-[var(--bg-surface)] transition-colors"
        aria-label="Open navigation"
      >
        <Menu size={18} style={{ color: "var(--text-primary)" }} />
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          "fixed top-0 left-0 h-full w-60 z-50 lg:hidden transition-transform duration-300",
          open ? "translate-x-0" : "-translate-x-full"
        )}
        style={{
          background: "var(--bg-surface)",
          borderRight: "1px solid var(--border-subtle)",
        }}
      >
        <div className="absolute top-4 right-4">
          <button
            onClick={() => setOpen(false)}
            className="p-1 rounded hover:bg-[var(--bg-elevated)] transition-colors"
            aria-label="Close navigation"
          >
            <X size={16} style={{ color: "var(--text-secondary)" }} />
          </button>
        </div>
        <Sidebar />
      </div>
    </>
  );
}
