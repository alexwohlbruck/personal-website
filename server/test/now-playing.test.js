import assert from 'node:assert/strict'
import { after, before, describe, it } from 'node:test'

/**
 * The shared poller and its SSE stream, against a stubbed Spotify.
 *
 * This is the one piece here with behaviour worth pinning down: everything else
 * forwards a request to somebody else's API, but this decides when to call out,
 * who to tell, and when to stop, and none of that is visible from the outside
 * until it goes wrong in production.
 */

process.env.SPOTIFY_CLIENT_ID = 'test-id'
process.env.SPOTIFY_CLIENT_SECRET = 'test-secret'
process.env.SPOTIFY_REFRESH_TOKEN = 'test-refresh'

/** How many times the stub was asked for playback, so we can prove the number
 *  of Spotify calls does not scale with the number of listeners. */
let playbackCalls = 0
let track = 'First Song'
let playing = true

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

// The tests talk to their own server over the same global, so anything that is
// not Spotify has to go through untouched.
const realFetch = globalThis.fetch

globalThis.fetch = async (url, init) => {
  const href = String(url)

  if (!href.includes('spotify.com')) return realFetch(url, init)

  if (href.includes('accounts.spotify.com')) {
    return json({ access_token: 'test-access', expires_in: 3600 })
  }

  if (href.includes('/me/player/recently-played')) {
    return json({ items: [{ played_at: '2026-08-11T00:00:00Z', track: makeTrack(track) }] })
  }

  if (href.includes('/me/player/queue')) {
    return json({ queue: [makeTrack('Next Song', '2up3OPMp9Tb4dAKM2erWXQ')] })
  }

  if (href.includes('/me/player')) {
    playbackCalls += 1
    if (!playing) return new Response(null, { status: 204 })
    return json({
      is_playing: true,
      timestamp: 1_000,
      progress_ms: 1_000,
      currently_playing_type: 'track',
      item: makeTrack(track),
    })
  }

  throw new Error(`Unexpected fetch: ${href}`)
}

/** Short enough that the poller's next check lands on its 5s floor rather than
 *  its 30s ceiling, so these tests take seconds instead of half a minute. */
const DURATION = 4_000

function makeTrack(name, id = '4uLU6hMCjMI75M1A2tKUQC') {
  return {
    id,
    name,
    duration_ms: DURATION,
    // Fields Spotify has since removed, to prove they do not reach the client.
    popularity: 61,
    available_markets: ['US'],
    external_urls: { spotify: 'https://open.spotify.com/track/x' },
    album: { images: [{ url: 'https://i/1.jpg', width: 640, height: 640 }] },
    artists: [{ name: 'Someone', external_urls: { spotify: 'https://open.spotify.com/artist/y' } }],
  }
}

const { default: express } = await import('express')
const { default: routes } = await import('../src/routes/index.js')

let server
let base

before(async () => {
  const app = express()
  app.use(express.json())
  app.use('/', routes)
  app.use((err, req, res, next) => res.status(err.status ?? 500).json({ message: err.message }))

  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', resolve)
  })
  base = `http://127.0.0.1:${server.address().port}`
})

after(() => server?.close())

/** Read SSE frames off a live response until `count` of them have arrived. */
async function readFrames(response, count, signal) {
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  const frames = []
  let buffer = ''

  while (frames.length < count) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    let split
    while ((split = buffer.indexOf('\n\n')) !== -1) {
      const raw = buffer.slice(0, split)
      buffer = buffer.slice(split + 2)
      if (raw.startsWith(':')) continue // heartbeat
      const data = raw.split('\n').find((line) => line.startsWith('data: '))
      if (data) frames.push(JSON.parse(data.slice(6)))
    }
  }

  reader.cancel().catch(() => {})
  signal?.abort()
  return frames
}

describe('now playing', () => {
  it('shapes the payload down to what the site renders', async () => {
    const state = await (await fetch(`${base}/spotify/playback-state`)).json()

    assert.equal(state.item.name, 'First Song')
    assert.equal(state.item.id, '4uLU6hMCjMI75M1A2tKUQC')
    assert.equal(state.next_item.name, 'Next Song')
    assert.equal(state.is_playing, true)
    assert.deepEqual(Object.keys(state).sort(), ['is_playing', 'item', 'next_item', 'progress_ms', 'timestamp'])
    assert.equal(state.item.popularity, undefined)
    assert.equal(state.item.available_markets, undefined)
  })

  it('serves repeat callers from cache instead of calling Spotify again', async () => {
    const before = playbackCalls
    await Promise.all(
      Array.from({ length: 5 }, () => fetch(`${base}/spotify/playback-state`).then((r) => r.json())),
    )
    assert.equal(playbackCalls, before, 'five requests should cost zero extra Spotify calls')
  })

  it('moves a playing track forward by however long the cache is old', async () => {
    // The cache is what lets one Spotify call serve everyone, but a playing
    // track keeps playing after it is stored. Someone arriving between polls
    // should get the position now, not the position when it was measured.
    const first = await (await fetch(`${base}/spotify/playback-state`)).json()
    await new Promise((resolve) => setTimeout(resolve, 2_000))
    const later = await (await fetch(`${base}/spotify/playback-state`)).json()

    const advanced = later.progress_ms - first.progress_ms
    assert.ok(advanced >= 1_500, `expected the position to advance, moved ${advanced}ms`)
    assert.ok(later.progress_ms <= later.item.duration_ms, 'never past the end of the track')
  })

  it('does not report a cache header on a live position', async () => {
    const response = await fetch(`${base}/spotify/playback-state`)
    assert.equal(response.headers.get('cache-control'), 'no-store')
  })

  it('opens a stream with the current track', async () => {
    const controller = new AbortController()
    const response = await fetch(`${base}/spotify/stream`, { signal: controller.signal })

    assert.equal(response.status, 200)
    assert.match(response.headers.get('content-type'), /text\/event-stream/)
    assert.equal(response.headers.get('cache-control'), 'no-cache, no-transform')

    const [first] = await readFrames(response, 1, controller)
    assert.equal(first.item.name, 'First Song')
  })

  it('pushes a frame when the track changes', { timeout: 20_000 }, async () => {
    const controller = new AbortController()
    const response = await fetch(`${base}/spotify/stream`, { signal: controller.signal })

    const framesPromise = readFrames(response, 2, controller)
    // Nobody asks for the second frame. Change what Spotify would say, then
    // wait to be told, which is the whole point of the stream.
    setTimeout(() => {
      track = 'Second Song'
    }, 50)

    const frames = await framesPromise
    assert.equal(frames[0].item.name, 'First Song')
    assert.equal(frames[1].item.name, 'Second Song')
  })

  it('falls back to history when nothing is playing', { timeout: 20_000 }, async () => {
    playing = false
    track = 'Last Song'

    // Wait out one poll interval so the loop picks up the 204.
    await new Promise((resolve) => setTimeout(resolve, 7_000))

    const state = await (await fetch(`${base}/spotify/playback-state`)).json()
    assert.equal(state.is_playing, false)
    assert.equal(state.item.name, 'Last Song')
    assert.equal(state.progress_ms, state.item.duration_ms, 'a finished track reads as complete')
  })
})
