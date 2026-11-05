'use client'

import { useMutation } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { Controller } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import type { DashboardLink } from '../../_components/dashboard-data'
import { portalTheme } from '../../_components/portal-theme'
import { createLink } from '../_actions/create-link'
import { updateLink } from '../_actions/update-link'
import { type LinkSchemaData, useLinkSchema } from './schemas'

export function LinkForm({ link, onClose }: { link?: DashboardLink; onClose: () => void }) {
  const form = useLinkSchema(link ?? { title: '', url: '' })

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (values: LinkSchemaData) =>
      link ? updateLink(link.id, values) : createLink(values),
  })

  async function onSubmit(values: LinkSchemaData) {
    const response = await mutateAsync(values)

    if (response.error) {
      toast.error(response.error)

      return
    }

    toast.success(link ? 'Link atualizado' : 'Link adicionado')

    onClose()
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className={portalTheme} showCloseButton={false}>
        <DialogTitle>{link ? 'Editar link' : 'Adicionar um link'}</DialogTitle>
        <DialogDescription>
          O link será salvo na sua página. Se ela estiver publicada, a alteração ficará visível.
        </DialogDescription>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <Controller
            name="title"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Título</FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  placeholder="Meu portfólio"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            name="url"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>URL</FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  type="url"
                  placeholder="https://exemplo.com"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <div className="flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin" />}Salvar link
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
