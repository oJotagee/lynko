'use client'

import { useMutation } from '@tanstack/react-query'
import { useOptimistic, useTransition } from 'react'
import { toast } from 'sonner'

import { Field, FieldLabel } from '@/components/ui/field'
import { Switch } from '@/components/ui/switch'
import { updatePage } from '../../_actions/update-page'
import type { DashboardData } from '../../_components/dashboard-data'

interface ProfilePublishedFieldProps {
  data: DashboardData
  hasPage: boolean
}

export function ProfilePublishedField({ data, hasPage }: ProfilePublishedFieldProps) {
  const [isPending, startTransition] = useTransition()

  const [published, setPublished] = useOptimistic(data.profile.published)

  const { mutateAsync } = useMutation({ mutationFn: updatePage })

  function change(next: boolean) {
    startTransition(async () => {
      setPublished(next)

      try {
        const response = await mutateAsync({
          ...data,
          profile: { ...data.profile, published: next },
        })

        if (response.error) {
          toast.error(response.error)

          return
        }

        toast.success(next ? 'Página publicada' : 'Página despublicada')
      } catch {
        toast.error('Não foi possível atualizar a visibilidade da página')
      }
    })
  }

  return (
    <Field orientation="horizontal" className="items-center rounded-lg border border-border p-4">
      <div className="flex-1">
        <FieldLabel htmlFor="profile-published">Publicar página</FieldLabel>
        <p className="mt-1 text-xs text-muted-foreground">
          {hasPage
            ? 'A mudança é aplicada na hora, sem precisar salvar o perfil.'
            : 'A página será criada como rascunho. Publique após adicionar seus links.'}
        </p>
      </div>
      <Switch
        id="profile-published"
        disabled={!hasPage || isPending}
        checked={published}
        onCheckedChange={change}
      />
    </Field>
  )
}
