import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'

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

    expect(screen.getByRole('heading', { name: 'Links' })).toBeInTheDocument()

    expect(screen.getByText(/2 de 100/)).toBeInTheDocument()

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
      expect(createLink).toHaveBeenCalledWith({
        title: 'Blog',
        url: 'https://blog.dev',
        startsAt: null,
        endsAt: null,
      }),
    )

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Link adicionado'))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('schedules a new link from the time fields', async () => {
    const { user } = renderEditor()

    await user.click(screen.getByRole('button', { name: 'Adicionar link' }))
    await user.type(await screen.findByLabelText('Título'), 'Promo')
    await user.type(screen.getByLabelText('URL'), 'https://promo.dev')

    fireEvent.change(screen.getByLabelText('Hora de entra no ar em'), {
      target: { value: '18:00' },
    })

    fireEvent.change(screen.getByLabelText('Hora de sai do ar em'), { target: { value: '23:30' } })

    await user.click(screen.getByRole('button', { name: 'Salvar link' }))

    await waitFor(() => expect(createLink).toHaveBeenCalled())

    const [input] = createLink.mock.calls[0] as [{ startsAt: Date; endsAt: Date; title: string }]

    expect(input.title).toBe('Promo')

    expect([input.startsAt.getHours(), input.startsAt.getMinutes()]).toEqual([18, 0])

    expect([input.endsAt.getHours(), input.endsAt.getMinutes()]).toEqual([23, 30])
  })

  it('picks a start day from the calendar with the keyboard', async () => {
    const { user } = renderEditor()

    await user.click(screen.getByRole('button', { name: 'Adicionar link' }))
    await user.type(await screen.findByLabelText('Título'), 'Promo')
    await user.type(screen.getByLabelText('URL'), 'https://promo.dev')

    const trigger = screen.getByRole('button', { name: 'Entra no ar em' })

    trigger.focus()

    await user.keyboard('{Enter}')

    const grid = await screen.findByRole('grid')

    const day = within(grid)
      .getAllByRole('button')
      .find((button) => button.textContent === '15') as HTMLElement

    await user.click(day)

    await waitFor(() => expect(screen.queryByRole('grid')).toBeNull())

    expect(screen.getByLabelText('Hora de entra no ar em')).toHaveValue('09:00')

    await user.click(screen.getByRole('button', { name: 'Salvar link' }))

    await waitFor(() => expect(createLink).toHaveBeenCalled())

    const [input] = createLink.mock.calls[0] as [{ startsAt: Date }]

    expect([input.startsAt.getDate(), input.startsAt.getHours()]).toEqual([15, 9])
  })

  it('shows the error when the end is before the start and does not submit', async () => {
    const { user } = renderEditor()

    await user.click(screen.getByRole('button', { name: 'Adicionar link' }))
    await user.type(await screen.findByLabelText('Título'), 'Promo')
    await user.type(screen.getByLabelText('URL'), 'https://promo.dev')

    fireEvent.change(screen.getByLabelText('Hora de entra no ar em'), {
      target: { value: '18:00' },
    })

    fireEvent.change(screen.getByLabelText('Hora de sai do ar em'), { target: { value: '17:00' } })

    await user.click(screen.getByRole('button', { name: 'Salvar link' }))

    expect(
      await screen.findByText('A data de saída precisa ser depois da entrada'),
    ).toBeInTheDocument()

    expect(createLink).not.toHaveBeenCalled()
  })

  it('clears the end date of a scheduled link', async () => {
    const scheduled = buildLink({
      id: '66666666-6666-4666-8666-666666666666',
      title: 'Promo',
      endsAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    })

    const { user } = renderEditor({ data: buildDashboardData({ links: [scheduled] }) })

    await user.click(screen.getByRole('button', { name: 'Editar Promo' }))

    await user.click(await screen.findByRole('button', { name: 'Limpar sai do ar em' }))

    await user.click(screen.getByRole('button', { name: 'Salvar link' }))

    await waitFor(() =>
      expect(updateLink).toHaveBeenCalledWith(
        scheduled.id,
        expect.objectContaining({ startsAt: null, endsAt: null }),
      ),
    )
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

  describe('schedule', () => {
    const hour = 60 * 60 * 1000

    const scheduled = buildLink({
      id: '33333333-3333-4333-8333-333333333333',
      title: 'Promo',
      startsAt: new Date(Date.now() + hour).toISOString(),
      endsAt: new Date(Date.now() + 2 * hour).toISOString(),
    })

    const ended = buildLink({
      id: '44444444-4444-4444-8444-444444444444',
      title: 'Evento',
      endsAt: new Date(Date.now() - hour).toISOString(),
    })

    const hidden = buildLink({
      id: '55555555-5555-4555-8555-555555555555',
      title: 'Rascunho',
      active: false,
    })

    function row(title: string) {
      return within(screen.getByRole('list', { hidden: true }))
        .getAllByRole('listitem', { hidden: true })
        .find((item) => item.textContent?.includes(title)) as HTMLElement
    }

    it('shows the state and the dates of each link', () => {
      renderEditor({
        data: buildDashboardData({ links: [first, scheduled, ended, hidden] }),
      })

      expect(within(row('Primeiro')).getByText('No ar')).toBeInTheDocument()

      expect(within(row('Promo')).getByText('Agendado')).toBeInTheDocument()

      expect(within(row('Promo')).getByText(/^Entra no ar em .+ e sai em /)).toBeInTheDocument()

      expect(within(row('Evento')).getByText('Encerrado')).toBeInTheDocument()

      expect(within(row('Evento')).getByText(/^Saiu do ar em /)).toBeInTheDocument()

      expect(within(row('Rascunho')).getByText('Oculto')).toBeInTheDocument()
    })

    it('shows only the live links in the preview', () => {
      renderEditor({
        data: buildDashboardData({ links: [first, scheduled, ended, hidden] }),
      })

      const preview = screen.getByText('Prévia ao vivo').closest('aside') as HTMLElement

      expect(within(preview).getByText('Primeiro')).toBeInTheDocument()

      expect(within(preview).queryByText('Promo')).toBeNull()

      expect(within(preview).queryByText('Evento')).toBeNull()

      expect(within(preview).queryByText('Rascunho')).toBeNull()
    })
  })
})
