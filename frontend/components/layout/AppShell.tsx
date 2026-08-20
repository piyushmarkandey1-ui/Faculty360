import { Sidebar, MobileSidebarToggle } from "@/components/layout/Sidebar";

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  actions?: React.ReactNode;
}

export function AppShell({ children, title, description, actions }: AppShellProps) {
  return (
    <div className="app-shell">
      {/* Fixed sidebar */}
      <aside className="app-sidebar hidden lg:flex flex-col">
        <Sidebar />
      </aside>

      {/* Main content */}
      <main className="app-main flex flex-col">
        {/* Page header */}
        {(title || actions) && (
          <header
            className="sticky top-0 z-30 px-6 py-4 flex items-center gap-4 border-b"
            style={{
              background: "var(--bg-base)",
              borderColor: "var(--border-subtle)",
            }}
          >
            <MobileSidebarToggle />
            <div className="flex-1 min-w-0">
              {title && (
                <h1
                  className="text-h2 truncate"
                  style={{ color: "var(--text-primary)" }}
                >
                  {title}
                </h1>
              )}
              {description && (
                <p
                  className="text-sm mt-0.5 truncate"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {description}
                </p>
              )}
            </div>
            {actions && <div className="flex items-center gap-3">{actions}</div>}
          </header>
        )}

        {/* Page content */}
        <div className="flex-1 p-6">{children}</div>
      </main>
    </div>
  );
}
