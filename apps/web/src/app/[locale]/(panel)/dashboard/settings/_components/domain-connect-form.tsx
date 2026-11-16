'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { Controller } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { connectDomain } from '../../_actions/connect-domain'
import { type DomainSchemaData, useDomainSchema } from './domain-schema'

export function DomainConnectForm() {
  const queryClient = useQueryClient()

  const form = useDomainSchema()

  const { mutate, isPending } = useMutation({
    mutationFn: (values: DomainSchemaData) => connectDomain(values),
    onSuccess: (response) => {
      if (response.error || !response.data) {
        form.setError('hostname', { message: response.error })

        return
      }

      queryClient.setQueryData(['domain'], response.data)

      toast.success('Domínio adicionado. Agora crie os registros de DNS.')
    },
    onError: () => toast.error('Não foi possível ligar o domínio. Tente novamente.'),
  })

  return (
    <form
      className="flex max-w-xl flex-col gap-4"
      noValidate
      onSubmit={form.handleSubmit((values) => mutate(values))}
    >
      <Controller
        name="hostname"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Seu domínio</FieldLabel>
            <Input
              {...field}
              id={field.name}
              placeholder="seunome.com"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              inputMode="url"
              aria-invalid={fieldState.invalid}
            />
            <FieldDescription>
              Use um domínio que você já comprou, como seunome.com ou links.seunome.com.
            </FieldDescription>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Button type="submit" className="min-h-11 self-start" disabled={isPending}>
        {isPending && <Loader2 className="animate-spin motion-reduce:animate-none" />}
        Conectar domínio
      </Button>
    </form>
  )
}
