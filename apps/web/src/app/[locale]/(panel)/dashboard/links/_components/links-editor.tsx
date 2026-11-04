'use client'

import { useMutation } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useOptimistic, useState, useTransition } from 'react'
import { toast } from 'sonner'

import { type DashboardData, type DashboardLink, moveLink } from '../../_components/dashboard-data'
import { ProfilePreview } from '../../_components/profile/profile-preview'
import { Button, buttonVariants } from '@/components/ui/button'
import { reorderLinks } from '../_actions/reorder-links'
import { DeleteLinkDialog } from './delete-link-dialog'
import { deleteLink } from '../_actions/delete-link'
import { Link } from '@/i18n/navigation'
import { LinkForm } from './link-form'
import { LinkList } from './link-list'

type LinksChange = { type: 'reorder'; ids: string[] } | { type: 'delete'; id: string }

function applyChange(links: DashboardLink[], change: LinksChange) {
  if (change.type === 'delete') return links.filter((link) => link.id !== change.id)

  return change.ids.flatMap((id) => links.find((link) => link.id === id) ?? [])
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

  const [isPending, startTransition] = useTransition()

  const [links, applyOptimistic] = useOptimistic(data.links, applyChange)

  const reorder = useMutation({ mutationFn: reorderLinks })

  const remove = useMutation({ mutationFn: deleteLink })

  function save(
    change: LinksChange,
    request: () => Promise<{ error?: string }>,
    messages: { success: string; error: string },
    onSaved?: () => void,
  ) {
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
    if (isPending) return

    const ids = moveLink(links, id, target).map((link) => link.id)

    save({ type: 'reorder', ids }, () => reorder.mutateAsync(ids), {
      success: 'Ordem dos links atualizada',
      error: 'Não foi possível reordenar os links',
    })
  }

  function confirmDelete(link: DashboardLink) {
    save(
      { type: 'delete', id: link.id },
      () => remove.mutateAsync(link.id),
      { success: 'Link excluído', error: 'Não foi possível excluir o link' },
      () => setDeleting(null),
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Adicione, organize e escolha o que aparece na sua página.
        </p>
        <Button
          className="min-h-11 px-4"
          disabled={links.length >= 100}
          onClick={() => setEditing('new')}
        >
          <Plus className="size-4" />
          Adicionar link
        </Button>
      </div>
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_310px]">
        <LinkList
          links={links}
          disabled={isPending}
          onMove={move}
          onCreate={() => setEditing('new')}
          onEdit={setEditing}
          onDelete={setDeleting}
        />
        <aside className="rounded-xl bg-muted p-5 xl:sticky xl:top-6">
          <h2 className="mb-5 text-center text-[10px] tracking-widest text-muted-foreground uppercase">
            Prévia ao vivo
          </h2>
          <ProfilePreview data={{ ...data, links }} />
        </aside>
      </div>
      {editing && (
        <LinkForm link={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />
      )}
      <DeleteLinkDialog
        link={deleting}
        isPending={isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}
