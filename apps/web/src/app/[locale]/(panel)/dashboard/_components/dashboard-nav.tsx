'use client'

import { ArrowRight, ChartNoAxesColumn, House, Link2, Moon, Settings } from 'lucide-react'
import { Link, usePathname } from '@/i18n/navigation'

import { LynkoLogo } from '../../../(public)/_components/lynko-logo'
import { DashboardMascot } from './dashboard-mascot'
import { LogoutButton } from './logout-button'

export const dashboardRoutes = [
  { href: '/dashboard', label: 'Visão geral', icon: House },
  { href: '/dashboard/links', label: 'Meus links', icon: Link2 },
  { href: '/dashboard/appearance', label: 'Aparência', icon: Moon },
  { href: '/dashboard/analytics', label: 'Analytics', icon: ChartNoAxesColumn },
  { href: '/dashboard/settings', label: 'Configurações', icon: Settings },
]

interface DashboardNavProps {
  account: React.ReactNode
  linksBadge: React.ReactNode
  onNavigate?: () => void
}

export function DashboardNav({ account, linksBadge, onNavigate }: DashboardNavProps) {
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col gap-5 overflow-y-auto bg-sidebar p-4 text-sidebar-foreground [&>*]:shrink-0">
      <LynkoLogo className="flex h-12 items-center gap-2 px-3 text-2xl tracking-tight" />
      <nav aria-label="Dashboard" className="space-y-1">
        {dashboardRoutes.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={pathname === href ? 'page' : undefined}
            className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm transition-colors hover:bg-sidebar-accent focus-visible:outline-2 focus-visible:outline-accent ${pathname === href ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/70'}`}
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}
            {href.endsWith('/links') && linksBadge}
          </Link>
        ))}
      </nav>
      <div className="mt-auto rounded-xl border border-sidebar-border bg-sidebar-accent/50 p-4 [@media(max-height:760px)]:hidden">
        <div className="flex items-start justify-between gap-2">
          <p className="pt-2 text-sm font-semibold">Do seu jeito</p>
          <DashboardMascot className="w-16" />
        </div>
        <p className="mt-3 text-xs leading-relaxed text-sidebar-foreground/70">
          Um novo tema, uma página com a sua cara.
        </p>
        <Link
          href="/dashboard/appearance"
          onClick={onNavigate}
          className="mt-2 inline-flex min-h-8 items-center gap-2 text-xs text-chart-2 hover:underline"
        >
          Personalizar <ArrowRight className="size-3" />
        </Link>
      </div>
      <Link
        href="/dashboard/settings"
        onClick={onNavigate}
        className="mt-auto flex min-w-0 items-center gap-3 border-t border-sidebar-border px-2 pt-5 pb-2 hover:opacity-80"
      >
        {account}
        <Settings className="ml-auto size-4 shrink-0" />
      </Link>
      <LogoutButton />
    </div>
  )
}
