import type { SocialPlatform } from '@/app/[locale]/_components/social-links/social-link-schema'
import { socialPlatforms } from '@/app/[locale]/_components/social-links/social-platforms'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { AnalyticsSocialItem } from '../_data-access/get-analytics-social'

const percent = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 })

export function SocialPerformance({ items }: { items: AnalyticsSocialItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Redes sociais</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum clique em redes neste período.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {items.map((item) => {
              const platform = socialPlatforms[item.platform as SocialPlatform]

              const Icon = platform?.icon

              return (
                <li key={item.platform} className="flex items-center gap-3 text-sm">
                  {Icon && <Icon className="size-4 shrink-0" aria-hidden="true" />}
                  <span className="min-w-0 flex-1 truncate">{platform?.name ?? item.platform}</span>
                  <span className="tabular-nums">{item.clicks}</span>
                  <span className="w-14 text-right tabular-nums text-muted-foreground">
                    {percent.format(item.share)}%
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
