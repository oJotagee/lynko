import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test'
import { fireEvent, screen, waitFor } from '@testing-library/react'

import { renderWithProviders } from '../../../../support/render'

type Result<T> = { data?: T; error?: string }

const mediaId = '7f0c9e64-3f1d-4c2b-9a51-2d8e6f4b1a90'

const media = {
  id: mediaId,
  type: 'avatar' as const,
  status: 'ready' as const,
  mimeType: 'image/png',
  size: 4,
  url: 'https://cdn.lynko.test/media/avatar.png',
}

const upload = { mediaId, uploadUrl: 'https://s3.test/upload', expiresIn: 300 }

const presignMedia = mock(
  async (_input: unknown): Promise<Result<typeof upload>> => ({ data: upload }),
)

const confirmMedia = mock(async (_id: string): Promise<Result<typeof media>> => ({ data: media }))

const deleteMedia = mock(async (_id: string) => ({}))

mock.module('@/app/[locale]/(panel)/dashboard/_actions/presign-media', () => ({ presignMedia }))

mock.module('@/app/[locale]/(panel)/dashboard/_actions/confirm-media', () => ({ confirmMedia }))

mock.module('@/app/[locale]/(panel)/dashboard/_actions/delete-media', () => ({ deleteMedia }))

const { ImageUpload } = await import(
  '@/app/[locale]/(panel)/dashboard/_components/upload/image-upload'
)

const png = () => new File(['png!'], 'eu.png', { type: 'image/png' })

describe('ImageUpload', () => {
  let fetchMock: ReturnType<typeof spyOn>

  const onUploaded = mock((_media: unknown) => {})

  const onRemove = mock(() => {})

  function renderUpload(imageUrl: string | null = null, type: 'avatar' | 'background' = 'avatar') {
    const rendered = renderWithProviders(
      <ImageUpload
        id="upload"
        type={type}
        alt="Foto de Maria"
        imageUrl={imageUrl}
        onUploaded={onUploaded}
        onRemove={onRemove}
      />,
    )

    const input = rendered.container.querySelector('input[type="file"]') as HTMLInputElement

    return {
      ...rendered,
      choose: (file: File) => fireEvent.change(input, { target: { files: [file] } }),
    }
  }

  beforeEach(() => {
    for (const fn of [presignMedia, confirmMedia, deleteMedia, onUploaded, onRemove]) fn.mockClear()

    presignMedia.mockImplementation(async () => ({ data: upload }))

    confirmMedia.mockImplementation(async () => ({ data: media }))

    fetchMock = spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 200 }))

    spyOn(URL, 'createObjectURL').mockReturnValue('blob:preview')

    spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
  })

  afterEach(() => {
    mock.restore()
  })

  it.each([
    ['an unsupported type', new File(['gif'], 'a.gif', { type: 'image/gif' }), 'JPG, PNG ou WebP'],
    ['an svg', new File(['<svg/>'], 'a.svg', { type: 'image/svg+xml' }), 'JPG, PNG ou WebP'],
    [
      'a file above the limit',
      new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'big.png', { type: 'image/png' }),
      'até 5 MB',
    ],
  ])('rejects %s before uploading', async (_label, file, message) => {
    const { choose } = renderUpload()

    choose(file)

    expect(await screen.findByRole('alert')).toHaveTextContent(message)

    expect(presignMedia).not.toHaveBeenCalled()

    expect(URL.createObjectURL).not.toHaveBeenCalled()
  })

  it('shows a local preview, uploads with PUT and confirms', async () => {
    const { choose } = renderUpload(null, 'background')

    choose(png())

    expect(screen.getByAltText('Foto de Maria')).toHaveAttribute('src', 'blob:preview')

    expect(screen.getByRole('button', { name: 'Enviando imagem' })).toBeDisabled()

    await waitFor(() => expect(onUploaded).toHaveBeenCalledWith(media))

    expect(presignMedia).toHaveBeenCalledWith({
      type: 'background',
      fileName: 'eu.png',
      contentType: 'image/png',
      size: 4,
    })

    expect(fetchMock).toHaveBeenCalledWith(
      'https://s3.test/upload',
      expect.objectContaining({ method: 'PUT', headers: { 'Content-Type': 'image/png' } }),
    )

    expect(confirmMedia).toHaveBeenCalledWith(mediaId)

    await waitFor(() => expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview'))
  })

  it('shows the presign error', async () => {
    presignMedia.mockImplementation(async () => ({ error: 'Sua página não foi encontrada.' }))

    const { choose } = renderUpload()

    choose(png())

    expect(await screen.findByRole('alert')).toHaveTextContent('Sua página não foi encontrada.')

    expect(fetchMock).not.toHaveBeenCalled()

    expect(onUploaded).not.toHaveBeenCalled()
  })

  it('keeps the file after a failed PUT and retries it', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 500 }))

    const { choose, user } = renderUpload()

    choose(png())

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível enviar a imagem')

    expect(deleteMedia).toHaveBeenCalledWith(mediaId)

    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    await waitFor(() => expect(onUploaded).toHaveBeenCalledWith(media))

    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('requests a new upload url once when the signed url expired', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 403 }))

    const { choose } = renderUpload()

    choose(png())

    await waitFor(() => expect(onUploaded).toHaveBeenCalledWith(media))

    expect(presignMedia).toHaveBeenCalledTimes(2)
  })

  it('removes the current image', async () => {
    const { user } = renderUpload('https://cdn.lynko.test/media/old.png')

    await user.click(screen.getByRole('button', { name: 'Remover' }))

    expect(onRemove).toHaveBeenCalled()
  })

  it('falls back to the placeholder when the image fails to load', () => {
    renderUpload('https://cdn.lynko.test/media/broken.png', 'background')

    fireEvent.error(screen.getByAltText('Foto de Maria'))

    expect(screen.queryByAltText('Foto de Maria')).not.toBeInTheDocument()

    expect(screen.getByRole('button', { name: 'Trocar imagem' })).toBeInTheDocument()
  })

  it('uses the Avatar fallback for an avatar that did not load', () => {
    const { container } = renderUpload('https://cdn.lynko.test/media/broken.png')

    expect(screen.queryByAltText('Foto de Maria')).not.toBeInTheDocument()

    expect(container.querySelector('[data-slot="avatar-fallback"]')).toBeInTheDocument()
  })
})
