'use client'

import { AlertTriangle, Loader2 } from 'lucide-react'
import { useEffect } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { useRouter } from '@/i18n/navigation'
import { SESSION_EXPIRED_DIGEST } from '@/lib/session-expired'
import { logout } from './_actions/logout'

interface DashboardErrorProps {
  error: Error & { digest?: string }
  retry: () => void
}

export default function DashboardError({ error, retry }: DashboardErrorProps) {
  const router = useRouter()

  const sessionExpired = error.digest === SESSION_EXPIRED_DIGEST

  useEffect(() => {
    if (!sessionExpired) return

    void logout().then((response) => {
      if (response.error) {
        toast.error(response.error)

        return
      }

      router.replace('/login')
      router.refresh()
    })
  }, [sessionExpired, router])

  if (sessionExpired)
    return (
      <main
        role="status"
        className="flex flex-col items-center justify-center gap-4 px-8 py-24 text-center"
      >
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
        <h1 className="text-xl font-semibold">Sua sessão expirou</h1>
        <p className="max-w-md text-sm text-muted-foreground">Levando você para o login…</p>
      </main>
    )

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
