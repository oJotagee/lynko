import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, test } from 'bun:test'

import { UserAvatar } from '../src/app/[locale]/(public)/_components/home/user-avatar'

describe('home user avatar', () => {
  test.each([
    ['Maria Silva', 'MS'],
    [' Maria de Souza ', 'MS'],
    ['Guilherme', 'G'],
    ['Érica Ávila', 'ÉÁ'],
    [null, 'T'],
  ])('shows initials for %s when there is no image', (name, initials) => {
    const html = renderToStaticMarkup(
      <UserAvatar user={{ name, email: 'test@example.com', image: null }} />,
    )
    expect(html).toContain(`>${initials}</span>`)
    expect(html).not.toContain('<img')
  })
})
