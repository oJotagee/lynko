import { beforeEach, describe, expect, it, mock, spyOn } from 'bun:test'
import { fireEvent, screen, waitFor } from '@testing-library/react'

import type { DashboardData } from '@/app/[locale]/(panel)/dashboard/_components/dashboard-data'
import { buildDashboardData } from '../../../../support/builders'
import { resetNextMocks, toast } from '../../../../support/next'
import { renderWithProviders } from '../../../../support/render'

type ActionResult = { data?: unknown; error?: string }

const updatePage = mock(async (_input: DashboardData): Promise<ActionResult> => ({ data: {} }))

mock.module('@/app/[locale]/(panel)/dashboard/_actions/update-page', () => ({ updatePage }))

const imageId = '7f0c9e64-3f1d-4c2b-9a51-2d8e6f4b1a90'

const deleteMedia = mock(async (_id: string) => ({}))

mock.module('@/app/[locale]/(panel)/dashboard/_actions/presign-media', () => ({
  presignMedia: async () => ({
    data: { mediaId: imageId, uploadUrl: 'https://s3.test/upload', expiresIn: 300 },
  }),
}))

mock.module('@/app/[locale]/(panel)/dashboard/_actions/confirm-media', () => ({
  confirmMedia: async () => ({
    data: {
      id: imageId,
      type: 'background',
      status: 'ready',
      mimeType: 'image/png',
      size: 4,
      url: 'https://cdn.lynko.test/media/bg.png',
    },
  }),
}))

mock.module('@/app/[locale]/(panel)/dashboard/_actions/delete-media', () => ({ deleteMedia }))

const { AppearanceEditor } = await import(
  '@/app/[locale]/(panel)/dashboard/appearance/_components/appearance-editor'
)

const save = () => screen.getByRole('button', { name: 'Salvar aparência' })

describe('AppearanceEditor', () => {
  beforeEach(() => {
    resetNextMocks()

    updatePage.mockClear()
    updatePage.mockImplementation(async () => ({ data: {} }))
  })

  it('starts without changes: save and discard are disabled', () => {
    renderWithProviders(<AppearanceEditor data={buildDashboardData()} hasPage />)

    expect(save()).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Descartar' })).toBeDisabled()
  })

  it('saves the chosen theme', async () => {
    const { user } = renderWithProviders(<AppearanceEditor data={buildDashboardData()} hasPage />)

    await user.click(screen.getByRole('button', { name: 'Dark' }))

    expect(screen.getByRole('button', { name: 'Dark' })).toHaveAttribute('aria-pressed', 'true')

    expect(updatePage).not.toHaveBeenCalled()

    await user.click(save())

    await waitFor(() =>
      expect(updatePage).toHaveBeenCalledWith(
        expect.objectContaining({
          appearance: expect.objectContaining({
            theme: 'dark',
            background: { type: 'solid', color: '#171716' },
          }),
        }),
        expect.anything(),
      ),
    )

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Aparência salva'))
  })

  it('keeps the profile and links unchanged in the saved payload', async () => {
    const data = buildDashboardData()

    const { user } = renderWithProviders(<AppearanceEditor data={data} hasPage />)

    await user.click(screen.getByRole('button', { name: 'Dark' }))

    await user.click(save())

    await waitFor(() =>
      expect(updatePage).toHaveBeenCalledWith(
        expect.objectContaining({ profile: data.profile, links: data.links }),
        expect.anything(),
      ),
    )
  })

  it('shows the error and keeps the draft when saving fails', async () => {
    updatePage.mockImplementation(async () => ({ error: 'Não foi possível salvar sua página.' }))

    const { user } = renderWithProviders(<AppearanceEditor data={buildDashboardData()} hasPage />)

    await user.click(screen.getByRole('button', { name: 'Gradient' }))
    await user.click(save())

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Não foi possível salvar sua página.'),
    )

    expect(screen.getByRole('button', { name: 'Gradient' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('changes a color without looping and marks the theme as custom', async () => {
    const { user } = renderWithProviders(<AppearanceEditor data={buildDashboardData()} hasPage />)

    for (const value of ['#111111', '#222222', '#333333']) {
      fireEvent.input(screen.getByLabelText('Fundo'), { target: { value } })
    }

    expect(screen.getByText('#333333')).toBeInTheDocument()

    expect(screen.getByRole('button', { name: /Custom/ })).toHaveAttribute('aria-pressed', 'true')

    await user.click(save())

    await waitFor(() =>
      expect(updatePage).toHaveBeenCalledWith(
        expect.objectContaining({
          appearance: expect.objectContaining({
            theme: 'custom',
            background: { type: 'solid', color: '#333333' },
          }),
        }),
        expect.anything(),
      ),
    )
  })

  it('changes the font, the button shape and the icon size', async () => {
    const { user } = renderWithProviders(<AppearanceEditor data={buildDashboardData()} hasPage />)

    await user.click(screen.getByRole('button', { name: 'Roboto' }))
    await user.click(screen.getByRole('button', { name: 'Redondo' }))
    await user.click(screen.getByRole('button', { name: 'Grande' }))
    await user.click(save())

    await waitFor(() =>
      expect(updatePage).toHaveBeenCalledWith(
        expect.objectContaining({
          appearance: expect.objectContaining({
            typography: expect.objectContaining({ fontFamily: 'roboto' }),
            buttons: expect.objectContaining({ shape: 'pill' }),
            socialIcons: expect.objectContaining({ size: 'lg' }),
          }),
        }),
        expect.anything(),
      ),
    )
  })

  it('saves the hover effect and a custom hover color', async () => {
    const { user } = renderWithProviders(<AppearanceEditor data={buildDashboardData()} hasPage />)

    await user.click(screen.getByRole('button', { name: 'Inverter' }))

    expect(screen.queryByLabelText('Cor no hover')).toBeNull()

    await user.click(screen.getByRole('switch', { name: 'Cor própria no hover' }))

    fireEvent.input(screen.getByLabelText('Cor no hover'), { target: { value: '#ff8d6b' } })

    await user.click(save())

    await waitFor(() =>
      expect(updatePage).toHaveBeenCalledWith(
        expect.objectContaining({
          appearance: expect.objectContaining({
            theme: 'custom',
            buttons: expect.objectContaining({ hoverEffect: 'invert', hoverColor: '#ff8d6b' }),
          }),
        }),
        expect.anything(),
      ),
    )
  })

  it('switches the background to a gradient', async () => {
    const { user } = renderWithProviders(<AppearanceEditor data={buildDashboardData()} hasPage />)

    await user.click(screen.getByRole('button', { name: 'Gradiente' }))

    expect(screen.getByLabelText('Cor inicial')).toBeInTheDocument()
    expect(screen.getByLabelText('Cor final')).toBeInTheDocument()
    expect(screen.queryByLabelText('Fundo')).toBeNull()

    await user.click(save())

    await waitFor(() =>
      expect(updatePage).toHaveBeenCalledWith(
        expect.objectContaining({
          appearance: expect.objectContaining({
            background: expect.objectContaining({ type: 'gradient' }),
          }),
        }),
        expect.anything(),
      ),
    )
  })

  it('asks for an image before saving an image background', async () => {
    const { user } = renderWithProviders(<AppearanceEditor data={buildDashboardData()} hasPage />)

    await user.click(screen.getByRole('button', { name: 'Imagem' }))

    await user.click(save())

    expect(await screen.findByText('Escolha uma imagem')).toBeInTheDocument()

    expect(updatePage).not.toHaveBeenCalled()
  })

  it('saves an uploaded background image and discards the orphan on discard', async () => {
    const fetchMock = spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(null, { status: 200 }),
    )

    const { user, container } = renderWithProviders(
      <AppearanceEditor data={buildDashboardData()} hasPage />,
    )

    await user.click(screen.getByRole('button', { name: 'Imagem' }))

    const input = container.querySelector('input[type="file"]') as HTMLInputElement

    await user.upload(input, new File(['png!'], 'fundo.png', { type: 'image/png' }))

    await waitFor(() =>
      expect(screen.getByAltText('Imagem de fundo da página')).toHaveAttribute(
        'src',
        'https://cdn.lynko.test/media/bg.png',
      ),
    )

    await user.click(screen.getByRole('button', { name: 'Descartar' }))

    await waitFor(() => expect(deleteMedia).toHaveBeenCalledWith(imageId, expect.anything()))

    fetchMock.mockRestore()
  })

  it('discards the unsaved changes', async () => {
    const { user } = renderWithProviders(<AppearanceEditor data={buildDashboardData()} hasPage />)

    await user.click(screen.getByRole('button', { name: 'Dark' }))

    expect(save()).toBeEnabled()

    await user.click(screen.getByRole('button', { name: 'Descartar' }))

    expect(screen.getByRole('button', { name: 'Minimal' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Dark' })).toHaveAttribute('aria-pressed', 'false')
    expect(save()).toBeDisabled()
    expect(updatePage).not.toHaveBeenCalled()
  })

  it('restores the default appearance', async () => {
    const { user } = renderWithProviders(
      <AppearanceEditor
        data={buildDashboardData({
          appearance: {
            ...buildDashboardData().appearance,
            theme: 'dark',
            background: { type: 'solid', color: '#171716' },
          },
        })}
        hasPage
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Restaurar padrão' }))

    expect(screen.getByRole('button', { name: 'Minimal' })).toHaveAttribute('aria-pressed', 'true')
    expect(save()).toBeEnabled()
  })

  it('switches the preview between mobile and desktop without calling the API', async () => {
    const { user } = renderWithProviders(<AppearanceEditor data={buildDashboardData()} hasPage />)

    const celular = () => screen.getByRole('button', { name: 'Celular', hidden: true })

    const desktop = () => screen.getByRole('button', { name: 'Desktop', hidden: true })

    expect(celular()).toHaveAttribute('aria-pressed', 'true')

    await user.click(desktop())

    expect(desktop()).toHaveAttribute('aria-pressed', 'true')
    expect(updatePage).not.toHaveBeenCalled()
  })

  it('switches between the edit and preview panels with the tabs', async () => {
    const { user } = renderWithProviders(<AppearanceEditor data={buildDashboardData()} hasPage />)

    const editPanel = () => screen.getByRole('tabpanel', { name: 'Editar' })

    const previewPanel = () => screen.getByRole('tabpanel', { name: 'Prévia' })

    expect(editPanel()).not.toHaveClass('hidden')
    expect(previewPanel()).toHaveClass('hidden', 'xl:block')

    await user.click(screen.getByRole('tab', { name: 'Prévia' }))

    expect(editPanel()).toHaveClass('hidden', 'xl:block')
    expect(previewPanel()).not.toHaveClass('hidden')

    await user.click(screen.getByRole('tab', { name: 'Editar' }))

    expect(editPanel()).not.toHaveClass('hidden')
  })

  it('no longer edits social links and keeps the saved ones', async () => {
    const socialLinks = [
      { platform: 'github' as const, url: 'https://github.com/maria', isActive: true },
    ]

    const { user } = renderWithProviders(
      <AppearanceEditor data={buildDashboardData({ socialLinks })} hasPage />,
    )

    expect(screen.queryByText('Redes sociais')).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Dark' }))

    await user.click(save())

    await waitFor(() =>
      expect(updatePage).toHaveBeenCalledWith(
        expect.objectContaining({ socialLinks }),
        expect.anything(),
      ),
    )
  })

  it('disables saving until the page exists', () => {
    renderWithProviders(<AppearanceEditor data={buildDashboardData()} hasPage={false} />)

    expect(save()).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Restaurar padrão' })).toBeDisabled()
  })
})
