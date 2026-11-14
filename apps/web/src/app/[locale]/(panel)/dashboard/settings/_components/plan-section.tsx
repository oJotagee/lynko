'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Link } from '@/i18n/navigation'
import { cancelSubscription } from '../../_actions/cancel-subscription'
import { portalTheme } from '../../_components/portal-theme'
import { type ApiSubscription, getSubscription } from '../../_data-access/get-subscription'
import { formatDate } from '../../plans/_components/plan-format'

const CYCLES = { monthly: 'mensal', annually: 'anual' }

function describe(subscription: ApiSubscription) {
  if (subscription.plan === 'free') return 'Você está no plano grátis.'

  const cycle = subscription.cycle ? ` ${CYCLES[subscription.cycle]}` : ''

  if (subscription.status === 'active' && subscription.currentPeriodEnd) {
    return `Pro${cycle}. A próxima cobrança é em ${formatDate(subscription.currentPeriodEnd)}.`
  }

  return subscription.accessUntil
    ? `Assinatura cancelada. Seu Pro termina em ${formatDate(subscription.accessUntil)}.`
    : 'Assinatura cancelada.'
}

export function PlanSection() {
  const queryClient = useQueryClient()

  const [open, setOpen] = useState(false)

  const subscription = useQuery({ queryKey: ['subscription'], queryFn: () => getSubscription() })

  const cancel = useMutation({
    mutationFn: () => cancelSubscription(),
    onSuccess: (response) => {
      if (response.error) {
        toast.error(response.error)

        return
      }

      toast.success('Assinatura cancelada')

      void queryClient.invalidateQueries({ queryKey: ['subscription'] })
    },
  })

  const data = subscription.data

  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <h2 className="flex items-center gap-3 text-lg font-semibold">
        Plano
        {data?.plan === 'pro' && <Badge variant="secondary">Pro</Badge>}
      </h2>
      {subscription.isPending && <Skeleton className="mt-3 h-4 w-72 max-w-full" />}
      {subscription.isError && (
        <div role="alert" className="mt-3 flex flex-wrap items-center gap-3">
          <p className="text-sm text-destructive">Não foi possível carregar seu plano.</p>
          <Button variant="outline" size="sm" onClick={() => subscription.refetch()}>
            Tentar novamente
          </Button>
        </div>
      )}
      {data && (
        <>
          <p className="mt-2 mb-4 text-sm text-muted-foreground">{describe(data)}</p>
          {data.status === 'active' ? (
            <AlertDialog open={open} onOpenChange={setOpen}>
              <AlertDialogTrigger render={<Button variant="outline" disabled={cancel.isPending} />}>
                {cancel.isPending && (
                  <Loader2 className="animate-spin motion-reduce:animate-none" />
                )}
                Cancelar assinatura
              </AlertDialogTrigger>
              <AlertDialogContent className={portalTheme}>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancelar a assinatura Pro?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Não haverá novas cobranças. Você continua com o Pro até o fim do período já pago
                    e depois volta ao grátis, sem perder nenhum dado.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Manter o Pro</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    onClick={() => {
                      setOpen(false)

                      cancel.mutate()
                    }}
                  >
                    Cancelar assinatura
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <Link href="/dashboard/plans" className={buttonVariants({ variant: 'outline' })}>
              {data.plan === 'pro' ? 'Ver planos' : 'Ver o Pro'}
            </Link>
          )}
        </>
      )}
    </section>
  )
}
