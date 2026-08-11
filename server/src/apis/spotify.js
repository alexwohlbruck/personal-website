import { config } from '../config.js'
import { getToken, setToken } from '../tokens.js'
import { ApiError, fetchJson, log } from '../util.js'

const ACCOUNTS = 'https://accounts.spotify.com/api/token'
const API = 'https://api.spotify.com/v1'

/** Scopes the site needs. Nothing here can change what is playing. */
export const SCOPES = ['user-read-playback-state', 'user-read-recently-played']

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
