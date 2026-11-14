import { Skeleton } from '@/components/ui/skeleton'
import { FormSkeleton } from './profile-form-skeleton'

const TABS = ['Geral', 'Segurança', 'Perfil público']

export function SettingsSkeleton() {
  return (
    <div className="max-w-4xl space-y-5">
      <div className="flex gap-1 border-b border-border">
        {TABS.map((label, index) => (
          <span
            key={label}
            className={
              'flex min-h-11 items-center border-b-2 px-3 text-xs sm:px-4 ' +
              (index === 0 ? 'border-foreground' : 'border-transparent text-muted-foreground')
            }
          >
            {label}
          </span>
        ))}
      </div>
      <section className="rounded-xl border border-border bg-card p-5 sm:p-8">
        <h2 className="text-2xl font-bold">Sua conta</h2>
        <div className="mt-6 grid gap-5 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">Nome da conta</p>
            <Skeleton className="mt-2 h-4 w-28" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">E-mail</p>
            <Skeleton className="mt-2 h-4 w-44" />
          </div>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Alteração de nome e e-mail da conta ainda não está disponível.
        </p>
        <div className="mt-8 mb-6 border-t border-border pt-6">
          <Skeleton className="h-6 w-32" />
        </div>
        <FormSkeleton />
      </section>
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">Plano</h2>
        <Skeleton className="mt-3 mb-4 h-4 w-72 max-w-full" />
        <Skeleton className="h-9 w-40 rounded-[10px]" />
      </section>
      <section className="rounded-xl border border-destructive/40 bg-card p-6">
        <h2 className="text-lg font-semibold">Excluir sua conta Lynko</h2>
        <Skeleton className="mt-3 h-4 w-full max-w-xl" />
        <Skeleton className="mt-2 mb-4 h-4 w-1/2" />
        <Skeleton className="h-11 w-36 rounded-[10px]" />
      </section>
    </div>
  )
}
