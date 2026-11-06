import { Button } from '@/components/ui/button'

export function AnalyticsError({ onRetry }: { onRetry: () => void }) {
  return (
    <section
      role="alert"
      className="rounded-xl border border-border bg-card p-8 text-center sm:p-12"
    >
      <h2 className="text-lg font-semibold">Não foi possível carregar o analytics</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Verifique sua conexão e tente novamente.
      </p>
      <Button className="mt-6" variant="outline" onClick={onRetry}>
        Tentar novamente
      </Button>
    </section>
  )
}
