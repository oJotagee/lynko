'use client'

import { useMutation } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Controller } from 'react-hook-form'
import { toast } from 'sonner'

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useRouter } from '@/i18n/navigation'
import { deleteAccount } from '../../_actions/delete-account'
import { portalTheme } from '../../_components/portal-theme'
import { type DeleteAccountSchemaData, useDeleteAccountSchema } from './delete-account-schema'

export function DeleteAccountDialog({ hasPassword }: { hasPassword: boolean }) {
  const [open, setOpen] = useState(false)

  const [emailSent, setEmailSent] = useState(false)

  const form = useDeleteAccountSchema()

  const router = useRouter()

  const { mutate, isPending } = useMutation({
    mutationFn: ({ password }: Partial<DeleteAccountSchemaData>) => deleteAccount({ password }),
    onSuccess: (response) => {
      if (response.error) {
        toast.error(response.error)

        return
      }

      if (response.data && 'emailSent' in response.data) {
        setEmailSent(true)

        return
      }

      toast.success('Sua conta foi excluída.')

      router.replace('/')
    },
    onError: () => toast.error('Não foi possível excluir a conta. Tente novamente.'),
  })

  function handleOpenChange(next: boolean) {
    if (isPending) return

    setOpen(next)

    if (!next) {
      setEmailSent(false)

      form.reset()
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger render={<Button variant="destructive" />}>
        Excluir conta
      </AlertDialogTrigger>
      <AlertDialogContent className={portalTheme}>
        {emailSent ? (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>Verifique seu e-mail</AlertDialogTitle>
              <AlertDialogDescription>
                Enviamos um link de confirmação para o e-mail da sua conta. Sua conta só é excluída
                depois que você abrir o link e confirmar. Ele vale por 30 minutos.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Fechar</AlertDialogCancel>
            </AlertDialogFooter>
          </>
        ) : (
          <form
            className="grid gap-6"
            noValidate
            onSubmit={
              hasPassword
                ? form.handleSubmit((values) => mutate(values))
                : (event) => {
                    event.preventDefault()

                    mutate({})
                  }
            }
          >
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir sua conta?</AlertDialogTitle>
              <AlertDialogDescription>
                Sua página, seus links, suas mídias e suas estatísticas serão apagados e o nome de
                usuário ficará livre. Isso é imediato e não pode ser desfeito.
                {!hasPassword &&
                  ' Como sua conta entra com o Google, enviaremos um link de confirmação para o seu e-mail.'}
              </AlertDialogDescription>
            </AlertDialogHeader>

            {hasPassword && (
              <Controller
                name="password"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Sua senha</FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      type="password"
                      autoComplete="current-password"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            )}

            <AlertDialogFooter>
              <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
              <Button type="submit" variant="destructive" disabled={isPending}>
                {isPending && <Loader2 className="animate-spin motion-reduce:animate-none" />}
                {hasPassword ? 'Excluir minha conta' : 'Enviar link de confirmação'}
              </Button>
            </AlertDialogFooter>
          </form>
        )}
      </AlertDialogContent>
    </AlertDialog>
  )
}
