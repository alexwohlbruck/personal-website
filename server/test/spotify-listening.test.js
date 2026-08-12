import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

/**
 * The player's sidekick, against a Spotify that only half answers.
 *
 * The interesting behaviour is not the happy path. `user-top-read` and
 * `user-library-read` are two different scopes, so a token can have one
 * without the other, and Spotify answers 403 for whichever is missing. The
 * whole point of assembling this with settled promises is that liked songs and
 * the top artists/genres fail independently — a regression here would show up
 * as one missing scope taking the whole section down with it.
 *
 * Its own file, because the api module caches per key for hours and a payload
 * from another test would answer these questions for it.
 */

process.env.SPOTIFY_CLIENT_ID = 'test-id'
process.env.SPOTIFY_CLIENT_SECRET = 'test-secret'
process.env.SPOTIFY_REFRESH_TOKEN = 'test-refresh'

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

const forbidden = () => json({ error: { status: 403, message: 'Insufficient client scope' } }, 403)

const track = (id, name) => ({
  id,
  name,
  duration_ms: 200_000,
  external_urls: { spotify: `https://open.spotify.com/track/${id}` },
  album: {
    name: 'An Album',
    images: [
      { url: `https://art/${id}-640`, width: 640, height: 640 },
      { url: `https://art/${id}-160`, width: 160, height: 160 },
    ],
  },
  artists: [{ name: 'Somebody' }, { name: 'Someone Else' }],
})

const artist = (name, genres, rank) => ({
  id: `artist-${rank}`,
  name,
  genres,
  external_urls: { spotify: `https://open.spotify.com/artist/${rank}` },
  images: [
    { url: `https://img/${rank}-640`, width: 640, height: 640 },
    { url: `https://img/${rank}-160`, width: 160, height: 160 },
    { url: `https://img/${rank}-64`, width: 64, height: 64 },
  ],
})

const real = globalThis.fetch

/** Top artists answer fine; liked songs are behind a scope this token lacks. */
globalThis.fetch = async (url, init) => {
  const href = String(url)
  if (!href.includes('spotify.com')) return real(url, init)

  if (href.includes('accounts.spotify.com')) {
    return json({ access_token: 'test-access', expires_in: 3600 })
  }

  if (href.includes('/me/tracks')) return forbidden()

  if (href.includes('/me/top/artists')) {
    return json({
      items: [artist('Lead', ['jazz funk', 'funk'], 0), artist('Second', ['jazz funk'], 1)],
    })
  }

  throw new Error(`Unexpected fetch: ${href}`)
}

const { getListening, getLikedTracks, getTop } = await import('../src/apis/spotify.js')

describe('current music with the library scope missing', () => {
  it('keeps the panels it can fill and nulls only the one it cannot', async () => {
    const data = await getListening()

    assert.equal(data.liked, null, 'liked songs need a scope this token lacks')
    assert.ok(data.ranges.month, 'top artists survive the 403 beside them')
    assert.ok(data.ranges.sixMonths)
    assert.ok(data.ranges.allTime)
  })

  it('reports the failure when asked for the scoped panel directly', async () => {
    await assert.rejects(() => getLikedTracks(3), /403/)
  })

  it('rejects a window it does not have', async () => {
    await assert.rejects(() => getTop('lastTuesday'), /Unknown range/)
  })
})

describe('genre tallying', async () => {
  const top = [
    artist('Lead', ['jazz funk', 'funk'], 0),
    artist('Second', ['jazz funk'], 1),
    artist('Third', ['bedroom pop'], 2),
  ]

  const previous = globalThis.fetch
  globalThis.fetch = async (url, init) => {
    const href = String(url)
    if (href.includes('/me/top/artists')) return json({ items: top })
    return previous(url, init)
  }

  const { genres, artists } = await getTop('sixMonths')
  globalThis.fetch = previous

  it('ranks genres by weight, leader first', () => {
    assert.equal(genres[0].name, 'jazz funk')
    assert.equal(genres[0].weight, 1, 'the leader is always the unit')
    // 'funk' scores 3 from the top artist; 'jazz funk' scores 3 + 2 = 5.
    assert.equal(genres.find((genre) => genre.name === 'funk').weight, 0.6)
    assert.equal(genres.find((genre) => genre.name === 'bedroom pop').weight, 0.2)
  })

  it('picks an image sized for the slot rather than the largest', () => {
    assert.equal(artists[0].image, 'https://img/0-160')
  })
})

describe('list shaping', async () => {
  const previous = globalThis.fetch
  globalThis.fetch = async (url, init) => {
    const href = String(url)
    if (href.includes('/me/tracks')) {
      return json({ items: [{ added_at: '2026-08-10T12:00:00Z', track: track('t', 'A Track') }] })
    }
    return previous(url, init)
  }

  const liked = await getLikedTracks(1)
  globalThis.fetch = previous

  it('flattens a track down to what a list row needs', () => {
    assert.deepEqual(liked[0], {
      id: 't',
      name: 'A Track',
      url: 'https://open.spotify.com/track/t',
      artists: 'Somebody, Someone Else',
      album: 'An Album',
      // Sized for the slot rather than the largest on offer.
      artwork: 'https://art/t-160',
      duration_ms: 200_000,
      added_at: '2026-08-10T12:00:00Z',
    })
  })
})
