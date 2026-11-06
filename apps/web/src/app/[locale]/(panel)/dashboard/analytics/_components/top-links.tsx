import { LinkIcon } from '@/app/[locale]/_components/link-icon'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { AnalyticsTopLink } from '../_data-access/get-analytics-links'
import { ShareBar } from './share-bar'

const percent = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 })

function displayHost(url: string | null) {
  if (!url) return ''

  try {
    return new URL(url).host
  } catch {
    return url
  }
}

export function TopLinks({ links }: { links: AnalyticsTopLink[] }) {
  return (
    <Card>
      <CardHeader>
        <p className="text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
          Desempenho dos links
        </p>
        <CardTitle className="text-lg">Mais clicados</CardTitle>
      </CardHeader>
      <CardContent>
        {links.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum clique em links neste período.</p>
        ) : (
          <ol>
            {links.map((link, index) => (
              <li
                key={link.linkId}
                className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-border py-3 first:border-t-0"
              >
                <span className="w-6 text-xs text-muted-foreground tabular-nums">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <LinkIcon
                  url={link.url ?? ''}
                  className="size-9 bg-secondary"
                  iconClassName="size-4"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{link.title ?? 'Link removido'}</p>
                  <p className="truncate text-xs text-muted-foreground">{displayHost(link.url)}</p>
                </div>
                <span className="text-sm font-semibold tabular-nums">{link.clicks} cliques</span>
                <ShareBar
                  share={link.share}
                  index={index}
                  label={`${link.title ?? 'Link removido'}: ${link.share}% dos cliques`}
                  className="order-last basis-full sm:order-none sm:basis-28"
                />
                <span className="w-10 text-right text-sm font-semibold tabular-nums">
                  {percent.format(link.share)}%
                </span>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}
