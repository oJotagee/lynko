'use client'

import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { getSubscription } from '../../_data-access/get-subscription'
import { startCheckout } from '../_actions/start-checkout'
import { getPlans } from '../_data-access/get-plans'
import { type Cycle, CycleToggle } from './cycle-toggle'
import { FreePlanCard, ProPlanCard } from './plan-cards'
import { PlanComparison } from './plan-comparison'
import { formatDate, formatPrice } from './plan-format'

export function Plans() {
  const [cycle, setCycle] = useState<Cycle>('annually')

  const plans = useQuery({ queryKey: ['plans'], queryFn: () => getPlans() })

  const subscription = useQuery({ queryKey: ['subscription'], queryFn: () => getSubscription() })

  const checkout = useMutation({
    mutationFn: (selected: Cycle) => startCheckout(selected),
    onSuccess: (response) => {
      if (response.data) {
        window.location.assign(response.data.url)

        return
      }

      toast.error(response.error)
    },
  })

  const monthly = plans.data?.find((plan) => plan.cycle === 'monthly')

  const annual = plans.data?.find((plan) => plan.cycle === 'annually')

  const savingPercent =
    monthly && annual ? Math.round((1 - annual.amount / (monthly.amount * 12)) * 100) : 0

  const price =
    cycle === 'annually' && annual
      ? {
          value: formatPrice(Math.round(annual.amount / 12), annual.currency),
          note: 'por mês',
          sub: `${formatPrice(annual.amount, annual.currency)} cobrados por ano`,
        }
      : cycle === 'monthly' && monthly
        ? { value: formatPrice(monthly.amount, monthly.currency), note: 'por mês' }
        : null

  const isPro = subscription.data ? subscription.data.plan === 'pro' : null

  const accessUntil =
    subscription.data?.status !== 'active' && subscription.data?.accessUntil
      ? formatDate(subscription.data.accessUntil)
      : null

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-xl">
          <h2 className="text-2xl leading-tight font-bold tracking-tight sm:text-3xl">
            Um plano simples para
            <span className="block text-accent">onde você quiser chegar.</span>
          </h2>
          <p className="mt-4 text-sm text-muted-foreground">
            Comece com tudo o que precisa. Assine o Pro quando quiser mais dados e uma página só
            sua.
          </p>
        </div>
        <CycleToggle value={cycle} onChange={setCycle} savingPercent={savingPercent} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FreePlanCard current={isPro === null ? null : !isPro} />
        <ProPlanCard
          price={price}
          priceError={
            plans.isError ? (
              <div role="alert" className="flex flex-wrap items-center gap-3">
                <p className="text-sm">Não foi possível carregar os preços.</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-sidebar-border bg-transparent text-sidebar-foreground"
                  onClick={() => plans.refetch()}
                >
                  Tentar novamente
                </Button>
              </div>
            ) : null
          }
          current={isPro}
          pending={checkout.isPending}
          accessUntil={accessUntil}
          onSubscribe={() => checkout.mutate(cycle)}
        />
      </div>

      <PlanComparison />

      <p className="text-xs text-muted-foreground">
        O pagamento é feito na AbacatePay. O Pro é liberado assim que o pagamento é confirmado, e dá
        para cancelar quando quiser.
      </p>
    </div>
  )
}
