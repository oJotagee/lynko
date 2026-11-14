import { Skeleton } from '@/components/ui/skeleton'
import { PreviewSkeleton } from '../../_components/skeletons/profile-preview-skeleton'

const THEMES = [0, 1, 2, 3]

function ControlRowSkeleton() {
  return (
    <div className="flex items-center justify-between gap-4">
      <Skeleton className="h-4 w-28" />
      <div className="flex items-center gap-3">
        <Skeleton className="h-3 w-14" />
        <Skeleton className="size-11 rounded-[10px]" />
      </div>
    </div>
  )
}

function ChoicesSkeleton({ widths }: { widths: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {widths.map((width) => (
        <Skeleton key={width} className={`h-11 rounded-[10px] ${width}`} />
      ))}
    </div>
  )
}

export function AppearanceSkeleton() {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Veja cada mudança ao vivo. Salve para aplicar à sua página.
        </p>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-11 w-40 rounded-[10px]" />
          <Skeleton className="h-11 w-32 rounded-[10px]" />
          <Skeleton className="h-11 w-40 rounded-[10px]" />
        </div>
      </div>
      <Skeleton className="h-9 w-40 rounded-lg xl:hidden" />
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(310px,0.8fr)]">
        <div className="space-y-8 rounded-xl border border-border bg-card p-6">
          <section>
            <h2 className="mb-4 text-lg font-bold">Escolha seu clima</h2>
            <div className="grid grid-cols-2 gap-3">
              {THEMES.map((theme) => (
                <div key={theme} className="space-y-3 rounded-[10px] border border-border p-3">
                  <Skeleton className="h-20 w-full rounded-lg" />
                  <Skeleton className="h-3 w-16" />
                </div>
              ))}
            </div>
          </section>
          <section className="space-y-4">
            <h2 className="text-base font-semibold">Fundo</h2>
            <ChoicesSkeleton widths={['w-28', 'w-28', 'w-24']} />
            <ControlRowSkeleton />
          </section>
          <section className="space-y-4">
            <h2 className="text-base font-semibold">Tipografia</h2>
            <ChoicesSkeleton widths={['w-24', 'w-28', 'w-20', 'w-24']} />
            <ControlRowSkeleton />
          </section>
          <section className="space-y-4">
            <h2 className="text-base font-semibold">Botões</h2>
            <ChoicesSkeleton widths={['w-24', 'w-28', 'w-20']} />
            <ControlRowSkeleton />
            <ControlRowSkeleton />
          </section>
        </div>
        <aside className="hidden rounded-xl bg-muted p-6 sm:p-10 xl:block">
          <div className="mb-8 flex flex-col items-center gap-3">
            <h2 className="text-xs text-muted-foreground">Prévia ao vivo</h2>
            <Skeleton className="h-11 w-56 rounded-[10px]" />
          </div>
          <PreviewSkeleton />
          <p className="mt-6 text-center text-xs text-muted-foreground">
            As mudanças só são publicadas depois de salvar.
          </p>
        </aside>
      </div>
    </div>
  )
}
