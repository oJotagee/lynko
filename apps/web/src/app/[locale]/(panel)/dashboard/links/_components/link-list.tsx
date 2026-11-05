'use client'

import { Link2, Plus } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { DashboardLink } from '../../_components/dashboard-data'
import { LinkRow } from './link-row'

interface LinkListProps {
  links: DashboardLink[]
  disabled: boolean
  onMove: (id: string, target: number) => void
  onCreate: () => void
  onEdit: (link: DashboardLink) => void
  onDelete: (link: DashboardLink) => void
  onToggle: (link: DashboardLink, active: boolean) => void
}

const MAX_LINKS = 100

export function LinkList({
  links,
  disabled,
  onMove,
  onCreate,
  onEdit,
  onDelete,
  onToggle,
}: LinkListProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null)

  const [dropPosition, setDropPosition] = useState<number | null>(null)

  const from = links.findIndex((link) => link.id === draggingId)

  function clearDrag() {
    setDraggingId(null)

    setDropPosition(null)
  }

  return (
    <section aria-labelledby="links-title" className="min-w-0 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="links-title" className="text-lg font-bold">
            Links
          </h2>
          <p className="text-sm text-muted-foreground">
            {links.length} de {MAX_LINKS}.{' '}
            <span className="sm:hidden">Use as setas para reordenar.</span>
            <span className="hidden sm:inline">Arraste ou use as setas para reordenar.</span>
          </p>
        </div>
        <Button
          className="min-h-11 px-4"
          disabled={disabled || links.length >= MAX_LINKS}
          onClick={onCreate}
        >
          <Plus className="size-4" />
          Adicionar link
        </Button>
      </div>
      {links.length ? (
        <fieldset
          disabled={disabled}
          className="sm:overflow-hidden sm:rounded-xl sm:border sm:border-border sm:bg-card"
        >
          <ol
            className="grid gap-3 sm:block"
            onDragLeave={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null))
                setDropPosition(null)
            }}
          >
            {links.map((link, index) => (
              <LinkRow
                key={link.id}
                link={link}
                index={index}
                total={links.length}
                draggingId={draggingId}
                dropPosition={dropPosition}
                onDragStart={setDraggingId}
                onDragEnd={clearDrag}
                onDragOver={(position) =>
                  setDropPosition(position === from || position === from + 1 ? null : position)
                }
                onDrop={(position) => {
                  const target = position > from ? position - 1 : position

                  if (draggingId && from >= 0 && target !== from) onMove(draggingId, target)

                  clearDrag()
                }}
                disabled={disabled}
                onEdit={() => onEdit(link)}
                onDelete={() => onDelete(link)}
                onToggle={(active) => onToggle(link, active)}
                onMove={onMove}
              />
            ))}
          </ol>
        </fieldset>
      ) : (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card px-5 py-16 text-center sm:py-20">
          <Link2 className="size-10 text-muted-foreground" />
          <h3 className="font-semibold">Seu primeiro link começa aqui</h3>
          <p className="max-w-xs text-sm text-muted-foreground">
            Compartilhe um projeto, uma rede social ou seu contato.
          </p>
          <Button onClick={onCreate}>Adicionar meu primeiro link</Button>
        </div>
      )}
    </section>
  )
}
