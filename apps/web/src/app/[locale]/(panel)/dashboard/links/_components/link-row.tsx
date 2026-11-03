'use client'

import { LinkIcon } from '../../_components/link-icon'
import { ArrowDown, ArrowUp, GripVertical, Settings2, Trash2 } from 'lucide-react'

import type { DashboardLink } from '../../_components/dashboard-data'
import { LinkVisibilitySwitch } from './link-visibility-switch'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface LinkRowProps {
  link: DashboardLink
  index: number
  total: number
  onEdit: () => void
  onDelete: () => void
  onMove: (id: string, target: number) => void
  draggingId: string | null
  dropPosition: number | null
  onDragStart: (id: string) => void
  onDragEnd: () => void
  onDragOver: (position: number) => void
  onDrop: (position: number) => void
}

export function LinkRow({
  link,
  index,
  total,
  onEdit,
  onDelete,
  onMove,
  draggingId,
  dropPosition,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: LinkRowProps) {
  const showBefore = dropPosition === index

  const showAfter = index === total - 1 && dropPosition === total

  return (
    <li
      className={cn(
        'relative flex flex-wrap items-center gap-2 border-t border-border bg-card px-3 py-5 sm:gap-3 sm:px-5',
        draggingId === link.id && 'opacity-40',
      )}
      onDragOver={(event) => {
        if (!draggingId) return
        event.preventDefault()
        event.dataTransfer.dropEffect = 'move'
        const bounds = event.currentTarget.getBoundingClientRect()
        onDragOver(index + (event.clientY >= bounds.top + bounds.height / 2 ? 1 : 0))
      }}
      onDrop={(event) => {
        if (!draggingId) return
        event.preventDefault()
        const bounds = event.currentTarget.getBoundingClientRect()
        onDrop(index + (event.clientY >= bounds.top + bounds.height / 2 ? 1 : 0))
      }}
    >
      {(showBefore || showAfter) && (
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute inset-x-2 z-10 h-1 rounded-full bg-primary',
            showBefore ? 'top-0' : 'bottom-0',
          )}
        />
      )}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={`Arrastar ${link.title}. Use as setas para reordenar pelo teclado.`}
        draggable
        onDragStart={(event) => {
          event.dataTransfer.setData('text/plain', link.id)
          event.dataTransfer.effectAllowed = 'move'
          const row = event.currentTarget.closest('li')
          if (row) {
            const bounds = row.getBoundingClientRect()
            const preview = row.cloneNode(true) as HTMLElement
            preview.classList.remove('opacity-40')
            preview.classList.add('fixed', 'pointer-events-none', 'z-50', 'rounded-lg', 'shadow-lg')
            Object.assign(preview.style, {
              top: `${bounds.top}px`,
              left: `${bounds.left}px`,
              width: `${bounds.width}px`,
              margin: '0',
            })
            preview.setAttribute('aria-hidden', 'true')
            preview.inert = true
            row.parentElement?.appendChild(preview)
            event.dataTransfer.setDragImage(preview, 24, bounds.height / 2)
            // The browser captures the image before the next task; keep the copy out of React's list.
            setTimeout(() => preview.remove(), 0)
          }
          onDragStart(link.id)
        }}
        onDragEnd={onDragEnd}
        className="cursor-grab p-1 text-muted-foreground active:cursor-grabbing"
        title="Arraste para reordenar. Ou use os botões de mover."
      >
        <GripVertical className="size-4" aria-hidden="true" />
      </Button>
      <LinkIcon
        url={link.url}
        fallbackColor={link.color}
        className="size-10 border border-foreground/40 text-primary"
        iconClassName="size-5"
      />
      <div className="min-w-0 flex-1 basis-24">
        <p className="truncate text-sm font-semibold">{link.title}</p>
        <p className="mt-1 truncate text-xs text-muted-foreground">
          {link.url.replace(/^https?:\/\//, '')}
        </p>
      </div>
      <div className="flex w-full items-center justify-end gap-1 pl-8 sm:w-auto sm:pl-0">
        <Button
          size="icon"
          variant="ghost"
          className="size-11"
          disabled={index === 0}
          aria-label={`Mover ${link.title} para cima`}
          onClick={() => onMove(link.id, index - 1)}
        >
          <ArrowUp className="size-3.5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="size-11"
          disabled={index === total - 1}
          aria-label={`Mover ${link.title} para baixo`}
          onClick={() => onMove(link.id, index + 1)}
        >
          <ArrowDown className="size-3.5" />
        </Button>
        <div className="flex size-11 items-center justify-center">
          <LinkVisibilitySwitch link={link} />
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="size-11"
          aria-label={`Editar ${link.title}`}
          onClick={onEdit}
        >
          <Settings2 className="size-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="size-11 text-destructive hover:text-destructive"
          aria-label={`Excluir ${link.title}`}
          onClick={onDelete}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </li>
  )
}
