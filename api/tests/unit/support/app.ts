import { buildApp } from '../../../src/app'

import { buildPage, buildSession, buildUser, type Page, type User } from './builders'
import type { useInMemoryRepositories } from './memory-repositories'

type Store = ReturnType<typeof useInMemoryRepositories>

export async function createTestApp() {
  const app = buildApp()
  app.log.level = 'silent'
  await app.ready()

  return app
}

export function signIn(
  app: Awaited<ReturnType<typeof createTestApp>>,
  store: Store,
  overrides: { user?: Partial<User>; page?: Partial<Page> | false } = {},
) {
  const user = buildUser(overrides.user)
  const session = buildSession({ userId: user.id })

  store.users.push(user)
  store.sessions.push(session)

  const page = overrides.page === false ? null : buildPage({ userId: user.id, ...overrides.page })

  if (page) store.pages.push(page)

  const token = app.jwt.sign({ sub: user.id, sid: session.id })

  return { user, session, page, headers: { authorization: `Bearer ${token}` } }
}
