'use client'

import { useMutation } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { type DashboardData, type DashboardLink, moveLink } from '../../_components/dashboard-data'
import { ProfilePreview } from '../../_components/profile-preview'
import { Button, buttonVariants } from '@/components/ui/button'
import { reorderLinks } from '../_actions/reorder-links'
import { DeleteLinkDialog } from './delete-link-dialog'
import { deleteLink } from '../_actions/delete-link'
import { Link } from '@/i18n/navigation'
import { LinkForm } from './link-form'
import { LinkList } from './link-list'

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

  const reorder = useMutation({
    mutationFn: reorderLinks,
    onSuccess: (response) => {
      if (response.error) toast.error(response.error)
      else toast.success('Ordem dos links atualizada')
    },
  })

  const remove = useMutation({
    mutationFn: deleteLink,
    onSuccess: (response) => {
      if (response.error) {
        toast.error(response.error)
        return
      }

      toast.success('Link excluído')
      setDeleting(null)
    },
  })

  // Mostra a mudança enquanto a action roda; a resposta traz os links revalidados do servidor.
  let links = data.links
  if (reorder.isPending && reorder.variables) {
    links = reorder.variables.flatMap((id) => links.find((link) => link.id === id) ?? [])
  }
  if (remove.isPending) links = links.filter((link) => link.id !== remove.variables)

  const isPending = reorder.isPending || remove.isPending

  function move(id: string, target: number) {
    if (!isPending) reorder.mutate(moveLink(links, id, target).map((link) => link.id))
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
        isPending={remove.isPending}
        onConfirm={(link) => remove.mutate(link.id)}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}
