import type { SocialPlatform } from '@/app/[locale]/_components/social-links/social-link-schema'
import { socialPlatforms } from '@/app/[locale]/_components/social-links/social-platforms'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { AnalyticsSocialItem } from '../_data-access/get-analytics-social'
import { ShareBar } from './share-bar'

const percent = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 })

export function SocialPerformance({ items }: { items: AnalyticsSocialItem[] }) {
  return (
    <Card>
      <CardHeader>
        <p className="text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
          Desempenho das redes
        </p>
        <CardTitle className="text-lg">Redes sociais</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum clique em redes neste período.</p>
        ) : (
          <ol>
            {items.map((item, index) => {
              const platform = socialPlatforms[item.platform as SocialPlatform]

              const Icon = platform?.icon

              const name = platform?.name ?? item.platform

              return (
                <li
                  key={item.platform}
                  className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-border py-3 first:border-t-0"
                >
                  <span className="w-6 text-xs text-muted-foreground tabular-nums">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
                    {Icon && <Icon className="size-4" aria-hidden="true" />}
                  </span>
                  <p className="min-w-0 flex-1 truncate text-sm font-semibold">{name}</p>
                  <span className="text-sm font-semibold tabular-nums">{item.clicks} cliques</span>
                  <ShareBar
                    share={item.share}
                    index={index}
                    label={`${name}: ${item.share}% dos cliques`}
                    className="order-last basis-full sm:order-none sm:basis-28"
                  />
                  <span className="w-10 text-right text-sm font-semibold tabular-nums">
                    {percent.format(item.share)}%
                  </span>
                </li>
              )
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}
