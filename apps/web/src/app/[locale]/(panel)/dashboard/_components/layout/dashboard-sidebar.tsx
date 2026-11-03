'use client'

import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { useSidebar } from '@/components/ui/sidebar'
import { DashboardNav } from './dashboard-nav'
import { portalTheme } from '../portal-theme'

interface DashboardSidebarProps {
  account: React.ReactNode
  linksBadge: React.ReactNode
}

export function DashboardSidebar({ account, linksBadge }: DashboardSidebarProps) {
  const { openMobile, setOpenMobile } = useSidebar()

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 lg:block">
        <DashboardNav account={account} linksBadge={linksBadge} />
      </aside>
      <Sheet open={openMobile} onOpenChange={setOpenMobile}>
        <SheetContent
          side="left"
          className={`${portalTheme} w-64 gap-0 border-sidebar-border bg-sidebar p-0 text-sidebar-foreground [&>button]:text-sidebar-foreground`}
        >
          <SheetTitle className="sr-only">Navegação do dashboard</SheetTitle>
          <SheetDescription className="sr-only">
            Escolha uma página do Lynko Studio.
          </SheetDescription>
          <DashboardNav
            account={account}
            linksBadge={linksBadge}
            onNavigate={() => setOpenMobile(false)}
          />
        </SheetContent>
      </Sheet>
    </>
  )
}
