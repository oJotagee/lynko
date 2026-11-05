'use client'

import { useMutation } from '@tanstack/react-query'
import { useOptimistic, useState, useTransition } from 'react'
import { toast } from 'sonner'
import type { SocialLinkData } from '@/app/[locale]/_components/social-links/social-link-schema'
import { buttonVariants } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import { type DashboardData, type DashboardLink, moveLink } from '../../_components/dashboard-data'
import { ProfilePreview } from '../../_components/profile/profile-preview'
import { deleteLink } from '../_actions/delete-link'
import { reorderLinks } from '../_actions/reorder-links'
import { updateLink } from '../_actions/update-link'
import { updateSocialLinks } from '../_actions/update-social-links'
import { DeleteLinkDialog } from './delete-link-dialog'
import { LinkForm } from './link-form'
import { LinkList } from './link-list'
import { SocialLinksSection } from './social-links-section'

interface EditorState {
  links: DashboardLink[]
  socialLinks: SocialLinkData[]
}

type EditorChange =
  | { type: 'reorder'; ids: string[] }
  | { type: 'delete'; id: string }
  | { type: 'toggle'; id: string; active: boolean }
  | { type: 'social'; socialLinks: SocialLinkData[] }

function applyChange(state: EditorState, change: EditorChange): EditorState {
  if (change.type === 'social') return { ...state, socialLinks: change.socialLinks }

  if (change.type === 'delete')
    return { ...state, links: state.links.filter((link) => link.id !== change.id) }

  if (change.type === 'toggle')
    return {
      ...state,
      links: state.links.map((link) =>
        link.id === change.id ? { ...link, active: change.active } : link,
      ),
    }

  return {
    ...state,
    links: change.ids.flatMap((id) => state.links.find((link) => link.id === id) ?? []),
  }
}

interface LinksEditorProps {
  data: DashboardData
  hasPage: boolean
  startCreating: boolean
}

export function LinksEditor({ data, hasPage, startCreating }: LinksEditorProps) {
  const [editing, setEditing] = useState<DashboardLink | 'new' | null>(
    startCreating && hasPage ? 'new' : null,
  )

  const [deleting, setDeleting] = useState<DashboardLink | null>(null)

  const [linksPending, startLinksTransition] = useTransition()

  const [socialPending, startSocialTransition] = useTransition()

  const [state, applyOptimistic] = useOptimistic(
    { links: data.links, socialLinks: data.socialLinks },
    applyChange,
  )

  const reorder = useMutation({ mutationFn: reorderLinks })

  const remove = useMutation({ mutationFn: deleteLink })

  const toggle = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      updateLink(id, { isActive: active }),
  })

  const social = useMutation({ mutationFn: updateSocialLinks })

  function save(
    change: EditorChange,
    request: () => Promise<{ error?: string }>,
    messages: { success: string; error: string },
    onSaved?: () => void,
  ) {
    const isSocial = change.type === 'social'

    if (isSocial ? socialPending : linksPending) return

    const startTransition = isSocial ? startSocialTransition : startLinksTransition

    startTransition(async () => {
      applyOptimistic(change)

      try {
        const response = await request()

        if (response.error) {
          toast.error(response.error)

          return
        }

        toast.success(messages.success)

        onSaved?.()
      } catch {
        toast.error(messages.error)
      }
    })
  }

  function move(id: string, target: number) {
    const ids = moveLink(state.links, id, target).map((link) => link.id)

    save({ type: 'reorder', ids }, () => reorder.mutateAsync(ids), {
      success: 'Ordem dos links atualizada',
      error: 'Não foi possível reordenar os links',
    })
  }

  function setActive(link: DashboardLink, active: boolean) {
    save(
      { type: 'toggle', id: link.id, active },
      () => toggle.mutateAsync({ id: link.id, active }),
      {
        success: active ? 'Link visível na página' : 'Link oculto da página',
        error: 'Não foi possível atualizar o link',
      },
    )
  }

  function confirmDelete(link: DashboardLink) {
    save(
      { type: 'delete', id: link.id },
      () => remove.mutateAsync(link.id),
      { success: 'Link excluído', error: 'Não foi possível excluir o link' },
      () => setDeleting(null),
    )
  }

  function saveSocialLinks(socialLinks: SocialLinkData[], success: string, onSaved?: () => void) {
    save(
      { type: 'social', socialLinks },
      () => social.mutateAsync(socialLinks),
      { success, error: 'Não foi possível salvar suas redes sociais' },
      onSaved,
    )
  }

  if (!hasPage)
    return (
      <section className="rounded-xl border border-border bg-card p-8">
        <h2 className="text-xl font-bold">Crie sua página primeiro</h2>
        <p className="my-4 text-sm text-muted-foreground">
          Escolha seu nome de usuário para começar a adicionar links.
        </p>
        <Link href="/dashboard/settings" className={buttonVariants()}>
          Criar minha página
        </Link>
      </section>
    )

  return (
    <div className="space-y-5">
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_310px]">
        <div className="space-y-10">
          <LinkList
            links={state.links}
            disabled={linksPending}
            onMove={move}
            onCreate={() => setEditing('new')}
            onEdit={setEditing}
            onDelete={setDeleting}
            onToggle={setActive}
          />
          <SocialLinksSection
            socialLinks={state.socialLinks}
            disabled={socialPending}
            onSave={saveSocialLinks}
          />
        </div>
        <aside className="rounded-xl bg-muted p-5 xl:sticky xl:top-6">
          <h2 className="mb-5 text-center text-[10px] tracking-widest text-muted-foreground uppercase">
            Prévia ao vivo
          </h2>
          <ProfilePreview data={{ ...data, links: state.links, socialLinks: state.socialLinks }} />
        </aside>
      </div>
      {editing && (
        <LinkForm link={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />
      )}
      <DeleteLinkDialog
        item={deleting}
        name={deleting?.title ?? ''}
        isPending={linksPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}
