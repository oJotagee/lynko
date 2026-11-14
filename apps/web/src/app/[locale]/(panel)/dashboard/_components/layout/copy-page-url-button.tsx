'use client'

import { Copy } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { getPublicPageLabel, getPublicPageUrl } from '@/lib/site'
import type { DashboardProfile } from '../dashboard-data'

interface CopyPageUrlButtonProps {
  profile: DashboardProfile
  hasPage: boolean
}

export function CopyPageUrlButton({ profile, hasPage }: CopyPageUrlButtonProps) {
  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(getPublicPageUrl(profile.username, profile.customDomain))

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
      <span className="max-w-48 truncate">
        {profile.username
          ? getPublicPageLabel(profile.username, profile.customDomain)
          : 'Crie sua página'}
      </span>
      <Copy className="size-3" />
    </Button>
  )
}
