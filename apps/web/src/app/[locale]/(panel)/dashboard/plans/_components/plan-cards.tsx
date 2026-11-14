import { ArrowRight, Check, Loader2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'
import { DashboardMascot } from '../../_components/layout/dashboard-mascot'
import { FREE_FEATURES, PRO_FEATURES } from './plan-copy'

function CurrentPlanBadge({ dark }: { dark?: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs',
        dark ? 'bg-chart-2/20 text-chart-2' : 'bg-secondary text-secondary-foreground',
      )}
    >
      <Check className="size-3.5" aria-hidden />
      Plano atual
    </span>
  )
}

function FeatureList({ items, dark }: { items: string[]; dark?: boolean }) {
  return (
    <ul
      className={cn(
        'mt-6 space-y-3 border-t pt-6 text-sm',
        dark ? 'border-sidebar-border' : 'border-border',
      )}
    >
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3">
          <Check className={cn('mt-0.5 size-4 shrink-0', dark && 'text-chart-2')} aria-hidden />
          {item}
        </li>
      ))}
    </ul>
  )
}

function Price({
  value,
  note,
  sub,
  dark,
}: {
  value: ReactNode
  note: string
  sub?: string
  dark?: boolean
}) {
  return (
    <div className="mt-6 flex items-end gap-3">
      <p className="text-3xl font-bold tabular-nums">{value}</p>
      <p
        className={cn(
          'pb-1 text-sm',
          dark ? 'text-sidebar-foreground/60' : 'text-muted-foreground',
        )}
      >
        {note}
        {sub && <span className="block text-xs">{sub}</span>}
      </p>
    </div>
  )
}

interface FreePlanCardProps {
  current: boolean | null
}

export function FreePlanCard({ current }: FreePlanCardProps) {
  return (
    <section
      aria-labelledby="free-plan"
      className="flex flex-col rounded-2xl border border-border bg-card p-6 sm:p-8"
    >
      <div className="flex items-start justify-between gap-3">
        <p id="free-plan" className="text-xs font-semibold tracking-[0.16em]">
          GRÁTIS
        </p>
        {current && <CurrentPlanBadge />}
      </div>
      <h3 className="mt-3 text-lg font-semibold">Para começar.</h3>
      <Price value="R$ 0" note="para sempre" />
      <p className="mt-6 text-sm text-muted-foreground">
        Uma página bonita e o essencial para reunir seu mundo online.
      </p>
      <div className="mt-8">
        {current === null ? (
          <Skeleton className="h-12 w-full rounded-[10px]" />
        ) : (
          current && (
            <p className="flex min-h-12 items-center justify-center rounded-[10px] border border-border bg-muted text-sm text-muted-foreground">
              Seu plano atual
            </p>
          )
        )}
      </div>
      <FeatureList items={FREE_FEATURES} />
    </section>
  )
}

interface ProPlanCardProps {
  price: { value: string; note: string; sub?: string } | null
  priceError: ReactNode
  current: boolean | null
  pending: boolean
  accessUntil: string | null
  onSubscribe: () => void
}

export function ProPlanCard({
  price,
  priceError,
  current,
  pending,
  accessUntil,
  onSubscribe,
}: ProPlanCardProps) {
  return (
    <section
      aria-labelledby="pro-plan"
      className="relative flex flex-col overflow-hidden rounded-2xl bg-sidebar p-6 text-sidebar-foreground sm:p-8"
    >
      <DashboardMascot className="absolute top-4 right-4 w-16 sm:w-20" />
      <div className="flex items-start gap-3 pr-24">
        <p id="pro-plan" className="text-xs font-semibold tracking-[0.16em]">
          PRO
        </p>
        {current && <CurrentPlanBadge dark />}
      </div>
      <h3 className="mt-3 text-lg font-semibold">Para fazer seu mundo crescer.</h3>
      {price ? (
        <Price value={price.value} note={price.note} sub={price.sub} dark />
      ) : (
        <div className="mt-6">
          {priceError ?? <Skeleton className="h-9 w-40 bg-sidebar-accent" />}
        </div>
      )}
      <p className="mt-6 text-sm text-sidebar-foreground/60">
        Mais dados sobre seu público e uma página só sua, sem a nossa marca.
      </p>
      <div className="mt-8">
        {current === null && <Skeleton className="h-12 w-full rounded-[10px] bg-sidebar-accent" />}
        {current === false && (
          <Button
            className="min-h-12 w-full bg-chart-2 text-foreground hover:bg-chart-2/90"
            disabled={!price || pending}
            onClick={onSubscribe}
          >
            {pending ? <Loader2 className="animate-spin motion-reduce:animate-none" /> : null}
            Assinar o Pro
            {!pending && <ArrowRight className="size-4" aria-hidden />}
          </Button>
        )}
        {current && (
          <div className="space-y-3">
            {accessUntil && <p className="text-sm">Seu Pro vai até {accessUntil}.</p>}
            <Link
              href="/dashboard/settings"
              className={buttonVariants({
                variant: 'outline',
                className:
                  'min-h-12 w-full border-sidebar-border bg-transparent text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground',
              })}
            >
              Gerenciar assinatura
            </Link>
          </div>
        )}
      </div>
      <FeatureList items={PRO_FEATURES} dark />
    </section>
  )
}
