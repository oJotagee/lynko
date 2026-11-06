import { EyeOff } from 'lucide-react'
import { LinkIcon } from '@/app/[locale]/_components/link-icon'
import { Link } from '@/i18n/navigation'
import type { DashboardLink } from '../dashboard-data'

export function YourLinks({ links }: { links: DashboardLink[] }) {
  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Seus links</h2>
        <Link href="/dashboard/links" className="text-xs underline-offset-4 hover:underline">
          Gerenciar
        </Link>
      </div>
      {links.length ? (
        <ul className="mt-4">
          {links.slice(0, 5).map((link) => (
            <li key={link.id} className="flex items-center gap-3 border-t border-border py-4">
              <LinkIcon url={link.url} className="size-9 bg-secondary" iconClassName="size-4" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{link.title}</p>
                <p className="truncate text-xs text-muted-foreground">{link.url}</p>
              </div>
              {!link.active && (
                <EyeOff aria-label="Link oculto" className="size-4 text-muted-foreground" />
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-10 text-sm text-muted-foreground">
          Adicione seu primeiro link para começar.
        </p>
      )}
    </section>
  )
}
