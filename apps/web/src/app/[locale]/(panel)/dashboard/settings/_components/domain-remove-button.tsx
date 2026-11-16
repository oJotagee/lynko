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
import { removeDomain } from '../../_actions/remove-domain'
import { portalTheme } from '../../_components/portal-theme'

export function DomainRemoveButton({ hostname }: { hostname: string }) {
  const queryClient = useQueryClient()

  const [open, setOpen] = useState(false)

  const remove = useMutation({
    mutationFn: () => removeDomain(),
    onSuccess: (response) => {
      if (response.error) {
        toast.error(response.error)

        return
      }

      queryClient.setQueryData(['domain'], null)

      toast.success('Domínio removido')
    },
    onError: () => toast.error('Não foi possível remover o domínio. Tente novamente.'),
  })

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={<Button variant="outline" className="min-h-11" disabled={remove.isPending} />}
      >
        {remove.isPending && <Loader2 className="animate-spin motion-reduce:animate-none" />}
        Remover domínio
      </AlertDialogTrigger>
      <AlertDialogContent className={portalTheme}>
        <AlertDialogHeader>
          <AlertDialogTitle>Remover {hostname}?</AlertDialogTitle>
          <AlertDialogDescription>
            O endereço deixa de abrir sua página e fica livre para outra conta. Seu endereço no
            Lynko continua funcionando. Os registros de DNS podem ser apagados no seu provedor.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Manter domínio</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() => {
              setOpen(false)

              remove.mutate()
            }}
          >
            Remover domínio
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
