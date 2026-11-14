'use client'

import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { getSessions } from '../../_data-access/get-sessions'
import { RevokeOtherSessionsButton } from './revoke-other-sessions-button'
import { SessionItem } from './session-item'

export function SessionsSection() {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => getSessions(),
  })

  const hasOthers = data?.some((session) => !session.current) ?? false

  return (
    <section className="rounded-xl border border-border bg-card p-6 sm:p-8">
      <h2 className="text-2xl font-bold">Dispositivos conectados</h2>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
        Onde sua conta está aberta agora. Se não reconhecer algum, desconecte-o.
      </p>
      {isPending && (
        <div className="mt-6 space-y-3" aria-busy="true">
          <span className="sr-only">Carregando dispositivos…</span>
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      )}
      {isError && (
        <div role="alert" className="mt-6 flex flex-wrap items-center gap-3">
          <p className="text-sm text-destructive">Não foi possível carregar os dispositivos.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Tentar novamente
          </Button>
        </div>
      )}
      {data && (
        <>
          <ul className="mt-4 divide-y divide-border">
            {data.map((session) => (
              <SessionItem key={session.id} session={session} />
            ))}
          </ul>
          {hasOthers ? (
            <div className="mt-4 border-t border-border pt-6">
              <RevokeOtherSessionsButton />
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              Você só está conectado neste dispositivo.
            </p>
          )}
        </>
      )}
    </section>
  )
}
