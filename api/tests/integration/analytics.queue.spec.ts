import { afterEach, describe, expect, it } from 'bun:test'
import { Queue, Worker } from 'bullmq'
import { Redis } from 'ioredis'

const url = process.env.QUEUE_REDIS_TEST_URL ?? ''

const retry = { attempts: 3, backoff: { type: 'fixed' as const, delay: 50 } }

type Processor = (job: { data: { eventId: string }; attemptsMade: number }) => Promise<unknown>

describe.skipIf(!url)('analytics queue on Redis', () => {
  const queues: Queue[] = []

  const workers: Worker[] = []

  function createQueue() {
    const queue = new Queue(`analytics-test-${crypto.randomUUID()}`, {
      connection: new Redis(url, { maxRetriesPerRequest: null }),
    })

    queues.push(queue)

    return queue
  }

  function startWorker(
    queue: Queue,
    processor: Processor,
    options: { lockDuration?: number; stalledInterval?: number } = {},
  ) {
    const worker = new Worker(queue.name, processor, {
      connection: new Redis(url, { maxRetriesPerRequest: null }),
      ...options,
    })

    workers.push(worker)

    return worker
  }

  function completion(worker: Worker, eventId: string) {
    return new Promise<void>((resolve) => {
      worker.on('completed', (job) => {
        if (job.data.eventId === eventId) resolve()
      })
    })
  }

  afterEach(async () => {
    await Promise.all(workers.splice(0).map((worker) => worker.close(true)))

    for (const queue of queues.splice(0)) {
      await queue.obliterate({ force: true })

      await queue.close()
    }
  })

  it('retries a job that fails on the first attempt', async () => {
    const queue = createQueue()

    const counted: string[] = []

    const worker = startWorker(queue, async (job) => {
      if (job.attemptsMade === 0) throw new Error('boom')

      counted.push(job.data.eventId)
    })

    const done = completion(worker, 'retry')

    await queue.add('view', { eventId: 'retry' }, { jobId: 'retry', ...retry })

    await done

    expect(counted).toEqual(['retry'])
  })

  it('does not duplicate a job added twice with the same jobId', async () => {
    const queue = createQueue()

    await queue.add('view', { eventId: 'dup' }, { jobId: 'dup' })

    await queue.add('view', { eventId: 'dup' }, { jobId: 'dup' })

    const jobs = await queue.getJobs(['waiting', 'delayed', 'active', 'completed'])

    expect(jobs.filter((job) => job.id === 'dup')).toHaveLength(1)
  })

  it('recovers a job from a worker closed in the middle of it', async () => {
    const queue = createQueue()

    const timing = { lockDuration: 1000, stalledInterval: 500 }

    const hung = startWorker(queue, () => new Promise(() => {}), timing)

    const started = new Promise<void>((resolve) => hung.on('active', () => resolve()))

    await queue.add('view', { eventId: 'crashed' }, { jobId: 'crashed', ...retry })

    await started

    await hung.close(true)

    const recovered = startWorker(queue, async () => undefined, timing)

    await completion(recovered, 'crashed')
  }, 15_000)
})
