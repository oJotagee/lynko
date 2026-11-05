'use client'

import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog'
import { portalTheme } from '../../_components/portal-theme'

interface DeleteLinkDialogProps<T> {
  item: T | null
  name: string
  title?: string
  confirmLabel?: string
  isPending: boolean
  onConfirm: (item: T) => void
  onCancel: () => void
}

export function DeleteLinkDialog<T>({
  item,
  name,
  title = 'Excluir este link?',
  confirmLabel = 'Excluir link',
  isPending,
  onConfirm,
  onCancel,
}: DeleteLinkDialogProps<T>) {
  return (
    <Dialog
      open={!!item}
      onOpenChange={(open) => {
        if (!open && !isPending) onCancel()
      }}
    >
      <DialogContent className={portalTheme} showCloseButton={false}>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>
          “{name}” será excluído permanentemente da sua página. Essa ação não pode ser desfeita.
        </DialogDescription>
        <DialogFooter>
          <Button variant="outline" disabled={isPending} onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            disabled={isPending}
            onClick={() => {
              if (item) onConfirm(item)
            }}
          >
            {isPending && <Loader2 className="size-4 animate-spin" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
