import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { act, screen, waitFor } from '@testing-library/react'

import type { SocialLinkData } from '@/app/[locale]/_components/social-links/social-link-schema'
import { buildDashboardData, buildLink } from '../../../../support/builders'
import { resetNextMocks, toast } from '../../../../support/next'
import { renderWithProviders } from '../../../../support/render'

type ActionResult = { data?: unknown; error?: string }

const updateSocialLinks = mock(async (..._args: unknown[]): Promise<ActionResult> => ({}))

const updateLink = mock(async (..._args: unknown[]): Promise<ActionResult> => ({ data: {} }))

mock.module('@/app/[locale]/(panel)/dashboard/links/_actions/update-social-links', () => ({
  updateSocialLinks,
}))

mock.module('@/app/[locale]/(panel)/dashboard/links/_actions/update-link', () => ({ updateLink }))

const { LinksEditor } = await import(
  '@/app/[locale]/(panel)/dashboard/links/_components/links-editor'
)

const github: SocialLinkData = {
  platform: 'github',
  url: 'https://github.com/maria',
  isActive: true,
}

const instagram: SocialLinkData = {
  platform: 'instagram',
  url: 'https://instagram.com/maria',
  isActive: true,
}

const link = buildLink({ id: '11111111-1111-4111-8111-111111111111', title: 'Portfólio' })

function deferred() {
  let resolve!: (value: ActionResult) => void

  const promise = new Promise<ActionResult>((done) => {
    resolve = done
  })

  return { promise, resolve }
}

function renderEditor(socialLinks: SocialLinkData[]) {
  return renderWithProviders(
    <LinksEditor
      data={buildDashboardData({ links: [link], socialLinks })}
      hasPage
      startCreating={false}
    />,
  )
}

const previewIcon = (name: string) => screen.queryByRole('link', { name, hidden: true })

describe('LinksEditor social links', () => {
  beforeEach(() => {
    resetNextMocks()

    updateSocialLinks.mockClear()

    updateSocialLinks.mockImplementation(async () => ({}))

    updateLink.mockClear()

    updateLink.mockImplementation(async () => ({ data: {} }))
  })

  it('shows the empty state', () => {
    renderEditor([])

    expect(screen.getByText('Nenhuma rede social ainda')).toBeInTheDocument()
  })

  it('adds a social link from the modal and saves right away', async () => {
    const { user } = renderEditor([github])

    await user.click(screen.getByText('Adicionar rede'))

    expect(await screen.findByText('Adicionar rede social')).toBeInTheDocument()

    await user.type(screen.getByLabelText('URL do perfil'), 'https://instagram.com/maria')

    await user.click(screen.getByText('Salvar rede social'))

    await waitFor(() =>
      expect(updateSocialLinks).toHaveBeenCalledWith([github, instagram], expect.anything()),
    )

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Instagram adicionado'))
  })

  it('validates the url inside the modal', async () => {
    const { user } = renderEditor([])

    await user.click(screen.getByText('Adicionar rede'))

    await user.type(await screen.findByLabelText('URL do perfil'), 'javascript:alert(1)')

    await user.click(screen.getByText('Salvar rede social'))

    expect(await screen.findByText('Informe uma URL com http ou https')).toBeInTheDocument()

    expect(updateSocialLinks).not.toHaveBeenCalled()
  })

  it('hides, reorders and removes with one save each', async () => {
    const { user } = renderEditor([github, instagram])

    await user.click(screen.getByLabelText('Exibir GitHub na página'))

    await waitFor(() =>
      expect(updateSocialLinks).toHaveBeenLastCalledWith(
        [{ ...github, isActive: false }, instagram],
        expect.anything(),
      ),
    )

    await waitFor(() => expect(screen.getByLabelText('Mover Instagram para cima')).toBeEnabled())

    await user.click(screen.getByLabelText('Mover Instagram para cima'))

    await waitFor(() => expect(updateSocialLinks).toHaveBeenCalledTimes(2))

    await waitFor(() => expect(screen.getByLabelText('Remover GitHub')).toBeEnabled())

    await user.click(screen.getByLabelText('Remover GitHub'))

    await waitFor(() => expect(updateSocialLinks).toHaveBeenCalledTimes(3))
  })

  it('updates the preview right away and blocks only the social links while saving', async () => {
    const pending = deferred()

    updateSocialLinks.mockImplementationOnce(() => pending.promise)

    const { user } = renderEditor([github])

    expect(previewIcon('GitHub')).toBeInTheDocument()

    await user.click(screen.getByLabelText('Exibir GitHub na página'))

    expect(previewIcon('GitHub')).toBeNull()

    expect(screen.getByLabelText('Exibir GitHub na página')).toHaveAttribute('data-disabled')

    expect(screen.getByText('Adicionar rede').closest('button')).toBeDisabled()

    expect(screen.getByLabelText('Exibir Portfólio na página')).not.toHaveAttribute('data-disabled')

    expect(screen.getByText('Adicionar link').closest('button')).toBeEnabled()

    await act(async () => pending.resolve({}))

    await waitFor(() =>
      expect(screen.getByLabelText('Exibir GitHub na página')).not.toHaveAttribute('data-disabled'),
    )
  })

  it('blocks only the links while a link is saving', async () => {
    const pending = deferred()

    updateLink.mockImplementationOnce(() => pending.promise)

    const { user } = renderEditor([github])

    await user.click(screen.getByLabelText('Exibir Portfólio na página'))

    expect(screen.getByText('Adicionar link').closest('button')).toBeDisabled()

    expect(screen.getByLabelText('Exibir GitHub na página')).not.toHaveAttribute('data-disabled')

    expect(screen.getByText('Adicionar rede').closest('button')).toBeEnabled()

    await act(async () => pending.resolve({ data: {} }))
  })

  it('shows the error and goes back to the saved list when saving fails', async () => {
    updateSocialLinks.mockImplementation(async () => ({ error: 'Falhou' }))

    const { user } = renderEditor([github])

    await user.click(screen.getByLabelText('Remover GitHub'))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Falhou'))

    expect(screen.getByLabelText('Remover GitHub')).toBeInTheDocument()
  })

  it('hides a link in the preview right away and saves it', async () => {
    const pending = deferred()

    updateLink.mockImplementationOnce(() => pending.promise)

    const { user } = renderEditor([])

    expect(screen.getByRole('link', { name: /Portfólio/, hidden: true })).toBeInTheDocument()

    await user.click(screen.getByLabelText('Exibir Portfólio na página'))

    expect(screen.queryByRole('link', { name: /Portfólio/, hidden: true })).toBeNull()

    expect(updateLink).toHaveBeenCalledWith(link.id, { isActive: false })

    await act(async () => pending.resolve({ data: {} }))

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Link oculto da página'))
  })

  it('brings the link back and shows the error when hiding fails', async () => {
    updateLink.mockImplementation(async () => ({ error: 'Não foi possível atualizar o link' }))

    const { user } = renderEditor([])

    await user.click(screen.getByLabelText('Exibir Portfólio na página'))

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Não foi possível atualizar o link'),
    )

    expect(screen.getByLabelText('Exibir Portfólio na página')).toBeChecked()
  })
})
