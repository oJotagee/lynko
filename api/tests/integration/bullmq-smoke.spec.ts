import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { Queue, Worker } from 'bullmq'
import { Redis } from 'ioredis'

const url = process.env.QUEUE_REDIS_TEST_URL ?? ''

describe.skipIf(!url)('BullMQ on Bun', () => {
  const queueName = `smoke-${crypto.randomUUID()}`

  let connection: Redis

  let queue: Queue

  beforeAll(() => {
    connection = new Redis(url, { maxRetriesPerRequest: null })

    queue = new Queue(queueName, { connection })
  })

  afterAll(async () => {
    await queue.obliterate({ force: true })

    await queue.close()

    connection.disconnect()
  })

  it('processes a job end to end', async () => {
    const worker = new Worker(queueName, async (job) => job.data.value * 2, {
      connection: new Redis(url, { maxRetriesPerRequest: null }),
    })

    const completed = new Promise<unknown>((resolve) => {
      worker.on('completed', (_job, result) => resolve(result))
    })

    await queue.add('double', { value: 21 })

    expect(await completed).toBe(42)

    await worker.close()
  })
})
