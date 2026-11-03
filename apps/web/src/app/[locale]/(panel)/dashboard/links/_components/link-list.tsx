'use client'

import { Link2 } from 'lucide-react'
import { useState } from 'react'

import type { DashboardLink } from '../../_components/dashboard-data'
import { Button } from '@/components/ui/button'
import { LinkRow } from './link-row'

interface LinkListProps {
  links: DashboardLink[]
  disabled: boolean
  onMove: (id: string, target: number) => void
  onCreate: () => void
  onEdit: (link: DashboardLink) => void
  onDelete: (link: DashboardLink) => void
}

export function LinkList({ links, disabled, onMove, onCreate, onEdit, onDelete }: LinkListProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dropPosition, setDropPosition] = useState<number | null>(null)

  const from = links.findIndex((link) => link.id === draggingId)

  function clearDrag() {
    setDraggingId(null)
    setDropPosition(null)
  }

  return (
    <section className="min-w-0 overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between gap-4 px-5 py-5">
        <h2 className="text-xs font-semibold tracking-wide uppercase">
          {links.length} {links.length === 1 ? 'link' : 'links'}
        </h2>
        <p className="text-xs text-muted-foreground">Arraste ou use as setas</p>
      </div>
      {links.length ? (
        <fieldset disabled={disabled}>
          <ol
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
                onEdit={() => onEdit(link)}
                onDelete={() => onDelete(link)}
                onMove={onMove}
              />
            ))}
          </ol>
        </fieldset>
      ) : (
        <div className="flex flex-col items-center gap-4 border-t border-border px-5 py-20 text-center">
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
