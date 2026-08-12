import { config } from '../config.js'
import { cached } from '../lib/cache.js'
import { getToken, getTokenRecord, setToken } from '../tokens.js'
import { ApiError, fetchJson, log } from '../util.js'

/**
 * Instagram API with Instagram Login.
 *
 * The Basic Display API this used to run on was shut down on 4 December 2024
 * and its endpoints now only return errors, which is why the grid went blank.
 * The replacement lives on the same host but wants a different scope, and only
 * talks to Professional accounts: a personal account cannot be read by any
 * Instagram API any more.
 *
 * Left unversioned on purpose. Meta's own Instagram Login examples call it this
 * way, and pinning a version number here only buys a hard failure on the day
 * that version is retired.
 */
const GRAPH = 'https://graph.instagram.com'
const OAUTH = 'https://api.instagram.com/oauth/access_token'

export const SCOPES = ['instagram_business_basic']

/**
 * `children` is what turns a carousel post into its photos. Most of this
 * account's posts are albums of up to twenty images, so without it the grid
 * shows one cover each and the rest are unreachable.
 */
const FIELDS = [
  'id',
  'caption',
  'media_type',
  'media_url',
  'permalink',
  'thumbnail_url',
  'children{id,media_type,media_url,thumbnail_url}',
].join(',')

/** The grid changes a few times a month at most. */
const CACHE_TTL = 15 * 60_000
/** Long-lived tokens last 60 days. Renew well before that, so a few days of
 *  downtime is a recoverable inconvenience rather than a re-authorization. */
const RENEW_WITHIN = 14 * 24 * 60 * 60_000
const CHECK_EVERY = 12 * 60 * 60_000
/** Meta refuses to refresh a token less than 24 hours old, so an hour of slack. */
const CALIBRATE_AFTER = 25 * 60 * 60_000

const token = () => getToken('instagram_access_token', config.instagram.accessToken)

/** Who the current token belongs to. Only used by the setup script, to prove a
 *  pasted token works before anything depends on it. */
export async function getProfile() {
  const accessToken = token()
  if (!accessToken) throw new ApiError('Instagram is not configured', 503)

  const ask = (fields) =>
    fetchJson(`${GRAPH}/me?${new URLSearchParams({ fields, access_token: accessToken })}`)

  try {
    return await ask('username,account_type,media_count')
  } catch {
    // Field availability varies by account and app review state; a username is
    // enough to confirm the token is live.
    return ask('username')
  }
}

/**
 * The still image for a post or one of its children.
 *
 * Videos and reels carry the clip itself in media_url, which an <img> cannot
 * render, so the poster frame is the only usable thing on them.
 */
function still(item) {
  return item.media_type === 'VIDEO' ? item.thumbnail_url : item.media_url
}

/**
 * One page of the grid, newest first.
 *
 * `after` is an opaque cursor from the previous page's `next`. Instagram pages
 * by cursor rather than by offset, which is the right model for a feed that
 * grows from the top: an offset would shift under you the moment a new post
 * arrives, and page two would repeat a photo from page one.
 */
export async function getMedia({ limit = 12, after } = {}) {
  const accessToken = token()
  if (!accessToken) throw new ApiError('Instagram is not configured', 503)

  return cached(`instagram:${limit}:${after ?? 'first'}`, CACHE_TTL, async () => {
    const params = new URLSearchParams({
      fields: FIELDS,
      limit: String(limit),
      access_token: accessToken,
    })
    if (after) params.set('after', after)

    const body = await fetchJson(`${GRAPH}/me/media?${params}`)

    const posts = (body?.data ?? [])
      .map((post) => {
        const media = (post.children?.data ?? [post]).map(still).filter(Boolean)
        return {
          id: post.id,
          permalink: post.permalink,
          caption: post.caption,
          media_url: media[0],
          media,
        }
      })
      .filter((post) => Boolean(post.media_url))

    // A cursor comes back even on the last page. `paging.next` is the only
    // thing that actually means there is more, so it gates the cursor.
    const next = body?.paging?.next ? (body.paging.cursors?.after ?? null) : null

    return { posts, next }
  })
}

/**
 * Trade the current long-lived token for a fresh 60 days. Valid once the token
 * is 24 hours old, so this is a no-op on a token minted minutes ago.
 */
export async function refreshAccessToken() {
  const accessToken = token()
  if (!accessToken) return

  const params = new URLSearchParams({
    grant_type: 'ig_refresh_token',
    access_token: accessToken,
  })
  const body = await fetchJson(`${GRAPH}/refresh_access_token?${params}`)

  // Meta always sends expires_in, but without it we would store no expiry at
  // all and re-check every twelve hours forever. 60 days is what it grants.
  const expiresIn = Number(body.expires_in) || 60 * 24 * 60 * 60

  setToken('instagram_access_token', body.access_token, expiresIn)
  log(`Instagram token refreshed, good for another ${Math.round(expiresIn / 86_400)} days`, 'FgGreen')
}

/**
 * Renewal runs on a plain timer rather than a cron expression, because the only
 * thing that matters is that it happens twice a day, not that it happens at
 * midnight. A missed window is not a problem; a missed fortnight is.
 */
export function startTokenRenewal() {
  if (!config.instagram.configured) return

  const check = async () => {
    try {
      if (!due()) return
      await refreshAccessToken()
    } catch (err) {
      log(`Instagram token renewal failed: ${err.message}`, 'FgRed')
    }
  }

  void check()
  const timer = setInterval(check, CHECK_EVERY)
  timer.unref?.()
}

function due() {
  const record = getTokenRecord('instagram_access_token')

  // Nothing recorded at all: the token was pasted into .env and never checked,
  // so we have no idea how much of its life is left. Find out now.
  if (!record?.expires) return true

  const remaining = Date.parse(record.expires) - Date.now()
  if (remaining < RENEW_WITHIN) return true

  /*
   * An estimated expiry is a number we made up. Meta does not say how long a
   * token minted in its dashboard lasts, so 60 days is inference from the
   * documented maximum rather than a fact about this token.
   *
   * Refreshing once, as soon as the token is old enough to allow it, replaces
   * the guess with the expiry Meta actually reports. It also means the renewal
   * path runs within a day of setup: if something about it is broken, that
   * surfaces tomorrow rather than in six weeks when the token dies and there is
   * nothing left to renew from.
   */
  const age = record.updated ? Date.now() - Date.parse(record.updated) : Infinity
  return Boolean(record.estimated) && age > CALIBRATE_AFTER
}

/** Where to send a browser to grant the scope above. */
export function authorizeUrl(state) {
  const params = new URLSearchParams({
    client_id: config.instagram.appId ?? '',
    redirect_uri: config.instagram.redirectUri,
    response_type: 'code',
    scope: SCOPES.join(','),
    ...(state ? { state } : {}),
  })
  return `https://www.instagram.com/oauth/authorize?${params}`
}

/** Authorization code to a short-lived token, then straight to a long-lived one. */
export async function exchangeCode(code) {
  const short = await fetchJson(OAUTH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: config.instagram.appId ?? '',
      client_secret: config.instagram.appSecret ?? '',
      grant_type: 'authorization_code',
      redirect_uri: config.instagram.redirectUri,
      code,
    }),
  })

  const params = new URLSearchParams({
    grant_type: 'ig_exchange_token',
    client_secret: config.instagram.appSecret ?? '',
    access_token: short.access_token,
  })
  return fetchJson(`${GRAPH}/access_token?${params}`)
}
