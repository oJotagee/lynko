'use client'

import { Plus, Share2 } from 'lucide-react'
import { useState } from 'react'
import {
  MAX_SOCIAL_LINKS,
  SOCIAL_PLATFORMS,
  type SocialLinkData,
} from '@/app/[locale]/_components/social-links/social-link-schema'
import { socialPlatforms } from '@/app/[locale]/_components/social-links/social-platforms'
import { Button } from '@/components/ui/button'
import { SocialLinkDialog } from './social-link-dialog'
import { SocialLinkItem } from './social-link-item'

interface SocialLinksSectionProps {
  socialLinks: SocialLinkData[]
  disabled: boolean
  onSave: (socialLinks: SocialLinkData[], success: string, onSaved?: () => void) => void
}

export function SocialLinksSection({ socialLinks, disabled, onSave }: SocialLinksSectionProps) {
  const [editing, setEditing] = useState<SocialLinkData | 'new' | null>(null)

  const available = SOCIAL_PLATFORMS.filter(
    (platform) => !socialLinks.some((link) => link.platform === platform),
  )

  function submit(link: SocialLinkData) {
    const exists = socialLinks.some((item) => item.platform === link.platform)

    const next = exists
      ? socialLinks.map((item) => (item.platform === link.platform ? link : item))
      : [...socialLinks, link]

    onSave(
      next,
      `${socialPlatforms[link.platform].name} ${exists ? 'atualizado' : 'adicionado'}`,
      () => setEditing(null),
    )
  }

  function move(from: number, to: number) {
    const next = [...socialLinks]

    const [link] = next.splice(from, 1)

    if (!link) return

    next.splice(to, 0, link)

    onSave(next, 'Ordem das redes sociais atualizada')
  }

  function toggle(target: SocialLinkData) {
    onSave(
      socialLinks.map((item) =>
        item.platform === target.platform ? { ...item, isActive: !item.isActive } : item,
      ),
      `${socialPlatforms[target.platform].name} ${target.isActive ? 'oculto' : 'visível'} na página`,
    )
  }

  function remove(target: SocialLinkData) {
    onSave(
      socialLinks.filter((item) => item.platform !== target.platform),
      `${socialPlatforms[target.platform].name} removido`,
    )
  }

  return (
    <section aria-labelledby="social-links-title" className="min-w-0 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="social-links-title" className="text-lg font-bold">
            Redes sociais
          </h2>
          <p className="text-sm text-muted-foreground">
            {socialLinks.length} de {MAX_SOCIAL_LINKS}. Os ícones ativos aparecem abaixo do seu
            nome.
          </p>
        </div>
        <Button
          className="min-h-11 px-4"
          disabled={disabled || available.length === 0}
          onClick={() => setEditing('new')}
        >
          <Plus className="size-4" />
          Adicionar rede
        </Button>
      </div>
      {socialLinks.length ? (
        <fieldset
          disabled={disabled}
          className="sm:overflow-hidden sm:rounded-xl sm:border sm:border-border sm:bg-card"
        >
          <ol className="grid gap-3 sm:block">
            {socialLinks.map((link, index) => (
              <SocialLinkItem
                key={link.platform}
                link={link}
                index={index}
                total={socialLinks.length}
                disabled={disabled}
                onMove={move}
                onToggle={toggle}
                onEdit={setEditing}
                onRemove={remove}
              />
            ))}
          </ol>
        </fieldset>
      ) : (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card px-5 py-16 text-center sm:py-20">
          <Share2 className="size-10 text-muted-foreground" />
          <h3 className="font-semibold">Nenhuma rede social ainda</h3>
          <p className="max-w-xs text-sm text-muted-foreground">
            Adicione a primeira para mostrar os ícones na sua página.
          </p>
        </div>
      )}
      {editing && (
        <SocialLinkDialog
          link={editing === 'new' ? undefined : editing}
          platforms={editing === 'new' ? available : [editing.platform]}
          isPending={disabled}
          onSubmit={submit}
          onClose={() => setEditing(null)}
        />
      )}
    </section>
  )
}
