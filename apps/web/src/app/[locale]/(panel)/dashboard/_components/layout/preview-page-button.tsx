'use client'

import { Eye } from 'lucide-react'
import { useState } from 'react'

import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import type { DashboardData } from '../dashboard-data'
import { ProfilePreview } from '../profile/profile-preview'
import { Button } from '@/components/ui/button'
import { portalTheme } from '../portal-theme'

export function PreviewPageButton({ data }: { data: DashboardData }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        variant="outline"
        className="h-11 gap-2 px-3"
        onClick={() => setOpen(true)}
        aria-label="Ver prévia da página"
      >
        <Eye />
        <span className="hidden sm:inline">Ver página</span>
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className={`${portalTheme} max-h-[90svh] overflow-y-auto`}
          showCloseButton={false}
        >
          <DialogTitle>Prévia da sua página</DialogTitle>
          <DialogDescription>
            Visualização da página com seus links ativos e as configurações atuais.
          </DialogDescription>
          <ProfilePreview data={data} />
          <Button variant="outline" onClick={() => setOpen(false)}>
            Fechar prévia
          </Button>
        </DialogContent>
      </Dialog>
    </>
  )
}
