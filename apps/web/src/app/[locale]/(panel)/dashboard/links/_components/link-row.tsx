'use client'

import { ArrowDown, ArrowUp, GripVertical, Pencil, Trash2 } from 'lucide-react'
import { LinkIcon } from '@/app/[locale]/_components/link-icon'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import type { DashboardLink } from '../../_components/dashboard-data'

interface LinkRowProps {
  link: DashboardLink
  index: number
  total: number
  onEdit: () => void
  onDelete: () => void
  onToggle: (active: boolean) => void
  disabled: boolean
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
  onToggle,
  disabled,
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
        'relative flex flex-col gap-3 rounded-xl border border-border bg-card p-4',
        'sm:flex-row sm:flex-wrap sm:items-center sm:rounded-none sm:border-0 sm:border-t sm:px-5 sm:py-5 sm:first:border-t-0',
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

            setTimeout(() => preview.remove(), 0)
          }

          onDragStart(link.id)
        }}
        onDragEnd={onDragEnd}
        className="hidden cursor-grab p-1 text-muted-foreground active:cursor-grabbing sm:inline-flex"
        title="Arraste para reordenar. Ou use os botões de mover."
      >
        <GripVertical className="size-4" aria-hidden="true" />
      </Button>
      <div className="flex min-w-0 items-center gap-3 sm:flex-1 sm:basis-24">
        <LinkIcon
          url={link.url}
          fallbackColor={link.color}
          className="size-10 border border-foreground/40 text-primary"
          iconClassName="size-5"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{link.title}</p>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {link.url.replace(/^https?:\/\//, '')}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-border pt-3 sm:w-auto sm:justify-end sm:gap-1 sm:border-0 sm:pt-0">
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
          <Switch
            checked={link.active}
            disabled={disabled}
            onCheckedChange={onToggle}
            aria-label={`Exibir ${link.title} na página`}
          />
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="size-11"
          aria-label={`Editar ${link.title}`}
          onClick={onEdit}
        >
          <Pencil className="size-4" />
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
