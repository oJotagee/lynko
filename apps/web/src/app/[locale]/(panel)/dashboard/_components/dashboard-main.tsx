import { Link } from '@/i18n/navigation'

interface DashboardMainProps {
  hasPage: boolean
  children: React.ReactNode
}

export function DashboardMain({ hasPage, children }: DashboardMainProps) {
  return (
    <main id="dashboard-content" className="mx-auto max-w-[1600px] p-4 sm:p-8 xl:px-12 xl:py-8">
      {!hasPage && (
        <p className="mb-5 rounded-lg border border-border bg-card p-4 text-sm">
          Você ainda não tem uma página.{' '}
          <Link className="font-semibold underline" href="/dashboard/settings">
            Escolha seu nome de usuário para começar.
          </Link>
        </p>
      )}
      {children}
    </main>
  )
}
