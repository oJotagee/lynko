import { DM_Sans, Manrope } from 'next/font/google'
import { Suspense } from 'react'
import { SidebarProvider } from '@/components/ui/sidebar'
import { DashboardSidebar } from './_components/layout/dashboard-sidebar'
import { LinksBadge } from './_components/layout/links-badge'
import { NavAccount } from './_components/layout/nav-account'

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dashboard-body' })

const manrope = Manrope({ subsets: ['latin'], variable: '--font-dashboard-heading' })

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${dmSans.variable} ${manrope.variable} light scheme-light min-h-svh bg-background text-foreground font-[family-name:var(--font-dashboard-body)] [--background:#f7f6f1] [--foreground:#171716] [--card:#ffffff] [--card-foreground:#171716] [--popover:#ffffff] [--popover-foreground:#171716] [--primary:#171716] [--primary-foreground:#ffffff] [--secondary:#e9ff9e] [--secondary-foreground:#171716] [--muted:#eeede8] [--muted-foreground:#66655f] [--border:#d9d8d1] [--input:#d9d8d1] [--ring:#7462d9] [--accent:#9b8cff] [--accent-foreground:#171716] [--destructive:#b23e24] [--chart-1:#9b8cff] [--chart-2:#b7f34a] [--chart-3:#ff8d6b] [--sidebar:#1c1c1a] [--sidebar-foreground:#f7f6f1] [--sidebar-accent:#31312e] [--sidebar-accent-foreground:#ffffff] [--sidebar-border:#3b3b37] [&_h1]:font-[family-name:var(--font-dashboard-heading)] [&_h2]:font-[family-name:var(--font-dashboard-heading)] [&_h3]:font-[family-name:var(--font-dashboard-heading)] [&_[data-slot=dialog-content]]:scheme-light [&_[data-slot=button]]:cursor-pointer [&_[data-slot=button]]:rounded-[10px] [&_[data-slot=input]]:h-11 [&_[data-slot=input]]:bg-card [&_[data-slot=input]]:dark:bg-card selection:bg-accent/40`}
    >
      <SidebarProvider>
        <DashboardSidebar
          account={
            <Suspense fallback={null}>
              <NavAccount />
            </Suspense>
          }
          linksBadge={
            <Suspense fallback={null}>
              <LinksBadge />
            </Suspense>
          }
        />
        <div className="min-w-0 flex-1 lg:ml-60">{children}</div>
      </SidebarProvider>
    </div>
  )
}
