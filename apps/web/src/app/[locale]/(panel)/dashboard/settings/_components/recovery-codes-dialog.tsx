'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  TwoFactorCodeField,
  TwoFactorPasswordField,
} from '@/app/[locale]/_components/two-factor-fields'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { regenerateRecoveryCodes } from '../../_actions/regenerate-recovery-codes'
import { portalTheme } from '../../_components/portal-theme'
import { RecoveryCodesList } from './recovery-codes-list'
import { type TwoFactorConfirmData, useTwoFactorConfirmSchema } from './two-factor-schema'

export function RecoveryCodesDialog() {
  const queryClient = useQueryClient()

  const [open, setOpen] = useState(false)

  const [codes, setCodes] = useState<string[] | null>(null)

  const form = useTwoFactorConfirmSchema()

  const { mutate, isPending } = useMutation({
    mutationFn: (values: TwoFactorConfirmData) => regenerateRecoveryCodes(values),
    onSuccess: (response) => {
      if (!response.data) {
        form.setError('root', { message: response.error })

        return
      }

      setCodes(response.data.recoveryCodes)

      toast.success('Novos códigos gerados')

      void queryClient.invalidateQueries({ queryKey: ['two-factor'] })
    },
  })

  function handleOpenChange(next: boolean) {
    setOpen(next)

    if (!next) {
      setCodes(null)

      form.reset()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant="outline" className="min-h-11" />}>
        Gerar novos códigos
      </DialogTrigger>
      <DialogContent className={portalTheme}>
        <DialogTitle>
          {codes ? 'Seus novos códigos' : 'Gerar novos códigos de recuperação'}
        </DialogTitle>
        <DialogDescription>
          {codes
            ? 'Guarde estes códigos em um lugar seguro. Os antigos não funcionam mais.'
            : 'Os códigos atuais deixam de valer assim que os novos forem gerados.'}
        </DialogDescription>
        {codes ? (
          <div className="grid gap-5">
            <RecoveryCodesList codes={codes} />
            <Button className="min-h-11" onClick={() => handleOpenChange(false)}>
              Concluir
            </Button>
          </div>
        ) : (
          <form
            className="grid gap-5"
            noValidate
            onSubmit={form.handleSubmit((values) => mutate(values))}
          >
            <TwoFactorPasswordField control={form.control} name="password" autoFocus />
            <TwoFactorCodeField control={form.control} name="code" />
            {form.formState.errors.root && (
              <p role="alert" className="text-sm text-destructive">
                {form.formState.errors.root.message}
              </p>
            )}
            <Button type="submit" className="min-h-11" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin motion-reduce:animate-none" />}
              Gerar novos códigos
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
