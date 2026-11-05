'use client'

import { ArrowDown, ArrowUp, Pencil, Trash2 } from 'lucide-react'
import type { SocialLinkData } from '@/app/[locale]/_components/social-links/social-link-schema'
import { socialPlatforms } from '@/app/[locale]/_components/social-links/social-platforms'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'

interface SocialLinkItemProps {
  link: SocialLinkData
  index: number
  total: number
  disabled: boolean
  onMove: (from: number, to: number) => void
  onToggle: (link: SocialLinkData) => void
  onEdit: (link: SocialLinkData) => void
  onRemove: (link: SocialLinkData) => void
}

export function SocialLinkItem({
  link,
  index,
  total,
  disabled,
  onMove,
  onToggle,
  onEdit,
  onRemove,
}: SocialLinkItemProps) {
  const { name, icon: Icon, color } = socialPlatforms[link.platform]

  return (
    <li className="relative flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:flex-wrap sm:items-center sm:rounded-none sm:border-0 sm:border-t sm:px-5 sm:py-5 sm:first:border-t-0">
      <div className="flex min-w-0 items-center gap-3 sm:flex-1 sm:basis-24">
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-foreground/40"
          style={{ background: color, color: '#ffffff' }}
        >
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{name}</p>
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
          aria-label={`Mover ${name} para cima`}
          onClick={() => onMove(index, index - 1)}
        >
          <ArrowUp className="size-3.5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="size-11"
          disabled={index === total - 1}
          aria-label={`Mover ${name} para baixo`}
          onClick={() => onMove(index, index + 1)}
        >
          <ArrowDown className="size-3.5" />
        </Button>
        <div className="flex size-11 items-center justify-center">
          <Switch
            checked={link.isActive}
            disabled={disabled}
            onCheckedChange={() => onToggle(link)}
            aria-label={`Exibir ${name} na página`}
          />
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="size-11"
          aria-label={`Editar ${name}`}
          onClick={() => onEdit(link)}
        >
          <Pencil className="size-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="size-11 text-destructive hover:text-destructive"
          aria-label={`Remover ${name}`}
          onClick={() => onRemove(link)}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </li>
  )
}
