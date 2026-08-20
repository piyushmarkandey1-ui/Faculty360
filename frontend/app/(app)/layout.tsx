import { Sidebar, MobileSidebarToggle } from '@/components/layout/Sidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden lg:flex w-60 flex-col fixed inset-y-0 z-40" style={{background:'var(--bg-surface)', borderRight:'1px solid var(--border-subtle)'}}>
        <Sidebar />
      </aside>
      <main className="flex-1 lg:ml-60 min-h-screen flex flex-col" style={{background:'var(--bg-base)'}}>
        <div className="lg:hidden p-4 border-b flex items-center" style={{borderColor: 'var(--border-subtle)'}}>
          <MobileSidebarToggle />
        </div>
        {children}
      </main>
    </div>
  )
}
