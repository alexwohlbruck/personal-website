import assert from 'node:assert/strict'
import { after, before, describe, it } from 'node:test'

/**
 * A dead Spotify integration has to look different from a quiet one.
 *
 * "Nothing playing" is a normal answer and the site renders it quietly, on
 * purpose. That makes it the perfect place for a real fault to hide: an expired
 * refresh token produces exactly the same empty result, and the page looks
 * fine, so nobody finds out until they think to check. This lives in its own
 * file because the poller holds its state for the life of the process, and a
 * cached track from another test would mask the very thing being tested.
 */

process.env.SPOTIFY_CLIENT_ID = 'test-id'
process.env.SPOTIFY_CLIENT_SECRET = 'test-secret'
process.env.SPOTIFY_REFRESH_TOKEN = 'revoked'

const real = globalThis.fetch

globalThis.fetch = async (url, init) => {
  const href = String(url)
  if (!href.includes('spotify.com')) return real(url, init)

  // What Spotify actually returns for a refresh token that has been revoked.
  return new Response(
    JSON.stringify({ error: 'invalid_grant', error_description: 'Invalid refresh token' }),
    { status: 400, headers: { 'Content-Type': 'application/json' } },
  )
}

const { default: express } = await import('express')
const { default: routes } = await import('../src/routes/index.js')

let server
let base

before(async () => {
  const app = express()
  app.use('/', routes)
  app.use((err, req, res, next) => res.status(err.status ?? 500).json({ message: err.message }))
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', resolve)
  })
  base = `http://127.0.0.1:${server.address().port}`
})

after(() => server?.close())

describe('a broken spotify token', () => {
  it('answers with a failure, not an empty body', async () => {
    const response = await fetch(`${base}/spotify/playback-state`)
    const body = await response.json()

    assert.equal(response.status, 502, 'a revoked token must not read as silence')
    assert.match(body.message, /unavailable/i)
  })

  it('still reports the integration as configured', async () => {
    // Credentials being present and credentials working are different
    // questions, and /health only claims to answer the first.
    const { integrations } = await (await fetch(`${base}/health`)).json()
    assert.equal(integrations.spotify, true)
  })
})
