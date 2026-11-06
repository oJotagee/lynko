import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'
import { createTestApp, signIn } from '../support/app'
import { useInMemoryRepositories } from '../support/memory-repositories'

describe('global rate limit', () => {
  let store: ReturnType<typeof useInMemoryRepositories>

  let app: Awaited<ReturnType<typeof createTestApp>>

  beforeEach(async () => {
    store = useInMemoryRepositories()

    app = await createTestApp()
  })

  afterEach(async () => {
    await app.close()

    mock.restore()
  })

  async function statuses(headers: Record<string, string>, count: number, url = '/users/me') {
    const result: number[] = []

    for (let index = 0; index < count; index += 1) {
      result.push((await app.inject({ method: 'GET', url, headers })).statusCode)
    }

    return result
  }

  it('counts each signed-in user separately even from the same address', async () => {
    const first = signIn(app, store, { user: { email: 'a@example.com' } })

    const second = signIn(app, store, { user: { email: 'b@example.com' } })

    const firstStatuses = await statuses(first.headers, 101)

    expect(firstStatuses.slice(0, 100).every((status) => status === 200)).toBe(true)
    expect(firstStatuses[100]).toBe(429)
    expect(await statuses(second.headers, 1)).toEqual([200])
  })

  it('keeps limiting anonymous requests by address', async () => {
    const result = await statuses({}, 101, '/health')

    expect(result[99]).toBe(200)
    expect(result[100]).toBe(429)
  })
})
