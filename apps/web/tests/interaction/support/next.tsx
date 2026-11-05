import { mock } from 'bun:test'

export const router = {
  push: mock((_href: string) => undefined),
  replace: mock((_href: string) => undefined),
  refresh: mock(() => undefined),
}

export const toast = {
  success: mock((_message: string) => undefined),
  error: mock((_message: string) => undefined),
}

let pathname = '/dashboard'

export function setPathname(next: string) {
  pathname = next
}

export function resetNextMocks() {
  for (const fn of [...Object.values(router), ...Object.values(toast)]) fn.mockClear()

  pathname = '/dashboard'
}

function MockLink({ href, children, ...props }: React.ComponentProps<'a'> & { href: string }) {
  return (
    <a href={href} {...props}>
      {children}
    </a>
  )
}

mock.module('@/i18n/navigation', () => ({
  useRouter: () => router,
  usePathname: () => pathname,
  redirect: mock(() => undefined),
  Link: MockLink,
}))

mock.module('sonner', () => ({ toast }))
