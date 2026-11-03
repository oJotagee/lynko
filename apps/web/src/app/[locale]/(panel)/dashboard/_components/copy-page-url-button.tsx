'use client'

import { Copy } from 'lucide-react'
import { toast } from 'sonner'

import type { DashboardProfile } from './dashboard-data'
import { Button } from '@/components/ui/button'
import { SITE_URL } from '@/lib/site'

interface CopyPageUrlButtonProps {
  profile: DashboardProfile
  hasPage: boolean
}

export function CopyPageUrlButton({ profile, hasPage }: CopyPageUrlButtonProps) {
  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(`${SITE_URL}/${profile.username}`)

      toast.success('URL copiada')
    } catch {
      toast.error('Não foi possível copiar. Tente novamente.')
    }
  }

  return (
    <Button
      variant="outline"
      onClick={copyUrl}
      disabled={!hasPage}
      className="hidden h-10 gap-2 bg-card text-xs sm:inline-flex"
    >
      <span
        className={`size-1.5 rounded-full ${profile.published ? 'bg-chart-2' : 'bg-muted-foreground'}`}
      />
      {profile.username ? `${new URL(SITE_URL).host}/${profile.username}` : 'Crie sua página'}
      <Copy className="size-3" />
    </Button>
  )
}
