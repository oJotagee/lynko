import { afterAll, describe, expect, it } from 'bun:test'
import { createServer } from 'node:http'

import { api } from '@/lib/api'

const server = createServer((request, response) => {
  response.setHeader('content-type', 'application/json')
  response.end(JSON.stringify({ contentType: request.headers['content-type'] ?? null }))
}).listen(0)

const { port } = server.address() as { port: number }
const url = `http://localhost:${port}/echo`

afterAll(() => {
  server.close()
})

describe('api', () => {
  it('does not declare a JSON body on a DELETE without body', async () => {
    const { data } = await api.delete(url)

    expect(data).toEqual({ contentType: null })
  })

  it('does not declare a JSON body on a POST without body', async () => {
    const { data } = await api.post(url, null)

    expect(data).toEqual({ contentType: null })
  })

  it('sends JSON when there is a body', async () => {
    const { data } = await api.post(url, { title: 'Blog' })

    expect(data.contentType).toContain('application/json')
  })
})
