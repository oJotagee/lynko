'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
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
import { Button } from '@/components/ui/button'
import { revokeOtherSessions } from '../../_actions/revoke-other-sessions'
import { portalTheme } from '../../_components/portal-theme'

export function RevokeOtherSessionsButton() {
  const queryClient = useQueryClient()

  const [open, setOpen] = useState(false)

  const { mutate, isPending } = useMutation({
    mutationFn: () => revokeOtherSessions(),
    onSuccess: (response) => {
      if (response.error) toast.error(response.error)
      else toast.success('Os outros dispositivos foram desconectados')

      void queryClient.invalidateQueries({ queryKey: ['sessions'] })
    },
  })

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={<Button variant="outline" disabled={isPending} />}>
        {isPending && <Loader2 className="animate-spin motion-reduce:animate-none" />}
        Sair de todos os outros dispositivos
      </AlertDialogTrigger>
      <AlertDialogContent className={portalTheme}>
        <AlertDialogHeader>
          <AlertDialogTitle>Sair de todos os outros dispositivos?</AlertDialogTitle>
          <AlertDialogDescription>
            Todos os dispositivos, menos este, saem da sua conta no próximo acesso e precisam entrar
            de novo.
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
            Sair dos outros
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
