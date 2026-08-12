import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { after, describe, it } from 'node:test'

/**
 * Instagram token renewal.
 *
 * This API has no refresh token. The long-lived token is its own renewal
 * credential, so the chain has to be kept alive: miss the window and there is
 * nothing left to renew from and the only fix is a human pasting a new token
 * in. That makes the "when do we renew" decision worth pinning down, because
 * getting it wrong is silent until the day it isn't.
 */

const DAY = 24 * 60 * 60_000
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tokens-'))

process.env.INSTAGRAM_ACCESS_TOKEN = 'from-env'

after(() => fs.rmSync(dir, { recursive: true, force: true }))

let refreshCalls = 0
const real = globalThis.fetch

globalThis.fetch = async (url, init) => {
  const href = String(url)
  if (!href.includes('graph.instagram.com')) return real(url, init)

  if (href.includes('refresh_access_token')) {
    refreshCalls += 1
    return new Response(
      JSON.stringify({ access_token: 'renewed', token_type: 'bearer', expires_in: 60 * 86_400 }),
      { headers: { 'Content-Type': 'application/json' } },
    )
  }

  throw new Error(`Unexpected Instagram call: ${href}`)
}

const { startTokenRenewal } = await import('../src/apis/instagram.js')

let caseNumber = 0

/** Each case gets its own store file, so nothing one writes reaches the next. */
async function withStore(record) {
  const file = path.join(dir, `case-${(caseNumber += 1)}.json`)
  process.env.TOKENS_FILE = file
  if (record) fs.writeFileSync(file, JSON.stringify({ instagram_access_token: record }))

  refreshCalls = 0
  startTokenRenewal()
  // The first check is kicked off without being awaited.
  await new Promise((resolve) => setImmediate(resolve))
  await new Promise((resolve) => setImmediate(resolve))

  const stored = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {}
  return { refreshCalls, stored }
}

const iso = (offsetMs) => new Date(Date.now() + offsetMs).toISOString()

describe('instagram token renewal', () => {
  it('renews a token with nothing recorded about it', async () => {
    const { refreshCalls } = await withStore(null)
    assert.equal(refreshCalls, 1, 'an unknown lifetime has to be established')
  })

  it('leaves a confirmed token alone when it has weeks left', async () => {
    const { refreshCalls } = await withStore({
      value: 'live',
      updated: iso(-10 * DAY),
      expires: iso(50 * DAY),
    })
    assert.equal(refreshCalls, 0)
  })

  it('renews a confirmed token inside the two week margin', async () => {
    const { refreshCalls } = await withStore({
      value: 'live',
      updated: iso(-50 * DAY),
      expires: iso(10 * DAY),
    })
    assert.equal(refreshCalls, 1)
  })

  it('waits out the 24 hour lockout before confirming a guessed expiry', async () => {
    const { refreshCalls } = await withStore({
      value: 'fresh',
      updated: iso(-2 * 60 * 60_000),
      expires: iso(60 * DAY),
      estimated: true,
    })
    assert.equal(refreshCalls, 0, 'Meta rejects a refresh under 24 hours old')
  })

  it('confirms a guessed expiry once the token is old enough', async () => {
    const { refreshCalls, stored } = await withStore({
      value: 'day-old',
      updated: iso(-26 * 60 * 60_000),
      expires: iso(59 * DAY),
      estimated: true,
    })

    assert.equal(refreshCalls, 1, 'a guess should be replaced with the real expiry')
    assert.equal(stored.instagram_access_token.value, 'renewed')
    assert.equal(
      stored.instagram_access_token.estimated,
      undefined,
      'the expiry is now measured, not guessed',
    )
  })

  it('does not keep re-confirming a token it has already measured', async () => {
    const { refreshCalls } = await withStore({
      value: 'measured',
      updated: iso(-26 * 60 * 60_000),
      expires: iso(59 * DAY),
    })
    assert.equal(refreshCalls, 0)
  })
})
