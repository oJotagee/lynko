'use client'

import { Monitor, Smartphone } from 'lucide-react'
import { useState } from 'react'

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { DashboardData } from '../../_components/dashboard-data'
import { type PreviewMode, ProfilePreview } from '../../_components/profile/profile-preview'

export function PreviewFrame({ data }: { data: DashboardData }) {
  const [mode, setMode] = useState<PreviewMode>('mobile')

  return (
    <aside className="rounded-xl bg-muted p-6 sm:p-10">
      <div className="mb-8 flex flex-col items-center gap-3">
        <h2 className="text-xs text-muted-foreground">Prévia ao vivo</h2>
        <ToggleGroup
          variant="outline"
          aria-label="Formato da prévia"
          value={[mode]}
          onValueChange={([value]) => {
            if (value === 'mobile' || value === 'desktop') setMode(value)
          }}
        >
          <ToggleGroupItem value="mobile" className="min-h-11 gap-2 px-4">
            <Smartphone />
            Celular
          </ToggleGroupItem>
          <ToggleGroupItem value="desktop" className="min-h-11 gap-2 px-4">
            <Monitor />
            Desktop
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      <ProfilePreview data={data} mode={mode} />
      <p className="mt-6 text-center text-xs text-muted-foreground">
        As mudanças só são publicadas depois de salvar.
      </p>
    </aside>
  )
}
