'use client'

import { useMutation } from '@tanstack/react-query'
import { Loader2, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { ProfilePreview } from '../../_components/profile-preview'
import { ProfileForm } from '../../_components/profile-form'
import { updatePage } from '../../_actions/update-page'
import { DesignControls } from './design-controls'
import { Button } from '@/components/ui/button'
import {
  type DashboardAppearance,
  type DashboardData,
  defaultTheme,
  themeToAppearance,
} from '../../_components/dashboard-data'

interface AppearanceEditorProps {
  data: DashboardData
  hasPage: boolean
}

export function AppearanceEditor({ data, hasPage }: AppearanceEditorProps) {
  const [draft, setDraft] = useState(data)

  const { mutateAsync, isPending } = useMutation({ mutationFn: updatePage })

  function changeAppearance(appearance: Partial<DashboardAppearance>) {
    setDraft((current) => ({ ...current, appearance: { ...current.appearance, ...appearance } }))
  }

  async function save() {
    const response = await mutateAsync(draft)

    if (response.error) {
      toast.error(response.error)
      return
    }

    toast.success('Aparência salva')
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Veja cada mudança ao vivo. Salve para aplicar à sua página.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="min-h-11"
            disabled={!hasPage}
            onClick={() => changeAppearance(themeToAppearance(defaultTheme))}
          >
            <RotateCcw className="size-4" />
            Restaurar padrão
          </Button>
          <Button className="min-h-11" disabled={!hasPage || isPending} onClick={save}>
            {isPending && <Loader2 className="size-4 animate-spin" />}
            Salvar aparência
          </Button>
        </div>
      </div>
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(310px,0.8fr)]">
        <div className="space-y-5">
          <div className="rounded-xl border border-border bg-card p-6">
            <DesignControls appearance={draft.appearance} onChange={changeAppearance} />
          </div>
          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-6 text-lg font-bold">Seu perfil</h2>
            <ProfileForm
              data={draft}
              hasPage={hasPage}
              onLiveChange={(profile) => setDraft((current) => ({ ...current, profile }))}
            />
          </section>
        </div>
        <aside className="rounded-xl bg-muted p-6 sm:p-10 xl:sticky xl:top-6">
          <h2 className="mb-8 text-center text-xs text-muted-foreground">
            Prévia ao vivo · celular
          </h2>
          <ProfilePreview data={draft} />
          <p className="mt-6 text-center text-xs text-muted-foreground">
            As mudanças só são publicadas depois de salvar.
          </p>
        </aside>
      </div>
    </div>
  )
}
