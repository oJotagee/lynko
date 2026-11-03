'use client'

import { AlertTriangle } from 'lucide-react'

import { Button } from '@/components/ui/button'

export default function DashboardError({ retry }: { retry: () => void }) {
  return (
    <main className="flex flex-col items-center justify-center gap-4 px-8 py-24 text-center">
      <AlertTriangle className="size-10 text-destructive" />
      <h1 className="text-xl font-semibold">Não foi possível carregar o dashboard</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Ocorreu um erro ao buscar seus dados. Tente novamente em instantes.
      </p>
      <Button onClick={retry}>Tentar novamente</Button>
    </main>
  )
}
