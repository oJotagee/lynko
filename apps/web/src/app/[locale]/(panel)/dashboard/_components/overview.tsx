import { ArrowRight, EyeOff, Plus } from 'lucide-react'

import { LinkIcon } from './link-icon'
import { buttonVariants } from '@/components/ui/button'
import type { DashboardData } from './dashboard-data'
import { DashboardMascot } from './dashboard-mascot'
import { ProfilePreview } from './profile-preview'
import { Link } from '@/i18n/navigation'

export function Overview({ data, hasPage }: { data: DashboardData; hasPage: boolean }) {
  return (
    <div className="space-y-6">
      <section className="relative isolate flex min-h-56 items-center overflow-hidden rounded-2xl border border-foreground/40 bg-accent px-6 py-8 text-accent-foreground sm:px-9">
        <div className="relative z-10 max-w-xl pr-10 sm:pr-28">
          <h2 className="text-3xl leading-tight font-bold tracking-tight sm:text-4xl">
            Seu mundo merece
            <br />
            ser encontrado.
          </h2>
          <p className="mt-4 max-w-sm text-sm leading-relaxed">
            Seu próximo projeto, uma boa conversa, uma nova conexão. Tudo começa com um link.
          </p>
          <Link
            href={hasPage ? '/dashboard/links?new=1' : '/dashboard/settings'}
            className={buttonVariants({
              variant: 'outline',
              className: 'mt-6 min-h-11 bg-card px-4 text-foreground',
            })}
          >
            {hasPage ? 'Adicionar um link' : 'Criar minha página'}
            <Plus className="ml-2 size-4" />
          </Link>
        </div>
        <DashboardMascot className="absolute -right-9 -bottom-4 w-40 sm:right-5 sm:w-56 lg:w-64" />
      </section>
      <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-border bg-card">
        <section className="p-6">
          <h2 className="text-xs text-muted-foreground">Links cadastrados</h2>
          <p className="mt-4 text-3xl font-bold">{data.links.length}</p>
        </section>
        <section className="border-l border-border p-6">
          <h2 className="text-xs text-muted-foreground">Links ativos</h2>
          <p className="mt-4 text-3xl font-bold">
            {data.links.filter((link) => link.active).length}
          </p>
        </section>
      </div>
      <div className="grid items-start gap-5 xl:grid-cols-[1.5fr_1fr]">
        <section className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Seus links</h2>
            <Link href="/dashboard/links" className="text-xs underline-offset-4 hover:underline">
              Gerenciar
            </Link>
          </div>
          {data.links.length ? (
            <ul className="mt-4">
              {data.links.slice(0, 5).map((link) => (
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
          <div className="mt-5 border-t border-border pt-5">
            <h3 className="text-sm font-semibold">Métricas de acesso</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Visualizações, cliques e taxa de cliques ainda não estão disponíveis na API.
            </p>
            <Link
              href="/dashboard/analytics"
              className="mt-3 inline-flex items-center gap-2 text-sm hover:underline"
            >
              Ver analytics <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>
        <aside className="rounded-xl bg-muted p-6">
          <h2 className="mb-5 text-center text-xs text-muted-foreground">Prévia da sua página</h2>
          <ProfilePreview data={data} />
          <Link
            href="/dashboard/appearance"
            className={buttonVariants({ variant: 'outline', className: 'mt-6 flex min-h-11' })}
          >
            Editar aparência <ArrowRight className="ml-2 size-4" />
          </Link>
        </aside>
      </div>
    </div>
  )
}
