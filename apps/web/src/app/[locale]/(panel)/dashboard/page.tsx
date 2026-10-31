import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Logado',
  robots: { index: false, follow: false },
}

export default function DashboardPage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background text-foreground">
      <h1 className="text-2xl font-semibold">Logado</h1>
    </main>
  )
}
