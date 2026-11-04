'use client'

import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'

import type { DashboardLink } from '../../_components/dashboard-data'
import { updateLink } from '../_actions/update-link'
import { Switch } from '@/components/ui/switch'

export function LinkVisibilitySwitch({ link }: { link: DashboardLink }) {
  const [checked, setChecked] = useState(link.active)

  const [serverActive, setServerActive] = useState(link.active)

  if (link.active !== serverActive) {
    setServerActive(link.active)

    setChecked(link.active)
  }

  const { mutate, isPending } = useMutation({
    mutationFn: (isActive: boolean) => updateLink(link.id, { isActive }),
    onSuccess: (response, isActive) => {
      if (response.error) {
        setChecked(!isActive)

        toast.error(response.error)

        return
      }

      toast.success(isActive ? 'Link visível na página' : 'Link oculto da página')
    },
    onError: (_error, isActive) => {
      setChecked(!isActive)

      toast.error('Não foi possível atualizar o link')
    },
  })

  function handleCheckedChange(isActive: boolean) {
    if (isPending) return

    setChecked(isActive)

    mutate(isActive)
  }

  return (
    <Switch
      checked={checked}
      onCheckedChange={handleCheckedChange}
      aria-busy={isPending}
      aria-label={`Exibir ${link.title} na prévia`}
    />
  )
}
