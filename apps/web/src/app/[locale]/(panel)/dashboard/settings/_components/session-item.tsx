'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, Monitor, Smartphone } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { revokeSession } from '../../_actions/revoke-session'
import { portalTheme } from '../../_components/portal-theme'
import type { ApiSession } from '../../_data-access/get-sessions'

const MOBILE_SYSTEMS = new Set(['iOS', 'Android'])

const dateFormat = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' })

const relativeFormat = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' })

export function getDeviceName({ browser, os }: Pick<ApiSession, 'browser' | 'os'>) {
  if (browser && os) return `${browser} no ${os}`

  return browser ?? os ?? 'Dispositivo desconhecido'
}

export function formatLastActive(lastActiveAt: string, now = Date.now()) {
  const minutes = Math.round((now - new Date(lastActiveAt).getTime()) / 60_000)

  if (minutes < 2) return 'ativo agora'

  if (minutes < 60) return `ativo ${relativeFormat.format(-minutes, 'minute')}`

  if (minutes < 60 * 24) return `ativo ${relativeFormat.format(-Math.round(minutes / 60), 'hour')}`

  return `ativo ${relativeFormat.format(-Math.round(minutes / (60 * 24)), 'day')}`
}

export function SessionItem({ session }: { session: ApiSession }) {
  const queryClient = useQueryClient()

  const [open, setOpen] = useState(false)

  const name = getDeviceName(session)

  const Icon = session.os && MOBILE_SYSTEMS.has(session.os) ? Smartphone : Monitor

  const { mutate, isPending } = useMutation({
    mutationFn: () => revokeSession(session.id),
    onSuccess: (response) => {
      if (response.error) toast.error(response.error)
      else toast.success('Dispositivo desconectado')

      void queryClient.invalidateQueries({ queryKey: ['sessions'] })
    },
  })

  return (
    <li className="flex items-center gap-4 py-4">
      <Icon className="size-5 shrink-0 text-muted-foreground" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
          {name}
          {session.current && <Badge variant="secondary">Este dispositivo</Badge>}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Entrou em {dateFormat.format(new Date(session.createdAt))} ·{' '}
          {session.current ? 'ativo agora' : formatLastActive(session.lastActiveAt)}
        </p>
      </div>
      {!session.current && (
        <AlertDialog open={open} onOpenChange={setOpen}>
          <AlertDialogTrigger
            render={<Button variant="outline" size="sm" disabled={isPending} />}
            aria-label={`Desconectar ${name}`}
          >
            {isPending && <Loader2 className="animate-spin motion-reduce:animate-none" />}
            Desconectar
          </AlertDialogTrigger>
          <AlertDialogContent className={portalTheme}>
            <AlertDialogHeader>
              <AlertDialogTitle>Desconectar {name}?</AlertDialogTitle>
              <AlertDialogDescription>
                Este dispositivo sai da sua conta no próximo acesso e precisa entrar de novo.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={() => {
                  setOpen(false)

                  mutate()
                }}
              >
                Desconectar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </li>
  )
}
