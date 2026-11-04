import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { act, screen, waitFor, within } from '@testing-library/react'

import { buildDashboardData, buildLink } from '../../../../support/builders'
import { resetNextMocks, toast } from '../../../../support/next'
import { renderWithProviders } from '../../../../support/render'

type ActionResult = { data?: unknown; error?: string }

const createLink = mock(async (_input: unknown): Promise<ActionResult> => ({ data: {} }))

const updateLink = mock(async (..._args: unknown[]): Promise<ActionResult> => ({ data: {} }))

const deleteLink = mock(async (_id: string): Promise<ActionResult> => ({ data: true }))

const reorderLinks = mock(async (_ids: string[]): Promise<ActionResult> => ({ data: [] }))

mock.module('@/app/[locale]/(panel)/dashboard/links/_actions/create-link', () => ({ createLink }))
mock.module('@/app/[locale]/(panel)/dashboard/links/_actions/update-link', () => ({ updateLink }))
mock.module('@/app/[locale]/(panel)/dashboard/links/_actions/delete-link', () => ({ deleteLink }))

mock.module('@/app/[locale]/(panel)/dashboard/links/_actions/reorder-links', () => ({
  reorderLinks,
}))

const { LinksEditor } = await import(
  '@/app/[locale]/(panel)/dashboard/links/_components/links-editor'
)

const first = buildLink({ id: '11111111-1111-4111-8111-111111111111', title: 'Primeiro' })

const second = buildLink({ id: '22222222-2222-4222-8222-222222222222', title: 'Segundo' })

function deferred() {
  let resolve!: (value: ActionResult) => void

  const promise = new Promise<ActionResult>((done) => {
    resolve = done
  })

  return { promise, resolve }
}

function titles() {
  return within(screen.getByRole('list', { hidden: true }))
    .getAllByRole('listitem', { hidden: true })
    .map((item) => item.textContent ?? '')
}

function renderEditor(overrides: Partial<Parameters<typeof LinksEditor>[0]> = {}) {
  return renderWithProviders(
    <LinksEditor
      data={buildDashboardData({ links: [first, second] })}
      hasPage
      startCreating={false}
      {...overrides}
    />,
  )
}

describe('LinksEditor', () => {
  beforeEach(() => {
    resetNextMocks()

    for (const action of [createLink, updateLink, deleteLink, reorderLinks]) action.mockClear()

    createLink.mockImplementation(async () => ({ data: {} }))

    deleteLink.mockImplementation(async () => ({ data: true }))

    reorderLinks.mockImplementation(async () => ({ data: [] }))
  })

  it('lists the links in order', () => {
    renderEditor()

    const items = within(screen.getByRole('list')).getAllByRole('listitem')

    expect(screen.getByRole('heading', { name: '2 links' })).toBeInTheDocument()

    expect(items.map((item) => item.textContent)).toEqual([
      expect.stringContaining('Primeiro'),
      expect.stringContaining('Segundo'),
    ])
  })

  it('asks to create the page first when there is none', () => {
    renderEditor({ hasPage: false })

    expect(screen.getByRole('heading', { name: 'Crie sua página primeiro' })).toBeInTheDocument()

    expect(screen.getByRole('link', { name: 'Criar minha página' })).toHaveAttribute(
      'href',
      '/dashboard/settings',
    )
  })

  it('shows the empty state without links', () => {
    renderEditor({ data: buildDashboardData({ links: [] }) })

    expect(screen.getByText('Seu primeiro link começa aqui')).toBeInTheDocument()
  })

  it('opens the create dialog when coming from ?new=1', async () => {
    renderEditor({ startCreating: true })

    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Adicionar um link')).toBeInTheDocument()
  })

  it('shows the validation error and does not submit an unsafe url', async () => {
    const { user } = renderEditor()

    await user.click(screen.getByRole('button', { name: 'Adicionar link' }))
    await user.type(await screen.findByLabelText('Título'), 'Perigoso')
    await user.type(screen.getByLabelText('URL'), 'javascript:alert(1)')
    await user.click(screen.getByRole('button', { name: 'Salvar link' }))

    expect(await screen.findByText('Informe uma URL com http ou https')).toBeInTheDocument()
    expect(createLink).not.toHaveBeenCalled()
  })

  it('creates the link and closes the dialog', async () => {
    const { user } = renderEditor()

    await user.click(screen.getByRole('button', { name: 'Adicionar link' }))
    await user.type(await screen.findByLabelText('Título'), 'Blog')
    await user.type(screen.getByLabelText('URL'), 'https://blog.dev')
    await user.click(screen.getByRole('button', { name: 'Salvar link' }))

    await waitFor(() =>
      expect(createLink).toHaveBeenCalledWith({ title: 'Blog', url: 'https://blog.dev' }),
    )

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Link adicionado'))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('keeps the dialog open and shows the error when the action fails', async () => {
    createLink.mockImplementation(async () => ({ error: 'Sua página pode ter até 100 links.' }))

    const { user } = renderEditor()

    await user.click(screen.getByRole('button', { name: 'Adicionar link' }))
    await user.type(await screen.findByLabelText('Título'), 'Blog')
    await user.type(screen.getByLabelText('URL'), 'https://blog.dev')
    await user.click(screen.getByRole('button', { name: 'Salvar link' }))

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Sua página pode ter até 100 links.'),
    )

    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('moves a link down by sending the new order', async () => {
    const { user } = renderEditor()

    await user.click(screen.getByRole('button', { name: 'Mover Primeiro para baixo' }))

    await waitFor(() =>
      expect(reorderLinks).toHaveBeenCalledWith([second.id, first.id], expect.anything()),
    )

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Ordem dos links atualizada'))
  })

  it('deletes a link only after the confirmation', async () => {
    const { user } = renderEditor()

    await user.click(screen.getByRole('button', { name: 'Excluir Segundo' }))

    expect(await screen.findByText('Excluir este link?')).toBeInTheDocument()
    expect(deleteLink).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Excluir link' }))

    await waitFor(() => expect(deleteLink).toHaveBeenCalledWith(second.id, expect.anything()))
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Link excluído'))
  })

  it('hides the deleted link right away and confirms only after the action finishes', async () => {
    const pending = deferred()

    deleteLink.mockImplementation(() => pending.promise)

    const { user } = renderEditor()

    await user.click(screen.getByRole('button', { name: 'Excluir Segundo' }))
    await user.click(await screen.findByRole('button', { name: 'Excluir link' }))

    await waitFor(() => expect(titles()).toHaveLength(1))

    expect(titles()[0]).toContain('Primeiro')
    expect(toast.success).not.toHaveBeenCalled()

    await act(async () => pending.resolve({ data: true }))

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Link excluído'))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('restores the link and keeps the dialog open when deleting fails', async () => {
    deleteLink.mockImplementation(async () => ({ error: 'Este link não foi encontrado.' }))

    const { user } = renderEditor()

    await user.click(screen.getByRole('button', { name: 'Excluir Segundo' }))
    await user.click(await screen.findByRole('button', { name: 'Excluir link' }))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Este link não foi encontrado.'))
    await waitFor(() => expect(titles()).toHaveLength(2))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(toast.success).not.toHaveBeenCalled()
  })

  it('shows the new order while the action runs', async () => {
    const pending = deferred()

    reorderLinks.mockImplementation(() => pending.promise)

    const { user } = renderEditor()

    await user.click(screen.getByRole('button', { name: 'Mover Primeiro para baixo' }))

    await waitFor(() =>
      expect(titles()).toEqual([
        expect.stringContaining('Segundo'),
        expect.stringContaining('Primeiro'),
      ]),
    )

    expect(toast.success).not.toHaveBeenCalled()

    await act(async () => pending.resolve({ data: [] }))

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Ordem dos links atualizada'))
  })

  it('goes back to the saved order and shows the error when reordering fails', async () => {
    reorderLinks.mockImplementation(async () => ({ error: 'Não foi possível reordenar os links' }))

    const { user } = renderEditor()

    await user.click(screen.getByRole('button', { name: 'Mover Primeiro para baixo' }))

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Não foi possível reordenar os links'),
    )

    await waitFor(() =>
      expect(titles()).toEqual([
        expect.stringContaining('Primeiro'),
        expect.stringContaining('Segundo'),
      ]),
    )
  })
})
