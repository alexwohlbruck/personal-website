import { config } from '../config.js'
import { cached } from '../lib/cache.js'
import { getToken, setToken } from '../tokens.js'
import { ApiError, fetchJson, log } from '../util.js'

const ACCOUNTS = 'https://accounts.spotify.com/api/token'
const API = 'https://api.spotify.com/v1'

/**
 * Scopes the site needs. All of them are reads: nothing here can change what is
 * playing, follow anyone, or edit a playlist.
 *
 * Deliberately absent is `playlist-read-private`. The playlists on the site are
 * fetched from the public profile endpoint instead, so a playlist that is not
 * public cannot reach the page even by mistake. See `getPlaylists`.
 */
export const SCOPES = [
  'user-read-playback-state',
  'user-read-recently-played',
  // Top artists and tracks, which is also where the genre tally comes from.
  'user-top-read',
  // Liked songs and saved podcasts.
  'user-library-read',
]

const basicAuth = () =>
  `Basic ${Buffer.from(`${config.spotify.clientId}:${config.spotify.clientSecret}`).toString('base64')}`

let accessToken
let expiresAt = 0
let inflight

/**
 * Access tokens last an hour. Rather than a boot-time timer that refreshes on a
 * schedule whether or not anyone is looking, mint one when a call needs it and
 * keep it until it is nearly out. `inflight` means a burst of concurrent
 * requests shares a single refresh instead of racing to spend the same code.
 */
async function getAccessToken() {
  if (accessToken && Date.now() < expiresAt) return accessToken
  if (inflight) return inflight

  inflight = (async () => {
    const refreshToken = getToken('spotify_refresh_token', config.spotify.refreshToken)
    if (!refreshToken) throw new ApiError('Spotify is not configured', 503)

    const body = await fetchJson(ACCOUNTS, {
      method: 'POST',
      headers: {
        Authorization: basicAuth(),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken }),
    })

    accessToken = body.access_token
    // A minute of headroom so a token never expires mid-request.
    expiresAt = Date.now() + (Number(body.expires_in) - 60) * 1000

    // Spotify may hand back a new refresh token, and when it does the old one
    // stops working. Persisting it is the difference between this surviving a
    // restart and going quiet until someone re-runs the auth script.
    if (body.refresh_token && body.refresh_token !== refreshToken) {
      setToken('spotify_refresh_token', body.refresh_token)
      log('Spotify issued a new refresh token, saved it', 'FgYellow')
    }

    return accessToken
  })()

  try {
    return await inflight
  } finally {
    inflight = undefined
  }
}

async function call(path) {
  const token = await getAccessToken()
  return fetchJson(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` } })
}

/** Only the fields the site renders. Keeps the payload small and the client
 *  insulated from Spotify's habit of removing object fields. */
function shapeTrack(track) {
  if (!track) return null
  return {
    name: track.name,
    duration_ms: track.duration_ms,
    external_urls: { spotify: track.external_urls?.spotify ?? '' },
    album: {
      images: (track.album?.images ?? []).map(({ url, width, height }) => ({ url, width, height })),
    },
    artists: (track.artists ?? []).map((artist) => ({
      name: artist.name,
      external_urls: { spotify: artist.external_urls?.spotify ?? '' },
    })),
  }
}

/**
 * What is playing, or what was playing last.
 *
 * `/me/player` answers 204 with no body when nothing is active, which is the
 * common case for a personal site: most of the time the answer is "here is the
 * last thing he listened to".
 */
export async function getPlaybackState() {
  const playback = await call('/me/player')

  // Podcasts get skipped rather than shown, so fall through to history.
  const playingTrack =
    playback?.item && playback.currently_playing_type !== 'episode' && playback.timestamp

  if (playingTrack) {
    return {
      is_playing: Boolean(playback.is_playing),
      timestamp: playback.timestamp,
      progress_ms: playback.progress_ms ?? 0,
      item: shapeTrack(playback.item),
    }
  }

  const history = await call('/me/player/recently-played?limit=1')
  const last = history?.items?.[0]
  if (!last) return null

  return {
    is_playing: false,
    timestamp: last.played_at,
    progress_ms: last.track.duration_ms,
    item: shapeTrack(last.track),
  }
}

/* -----------------------------------------------------------------------------
   Listening habits

   Everything below feeds one section of the site rather than the live ticker,
   so it is cached far harder than playback is. Top artists move on Spotify's
   own weekly-ish schedule and a playlist shelf is the same all month, so asking
   again inside a few hours would only buy a slower page.
----------------------------------------------------------------------------- */

const HOUR = 60 * 60_000
const TTL = {
  /** Spotify recomputes these on its own slow cadence. */
  top: 6 * HOUR,
  /** The only one that moves during a listening session. */
  recent: 5 * 60_000,
  liked: 30 * 60_000,
  playlists: 12 * HOUR,
  shows: 12 * HOUR,
  profile: 24 * HOUR,
}

/**
 * Spotify hands back two or three sizes, largest first. Take the smallest one
 * that still covers the slot: a 48px avatar has no use for a 640px file, and
 * this section shows a lot of them at once.
 */
function pickImage(images, min = 160) {
  const usable = (images ?? []).filter((image) => image?.url)
  const big = usable.filter((image) => (image.width ?? 0) >= min)
  return (big.length ? big[big.length - 1] : usable[0])?.url ?? null
}

const shapeArtist = (artist) => ({
  id: artist.id,
  name: artist.name,
  url: artist.external_urls?.spotify ?? '',
  image: pickImage(artist.images, 160),
  genres: artist.genres ?? [],
})

/** A track as it appears in a list, rather than in the player. Flat, because
 *  nothing in these lists needs the nested album and artist objects. */
const shapeListTrack = (track) => ({
  id: track.id,
  name: track.name,
  url: track.external_urls?.spotify ?? '',
  artists: (track.artists ?? []).map((artist) => artist.name).join(', '),
  album: track.album?.name ?? '',
  artwork: pickImage(track.album?.images, 160),
  duration_ms: track.duration_ms ?? 0,
})

/**
 * Genres, inferred.
 *
 * Spotify has no "my genres" endpoint. What it has is a genre list per artist,
 * so the answer to "what has he been listening to lately" is a tally over the
 * top artists of a period. Rank carries weight: the artist at the top of the
 * list says more about the month than the one at the bottom, so a linear
 * falloff keeps a single tail artist from inventing a genre that is not really
 * there.
 *
 * Scores come back relative to the leader rather than as raw totals, since the
 * absolute number means nothing to a reader and everything to a bar width.
 */
function tallyGenres(artists, limit = 8) {
  const scores = new Map()

  artists.forEach((artist, index) => {
    const weight = artists.length - index
    for (const genre of artist.genres) {
      scores.set(genre, (scores.get(genre) ?? 0) + weight)
    }
  })

  const ranked = [...scores].sort(([, a], [, b]) => b - a).slice(0, limit)
  const leader = ranked[0]?.[1] || 1

  return ranked.map(([name, score]) => ({ name, weight: Math.round((score / leader) * 100) / 100 }))
}

/** Spotify's own windows, under names that mean something on the page. */
export const RANGES = {
  month: 'short_term',
  sixMonths: 'medium_term',
  allTime: 'long_term',
}

/**
 * Top artists, top tracks and the genres they add up to, for one window.
 *
 * Artists are fetched fifty deep but only a dozen are returned. The rest exist
 * to make the genre tally worth reading, since a count over twelve artists is
 * mostly noise.
 */
export async function getTop(range = 'month', { artists = 12, tracks = 10 } = {}) {
  const window = RANGES[range]
  if (!window) throw new ApiError(`Unknown range: ${range}`, 400)

  return cached(`spotify:top:${range}`, TTL.top, async () => {
    const [topArtists, topTracks] = await Promise.all([
      call(`/me/top/artists?time_range=${window}&limit=50`),
      call(`/me/top/tracks?time_range=${window}&limit=${tracks}`),
    ])

    const shaped = (topArtists?.items ?? []).map(shapeArtist)

    return {
      artists: shaped.slice(0, artists),
      genres: tallyGenres(shaped),
      tracks: (topTracks?.items ?? []).map(shapeListTrack),
    }
  })
}

/**
 * The last few things played, most recent first.
 *
 * Deduplicated by track, because leaving a record on repeat fills all fifty
 * slots of the history with one song and the list stops being a list. Fetching
 * the full fifty and thinning it down is what leaves enough distinct tracks to
 * show afterwards.
 */
export async function getRecentlyPlayed(limit = 12) {
  return cached(`spotify:recent:${limit}`, TTL.recent, async () => {
    const body = await call('/me/player/recently-played?limit=50')

    const seen = new Set()
    const tracks = []

    for (const item of body?.items ?? []) {
      if (!item?.track?.id || seen.has(item.track.id)) continue
      seen.add(item.track.id)
      tracks.push({ ...shapeListTrack(item.track), played_at: item.played_at })
      if (tracks.length === limit) break
    }

    return tracks
  })
}

/** Most recently liked songs, newest first. Spotify returns them in save
 *  order, which is exactly the order worth showing. */
export async function getLikedTracks(limit = 8) {
  return cached(`spotify:liked:${limit}`, TTL.liked, async () => {
    const body = await call(`/me/tracks?limit=${limit}`)
    return (body?.items ?? [])
      .filter((item) => item?.track)
      .map((item) => ({ ...shapeListTrack(item.track), added_at: item.added_at }))
  })
}

/** The public profile, for the user id the playlist call needs. Cached for a
 *  day: a Spotify user id is not a thing that changes. */
async function getProfile() {
  return cached('spotify:profile', TTL.profile, () => call('/me'))
}

/**
 * Public playlists.
 *
 * Read through `/users/{id}/playlists` rather than `/me/playlists`, which is
 * the same list for a token with no private scope but stops being the same list
 * the moment somebody adds one. This endpoint cannot return a private playlist
 * whatever the token is allowed to do, which is the property worth having when
 * the output is going on a public page. The `public !== false` filter is a
 * second lock on the same door.
 *
 * The order is the one Spotify shows on the profile, which the account owner
 * controls, so the first few are the ones they chose to front.
 */
export async function getPlaylists(limit = 8) {
  return cached(`spotify:playlists:${limit}`, TTL.playlists, async () => {
    const me = await getProfile()
    if (!me?.id) return { items: [], total: 0 }

    const body = await call(`/users/${encodeURIComponent(me.id)}/playlists?limit=50`)
    const all = (body?.items ?? []).filter(
      (playlist) => playlist?.public !== false && (playlist?.tracks?.total ?? 0) > 0,
    )

    return {
      items: all.slice(0, limit).map((playlist) => ({
        id: playlist.id,
        name: playlist.name,
        url: playlist.external_urls?.spotify ?? '',
        image: pickImage(playlist.images, 240),
        description: playlist.description ?? '',
        tracks: playlist.tracks?.total ?? 0,
      })),
      // The count is the fun part: eight tiles read very differently under
      // "and ninety more".
      total: body?.total ?? all.length,
    }
  })
}

/** Saved podcasts, newest first. */
export async function getSavedShows(limit = 8) {
  return cached(`spotify:shows:${limit}`, TTL.shows, async () => {
    const body = await call(`/me/shows?limit=${limit}`)
    return (body?.items ?? [])
      .filter((item) => item?.show)
      .map((item) => ({
        id: item.show.id,
        name: item.show.name,
        url: item.show.external_urls?.spotify ?? '',
        image: pickImage(item.show.images, 240),
        publisher: item.show.publisher ?? '',
        added_at: item.added_at,
      }))
  })
}

/**
 * The whole listening section in one response.
 *
 * Settled rather than awaited together, and every part is independently
 * nullable. Half of this needs scopes the older refresh tokens were never
 * granted, so on a token minted before those existed the top artists come back
 * 403 while the playlists come back fine. One 403 emptying the entire section
 * would be a bad trade for a page that reads perfectly well with four panels
 * instead of six.
 */
export async function getListening() {
  const parts = {
    month: () => getTop('month'),
    sixMonths: () => getTop('sixMonths'),
    allTime: () => getTop('allTime'),
    recent: () => getRecentlyPlayed(),
    liked: () => getLikedTracks(),
    playlists: () => getPlaylists(),
    shows: () => getSavedShows(),
  }

  const names = Object.keys(parts)
  const settled = await Promise.allSettled(names.map((name) => parts[name]()))

  const result = {}
  for (const [index, name] of names.entries()) {
    const outcome = settled[index]
    if (outcome.status === 'fulfilled') {
      result[name] = outcome.value
    } else {
      result[name] = null
      log(`Spotify ${name} unavailable: ${outcome.reason?.message}`, 'FgYellow')
    }
  }

  const { month, sixMonths, allTime, ...rest } = result
  return { ranges: { month, sixMonths, allTime }, ...rest }
}

/** Where to send a browser to grant the scopes above. */
export function authorizeUrl(state) {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.spotify.clientId ?? '',
    scope: SCOPES.join(' '),
    redirect_uri: config.spotify.redirectUri,
    ...(state ? { state } : {}),
  })
  return `https://accounts.spotify.com/authorize?${params}`
}

/** Trade the one-time code from that redirect for a refresh token. */
export async function exchangeCode(code) {
  return fetchJson(ACCOUNTS, {
    method: 'POST',
    headers: {
      Authorization: basicAuth(),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: config.spotify.redirectUri,
    }),
  })
}
