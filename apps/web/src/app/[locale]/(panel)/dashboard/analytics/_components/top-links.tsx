import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { AnalyticsTopLink } from '../_data-access/get-analytics-links'

const percent = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 })

export function TopLinks({ links }: { links: AnalyticsTopLink[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Links mais clicados</CardTitle>
      </CardHeader>
      <CardContent>
        {links.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum clique em links neste período.</p>
        ) : (
          <ol className="flex flex-col gap-3">
            {links.map((link) => (
              <li key={link.linkId} className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 flex-1 truncate">{link.title ?? 'Link removido'}</span>
                <span className="tabular-nums">{link.clicks}</span>
                <span className="w-14 text-right tabular-nums text-muted-foreground">
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
