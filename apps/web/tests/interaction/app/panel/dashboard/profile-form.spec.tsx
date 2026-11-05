import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test'
import { act, fireEvent, screen, waitFor } from '@testing-library/react'

import type { DashboardData } from '@/app/[locale]/(panel)/dashboard/_components/dashboard-data'
import { buildDashboardData } from '../../../support/builders'
import { resetNextMocks, toast } from '../../../support/next'
import { renderWithProviders } from '../../../support/render'

type ActionResult = { data?: unknown; error?: string }

const createPage = mock(async (_input: DashboardData): Promise<ActionResult> => ({ data: {} }))

const updatePage = mock(async (_input: DashboardData): Promise<ActionResult> => ({ data: {} }))

mock.module('@/app/[locale]/(panel)/dashboard/_actions/create-page', () => ({ createPage }))
mock.module('@/app/[locale]/(panel)/dashboard/_actions/update-page', () => ({ updatePage }))

const mediaIds = ['7f0c9e64-3f1d-4c2b-9a51-2d8e6f4b1a90', '1d2e3f40-5a6b-4c7d-8e9f-0a1b2c3d4e5f']

let uploads = 0

const deleteMedia = mock(async (_id: string) => ({}))

mock.module('@/app/[locale]/(panel)/dashboard/_actions/presign-media', () => ({
  presignMedia: async () => ({
    data: { mediaId: mediaIds[uploads], uploadUrl: 'https://s3.test/upload', expiresIn: 300 },
  }),
}))

mock.module('@/app/[locale]/(panel)/dashboard/_actions/confirm-media', () => ({
  confirmMedia: async (id: string) => {
    uploads++

    return {
      data: {
        id,
        type: 'avatar',
        status: 'ready',
        mimeType: 'image/png',
        size: 4,
        url: `https://cdn.lynko.test/media/${id}.png`,
      },
    }
  },
}))

mock.module('@/app/[locale]/(panel)/dashboard/_actions/delete-media', () => ({ deleteMedia }))

const { ProfileForm } = await import(
  '@/app/[locale]/(panel)/dashboard/settings/_components/profile-form'
)

describe('ProfileForm', () => {
  beforeEach(() => {
    resetNextMocks()

    createPage.mockClear()

    updatePage.mockClear()
  })

  it('creates the page when the user has none', async () => {
    const data = buildDashboardData({
      profile: { ...buildDashboardData().profile, username: '' },
    })

    const { user } = renderWithProviders(<ProfileForm data={data} hasPage={false} />)

    expect(screen.getByRole('switch')).toHaveAttribute('data-disabled')

    await user.type(screen.getByLabelText('Nome de usuário'), 'Maria_Silva')
    await user.click(screen.getByRole('button', { name: 'Criar minha página' }))

    await waitFor(() =>
      expect(createPage).toHaveBeenCalledWith(
        expect.objectContaining({
          profile: expect.objectContaining({ username: 'maria_silva' }),
        }),
        expect.anything(),
      ),
    )

    expect(updatePage).not.toHaveBeenCalled()

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('Página criada. Agora adicione seus links.'),
    )
  })

  it('shows the reserved username error and does not submit', async () => {
    const { user } = renderWithProviders(<ProfileForm data={buildDashboardData()} hasPage />)

    const username = screen.getByLabelText('Nome de usuário')

    await user.clear(username)
    await user.type(username, 'admin')
    await user.click(screen.getByRole('button', { name: 'Salvar perfil' }))

    expect(await screen.findByText('Este nome de usuário é reservado')).toBeInTheDocument()
    expect(updatePage).not.toHaveBeenCalled()
  })

  it('publishes the page right away, without saving the form', async () => {
    const data = buildDashboardData()

    let finish!: (result: ActionResult) => void

    updatePage.mockImplementationOnce(
      () =>
        new Promise<ActionResult>((done) => {
          finish = done
        }),
    )

    const { user } = renderWithProviders(<ProfileForm data={data} hasPage />)

    await user.click(screen.getByRole('switch'))

    expect(screen.getByRole('switch')).toBeChecked()
    expect(toast.success).not.toHaveBeenCalled()

    expect(updatePage).toHaveBeenCalledWith(
      { ...data, profile: { ...data.profile, published: true } },
      expect.anything(),
    )

    await act(async () => finish({ data: {} }))

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Página publicada'))
  })

  it('announces when the page goes back to draft', async () => {
    const data = buildDashboardData()

    const published = { ...data, profile: { ...data.profile, published: true } }

    const { user } = renderWithProviders(<ProfileForm data={published} hasPage />)

    await user.click(screen.getByRole('switch'))

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Página despublicada'))
  })

  it('reverts the switch and shows the error when the visibility fails', async () => {
    updatePage.mockImplementationOnce(async () => ({ error: 'Sua página não foi encontrada.' }))

    const { user } = renderWithProviders(<ProfileForm data={buildDashboardData()} hasPage />)

    await user.click(screen.getByRole('switch'))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Sua página não foi encontrada.'))
    await waitFor(() => expect(screen.getByRole('switch')).not.toBeChecked())

    expect(toast.success).not.toHaveBeenCalled()
  })

  it('keeps the saved visibility when the form is saved', async () => {
    const data = buildDashboardData()

    const published = { ...data, profile: { ...data.profile, published: true } }

    const { user } = renderWithProviders(<ProfileForm data={published} hasPage />)

    const name = screen.getByLabelText('Nome de exibição')

    await user.clear(name)
    await user.type(name, 'Ana Lima')
    await user.click(screen.getByRole('button', { name: 'Salvar perfil' }))

    await waitFor(() =>
      expect(updatePage).toHaveBeenCalledWith(
        expect.objectContaining({
          profile: expect.objectContaining({ name: 'Ana Lima', published: true }),
        }),
        expect.anything(),
      ),
    )

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Página atualizada'))
  })

  describe('avatar upload', () => {
    let fetchMock: ReturnType<typeof spyOn>

    const png = () => new File(['png!'], 'eu.png', { type: 'image/png' })

    function choose(container: HTMLElement, file: File) {
      const input = container.querySelector('input[type="file"]') as HTMLInputElement

      fireEvent.change(input, { target: { files: [file] } })
    }

    beforeEach(() => {
      uploads = 0

      deleteMedia.mockClear()

      fetchMock = spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 200 }))

      spyOn(URL, 'createObjectURL').mockReturnValue('blob:preview')

      spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    })

    afterEach(() => {
      fetchMock.mockRestore()

      mock.restore()
    })

    it('saves the uploaded avatar and hides the url field', async () => {
      const { user, container } = renderWithProviders(
        <ProfileForm data={buildDashboardData()} hasPage />,
      )

      choose(container, png())

      await waitFor(() => expect(uploads).toBe(1))

      await waitFor(() => expect(container.querySelector('#image')).toBeNull())

      await user.click(screen.getByText('Salvar perfil'))

      await waitFor(() =>
        expect(updatePage).toHaveBeenCalledWith(
          expect.objectContaining({
            profile: expect.objectContaining({
              avatarMediaId: mediaIds[0],
              image: `https://cdn.lynko.test/media/${mediaIds[0]}.png`,
            }),
          }),
          expect.anything(),
        ),
      )

      expect(deleteMedia).not.toHaveBeenCalled()
    })

    it('deletes the replaced upload that was never saved', async () => {
      const { user, container } = renderWithProviders(
        <ProfileForm data={buildDashboardData()} hasPage />,
      )

      choose(container, png())

      await waitFor(() => expect(uploads).toBe(1))

      choose(container, png())

      await waitFor(() => expect(uploads).toBe(2))

      await user.click(screen.getByText('Salvar perfil'))

      await waitFor(() => expect(deleteMedia).toHaveBeenCalledTimes(1))

      expect(deleteMedia.mock.calls[0]?.[0]).toBe(mediaIds[0])
    })

    it('removes the saved avatar and brings back the url field', async () => {
      const data = buildDashboardData()

      const withAvatar = {
        ...data,
        profile: {
          ...data.profile,
          avatarMediaId: mediaIds[0],
          image: 'https://cdn.lynko.test/media/saved.png',
        },
      }

      const { user, container } = renderWithProviders(<ProfileForm data={withAvatar} hasPage />)

      expect(container.querySelector('#image')).toBeNull()

      await user.click(screen.getByText('Remover'))

      expect(container.querySelector('#image')).toHaveValue('')

      await user.click(screen.getByText('Salvar perfil'))

      await waitFor(() =>
        expect(updatePage).toHaveBeenCalledWith(
          expect.objectContaining({
            profile: expect.objectContaining({ avatarMediaId: null, image: '' }),
          }),
          expect.anything(),
        ),
      )
    })

    it('disables the upload until the page exists', () => {
      const { container } = renderWithProviders(
        <ProfileForm data={buildDashboardData()} hasPage={false} />,
      )

      expect(container.querySelector('#avatar-upload')).toBeDisabled()

      expect(screen.getByText('Crie sua página para enviar uma foto.')).toBeInTheDocument()
    })
  })
})
