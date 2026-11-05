'use client'

import { useMutation } from '@tanstack/react-query'
import { Loader2, RotateCcw, Undo2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { defaultAppearance } from '@/app/[locale]/_components/appearance-schema'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { updatePage } from '../../_actions/update-page'
import type { DashboardData } from '../../_components/dashboard-data'
import { useUnsavedMedia } from '../../_components/upload/use-image-upload'
import { DesignControls } from './design-controls'
import { LivePreview } from './live-preview'
import { useAppearanceSchema } from './schemas'
import { applyAppearance } from './sections/themes'

interface AppearanceEditorProps {
  data: DashboardData
  hasPage: boolean
}

export function AppearanceEditor({ data, hasPage }: AppearanceEditorProps) {
  const appearanceForm = useAppearanceSchema(data.appearance)

  const [tab, setTab] = useState('edit')

  const [backgroundImageUrl, setBackgroundImageUrl] = useState(data.backgroundImageUrl)

  const unsavedMedia = useUnsavedMedia()

  const { mutateAsync, isPending } = useMutation({ mutationFn: updatePage })

  const isDirty = appearanceForm.formState.isDirty

  function discard() {
    unsavedMedia.flush(data.appearance.background.imageMediaId)

    appearanceForm.reset()

    setBackgroundImageUrl(data.backgroundImageUrl)
  }

  async function save() {
    if (!(await appearanceForm.trigger())) {
      toast.error('Corrija os campos destacados antes de salvar')

      return
    }

    const appearanceValues = appearanceForm.getValues()

    const response = await mutateAsync({ ...data, appearance: appearanceValues })

    if (response.error) {
      toast.error(response.error)

      return
    }

    unsavedMedia.flush(
      appearanceValues.background.type === 'image'
        ? appearanceValues.background.imageMediaId
        : null,
    )

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
            onClick={() => applyAppearance(appearanceForm, defaultAppearance)}
          >
            <RotateCcw className="size-4" />
            Restaurar padrão
          </Button>
          <Button variant="outline" className="min-h-11" disabled={!isDirty} onClick={discard}>
            <Undo2 className="size-4" />
            Descartar
          </Button>
          <Button className="min-h-11" disabled={!hasPage || isPending || !isDirty} onClick={save}>
            {isPending && <Loader2 className="size-4 animate-spin" />}
            Salvar aparência
          </Button>
        </div>
      </div>
      <Tabs value={tab} onValueChange={setTab} className="gap-5">
        <TabsList className="xl:hidden">
          <TabsTrigger value="edit">Editar</TabsTrigger>
          <TabsTrigger value="preview">Prévia</TabsTrigger>
        </TabsList>
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(310px,0.8fr)]">
          <div
            role="tabpanel"
            aria-label="Editar"
            className={cn('space-y-5', tab !== 'edit' && 'hidden xl:block')}
          >
            <div className="rounded-xl border border-border bg-card p-6">
              <DesignControls
                form={appearanceForm}
                imageUrl={backgroundImageUrl}
                onImageChange={(image) => {
                  if (image) unsavedMedia.track(image.id)

                  setBackgroundImageUrl(image?.url ?? null)
                }}
              />
            </div>
          </div>
          <div
            role="tabpanel"
            aria-label="Prévia"
            className={cn('xl:sticky xl:top-6', tab !== 'preview' && 'hidden xl:block')}
          >
            <LivePreview
              control={appearanceForm.control}
              data={data}
              backgroundImageUrl={backgroundImageUrl}
            />
          </div>
        </div>
      </Tabs>
    </div>
  )
}
