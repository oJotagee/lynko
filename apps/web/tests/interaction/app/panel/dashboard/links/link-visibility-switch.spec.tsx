import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { screen, waitFor } from '@testing-library/react'

import { buildLink } from '../../../../support/builders'
import { resetNextMocks, toast } from '../../../../support/next'
import { renderWithProviders } from '../../../../support/render'

type ActionResult = { data?: unknown; error?: string }

const updateLink = mock(
  async (_id: string, _input: { isActive?: boolean }): Promise<ActionResult> => ({ data: {} }),
)

mock.module('@/app/[locale]/(panel)/dashboard/links/_actions/update-link', () => ({ updateLink }))

const { LinkVisibilitySwitch } = await import(
  '@/app/[locale]/(panel)/dashboard/links/_components/link-visibility-switch'
)

describe('LinkVisibilitySwitch', () => {
  const link = buildLink({ title: 'Blog' })

  beforeEach(() => {
    resetNextMocks()

    updateLink.mockClear()
    updateLink.mockImplementation(async () => ({ data: {} }))
  })

  it('hides the link right away and saves it', async () => {
    const { user } = renderWithProviders(<LinkVisibilitySwitch link={link} />)

    const toggle = screen.getByRole('switch', { name: 'Exibir Blog na prévia' })

    await user.click(toggle)

    expect(toggle).not.toBeChecked()

    await waitFor(() => expect(updateLink).toHaveBeenCalledWith(link.id, { isActive: false }))
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Link oculto da página'))
  })

  it('announces when the link becomes visible again', async () => {
    const { user } = renderWithProviders(<LinkVisibilitySwitch link={{ ...link, active: false }} />)

    await user.click(screen.getByRole('switch', { name: 'Exibir Blog na prévia' }))

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Link visível na página'))
  })

  it('reverts the switch and shows the error when saving fails', async () => {
    updateLink.mockImplementation(async () => ({ error: 'Não foi possível atualizar o link' }))

    const { user } = renderWithProviders(<LinkVisibilitySwitch link={link} />)

    const toggle = screen.getByRole('switch', { name: 'Exibir Blog na prévia' })

    await user.click(toggle)

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Não foi possível atualizar o link'),
    )

    expect(toggle).toBeChecked()
    expect(toast.success).not.toHaveBeenCalled()
  })

  it('follows the server value after a revalidation', () => {
    const { rerender } = renderWithProviders(<LinkVisibilitySwitch link={link} />)

    rerender(<LinkVisibilitySwitch link={{ ...link, active: false }} />)

    expect(screen.getByRole('switch')).not.toBeChecked()
  })
})
