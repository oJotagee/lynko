import type { ReactNode } from 'react'
import { DashboardMascot } from '../layout/dashboard-mascot'

export function OverviewHero({ action }: { action: ReactNode }) {
  return (
    <section className="relative isolate flex min-h-56 items-center overflow-hidden rounded-2xl border border-foreground/40 bg-accent px-6 py-8 text-accent-foreground sm:px-9">
      <div className="relative z-10 max-w-xl pr-10 sm:pr-28">
        <h2 className="text-3xl leading-tight font-bold tracking-tight sm:text-4xl">
          Seu mundo merece
          <br />
          ser encontrado.
        </h2>
        <p className="mt-4 max-w-sm text-sm leading-relaxed">
          Seu próximo projeto, uma boa conversa, uma nova conexão. Tudo começa com um link.
        </p>
        {action}
      </div>
      <DashboardMascot className="absolute -right-9 -bottom-4 w-40 sm:right-5 sm:w-56 lg:w-64" />
    </section>
  )
}
