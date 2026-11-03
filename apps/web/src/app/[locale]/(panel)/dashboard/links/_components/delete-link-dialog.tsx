'use client'

import { Loader2 } from 'lucide-react'

import type { DashboardLink } from '../../_components/dashboard-data'
import { portalTheme } from '../../_components/portal-theme'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog'

interface DeleteLinkDialogProps {
  link: DashboardLink | null
  isPending: boolean
  onConfirm: (link: DashboardLink) => void
  onCancel: () => void
}

export function DeleteLinkDialog({ link, isPending, onConfirm, onCancel }: DeleteLinkDialogProps) {
  return (
    <Dialog
      open={!!link}
      onOpenChange={(open) => {
        if (!open && !isPending) onCancel()
      }}
    >
      <DialogContent className={portalTheme} showCloseButton={false}>
        <DialogTitle>Excluir este link?</DialogTitle>
        <DialogDescription>
          “{link?.title}” será excluído permanentemente da sua página. Essa ação não pode ser
          desfeita.
        </DialogDescription>
        <DialogFooter>
          <Button variant="outline" disabled={isPending} onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            disabled={isPending}
            onClick={() => {
              if (link) onConfirm(link)
            }}
          >
            {isPending && <Loader2 className="size-4 animate-spin" />}
            Excluir link
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
