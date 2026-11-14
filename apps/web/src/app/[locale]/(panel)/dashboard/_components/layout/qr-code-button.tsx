'use client'

import { QrCode } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { DashboardProfile } from '../dashboard-data'
import { QrCodeDialog } from './qr-code-dialog'

const label = <span className="hidden sm:inline">QR code</span>

export function QrCodeButton({ profile }: { profile: DashboardProfile }) {
  const [open, setOpen] = useState(false)

  if (!profile.published || !profile.username) {
    return (
      <Tooltip>
        <TooltipTrigger render={<span className="rounded-lg" />}>
          <Button
            variant="outline"
            className="h-11 gap-2 px-3"
            disabled
            aria-label="QR code, publique sua página para gerar o QR code"
          >
            <QrCode />
            {label}
          </Button>
        </TooltipTrigger>
        <TooltipContent>Publique sua página para gerar o QR code</TooltipContent>
      </Tooltip>
    )
  }

  return (
    <>
      <Button
        variant="outline"
        className="h-11 gap-2 px-3"
        aria-label="QR code da página"
        onClick={() => setOpen(true)}
      >
        <QrCode />
        {label}
      </Button>
      <QrCodeDialog username={profile.username} open={open} onOpenChange={setOpen} />
    </>
  )
}
