import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { cached, invalidate } from '../src/lib/cache.js'

describe('cache', () => {
  it('calls upstream once and reuses the answer', async () => {
    let calls = 0
    const produce = async () => {
      calls += 1
      return 'value'
    }

    assert.equal(await cached('a', 60_000, produce), 'value')
    assert.equal(await cached('a', 60_000, produce), 'value')
    assert.equal(calls, 1)
  })

  it('goes back upstream once the entry is stale', async () => {
    let calls = 0
    const produce = async () => `call ${(calls += 1)}`

    assert.equal(await cached('b', 20, produce), 'call 1')
    await new Promise((resolve) => setTimeout(resolve, 40))
    assert.equal(await cached('b', 20, produce), 'call 2')
  })

  it('collapses concurrent misses into one upstream call', async () => {
    // The case this exists for: a cold cache and several visitors at once. Ten
    // page loads should not become ten identical requests to somebody's API.
    let calls = 0
    const produce = async () => {
      calls += 1
      await new Promise((resolve) => setTimeout(resolve, 50))
      return 'shared'
    }

    const results = await Promise.all(Array.from({ length: 10 }, () => cached('c', 60_000, produce)))

    assert.equal(calls, 1)
    assert.deepEqual(new Set(results), new Set(['shared']))
  })

  it('serves the old answer when the upstream fails', async () => {
    let fail = false
    const produce = async () => {
      if (fail) throw new Error('upstream down')
      return 'good'
    }

    assert.equal(await cached('d', 20, produce), 'good')
    fail = true
    await new Promise((resolve) => setTimeout(resolve, 40))

    assert.equal(
      await cached('d', 20, produce),
      'good',
      'a few minutes stale beats a blank section',
    )
  })

  it('reports the failure when there is nothing to fall back on', async () => {
    await assert.rejects(
      cached('e', 20, async () => {
        throw new Error('upstream down')
      }),
      /upstream down/,
    )
  })

  it('drops entries by prefix', async () => {
    let calls = 0
    const produce = async () => `call ${(calls += 1)}`

    await cached('pre:one', 60_000, produce)
    invalidate('pre:')
    await cached('pre:one', 60_000, produce)
    assert.equal(calls, 2)
  })
})
