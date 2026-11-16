'use client'

import { useQuery } from '@tanstack/react-query'
import { Lock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Link } from '@/i18n/navigation'
import { getDomain } from '../../_data-access/get-domain'
import { DomainConnectForm } from './domain-connect-form'
import { DomainDetails } from './domain-details'
import { DomainPaused } from './domain-paused'

const POLL_MS = 15_000

function ProLock() {
  return (
    <div className="mt-6 flex flex-wrap items-center gap-4">
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Lock className="size-4" aria-hidden />
        Domínio próprio é um recurso do Pro.
      </p>
      <Link href="/dashboard/plans" className={buttonVariants({ variant: 'outline' })}>
        Ver o Pro
      </Link>
    </div>
  )
}

function DomainContent({ isPro }: { isPro: boolean }) {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ['domain'],
    queryFn: () => getDomain(),
    refetchInterval: (query) => {
      const status = query.state.data?.status

      return isPro && (status === 'pending_owner' || status === 'pending_dns') ? POLL_MS : false
    },
  })

  if (isPending) {
    return (
      <div className="mt-6 space-y-3" aria-busy="true">
        <span className="sr-only">Carregando domínio…</span>
        <Skeleton className="h-11 w-full max-w-xl" />
        <Skeleton className="h-4 w-64 max-w-full" />
      </div>
    )
  }

  if (isError) {
    return (
      <div role="alert" className="mt-6 flex flex-wrap items-center gap-3">
        <p className="text-sm text-destructive">Não foi possível carregar seu domínio.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Tentar novamente
        </Button>
      </div>
    )
  }

  if (!data && !isPro) return <ProLock />

  if (!data) {
    return (
      <div className="mt-6">
        <DomainConnectForm />
      </div>
    )
  }

  return (
    <div className="mt-6">
      {isPro ? <DomainDetails domain={data} /> : <DomainPaused domain={data} />}
    </div>
  )
}

export function DomainSection({ isPro, hasPage }: { isPro: boolean; hasPage: boolean }) {
  return (
    <section className="rounded-xl border border-border bg-card p-6 sm:p-8">
      <h2 className="flex items-center gap-3 text-2xl font-bold">
        Domínio próprio
        <Badge variant="secondary">Pro</Badge>
      </h2>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
        Abra sua página no seu endereço, como seunome.com. O QR code e o link copiado passam a usar
        o domínio.
      </p>
      {!hasPage && !isPro && <ProLock />}
      {!hasPage && isPro && (
        <p className="mt-6 text-sm text-muted-foreground">
          Crie sua página em Geral antes de ligar um domínio.
        </p>
      )}
      {hasPage && <DomainContent isPro={isPro} />}
    </section>
  )
}
