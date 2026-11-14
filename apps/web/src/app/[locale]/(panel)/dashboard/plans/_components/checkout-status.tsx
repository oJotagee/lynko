'use client'

import { useQuery } from '@tanstack/react-query'
import { CircleCheck, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import { getSubscription } from '../../_data-access/get-subscription'

const POLL_MS = 3000

const MAX_WAIT_MS = 60_000

export function CheckoutStatus() {
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), MAX_WAIT_MS)

    return () => clearTimeout(timer)
  }, [])

  const subscription = useQuery({
    queryKey: ['subscription'],
    queryFn: () => getSubscription(),
    refetchInterval: (query) => (query.state.data?.plan === 'pro' || timedOut ? false : POLL_MS),
  })

  const isPro = subscription.data?.plan === 'pro'

  if (subscription.isError) {
    return (
      <section role="alert" className="max-w-xl rounded-xl border border-border bg-card p-6 sm:p-8">
        <h2 className="text-2xl font-bold">Não foi possível conferir seu plano</h2>
        <p className="mt-3 text-sm text-muted-foreground">
          Seu pagamento não foi afetado. Tente de novo em instantes.
        </p>
        <Button className="mt-6 min-h-11" variant="outline" onClick={() => subscription.refetch()}>
          Tentar novamente
        </Button>
      </section>
    )
  }

  return (
    <section
      aria-live="polite"
      className="max-w-xl rounded-xl border border-border bg-card p-6 sm:p-8"
    >
      {isPro ? (
        <>
          <CircleCheck className="size-8" aria-hidden />
          <h2 className="mt-4 text-2xl font-bold">Seu Pro está ativo</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Já dá para ver 90 dias de Analytics e esconder a marca Lynko em Aparência.
          </p>
          <Link href="/dashboard" className={buttonVariants({ className: 'mt-6 min-h-11 px-5' })}>
            Ir para o dashboard
          </Link>
        </>
      ) : (
        <>
          {!timedOut && (
            <Loader2 className="size-8 animate-spin motion-reduce:animate-none" aria-hidden />
          )}
          <h2 className="mt-4 text-2xl font-bold">
            {timedOut ? 'Seu pagamento ainda está sendo confirmado' : 'Confirmando seu pagamento…'}
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            {timedOut
              ? 'Pode levar alguns minutos. Avisamos por e-mail quando o Pro estiver ativo.'
              : 'Isso costuma levar poucos segundos.'}
          </p>
          {timedOut && (
            <Link
              href="/dashboard/plans"
              className={buttonVariants({ variant: 'outline', className: 'mt-6 min-h-11' })}
            >
              Voltar para Planos
            </Link>
          )}
        </>
      )}
    </section>
  )
}
