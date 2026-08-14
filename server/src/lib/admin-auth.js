import crypto from 'node:crypto'
import { config } from '../config.js'
import { database } from './database.js'
import { ApiError, log } from '../util.js'

/**
 * One admin, one mailbox, one code at a time.
 *
 * This site has exactly one privileged account, the address in ADMIN_EMAIL, so
 * signing in needs no user table and no password to lose. Proving you can read
 * that mailbox is the whole login: a short code goes out over the contact
 * form's existing SMTP credentials, and what comes back is a signed token
 * carrying nothing but the address and an expiry.
 *
 * The token is verified rather than stored, which is why signing out only has
 * to happen in the browser. Nothing here can revoke a token early; it expires
 * on its own, and changing ADMIN_SESSION_SECRET invalidates every one at once.
 */

const CODE_TTL = 10 * 60_000
const RESEND_AFTER = 30_000
const MAX_ATTEMPTS = 5
const SESSION_TTL = 7 * 24 * 60 * 60_000

/** The single outstanding code. Undefined once it is used, spent or expired. */
let challenge
let signingKey

/**
 * Which generation of sessions is current.
 *
 * Every token carries the generation it was minted under, and signing out
 * starts a new one, which is what turns "sign out" from a browser forgetting
 * a token into the server refusing it. Kept in the database so that a token
 * cannot come back to life across a restart.
 */
let epoch
let epochReady
/** Used only when there is no database to keep a generation in. */
const processEpoch = crypto.randomUUID()

export function ensureAdminSessions() {
  if (!config.database.configured) {
    // Sign out still works for as long as this process lives. Saying so is
    // better than pretending the guarantee is stronger than it is.
    epoch ??= processEpoch
    return Promise.resolve(epoch)
  }

  epochReady ??= database()
    .query(`
      CREATE TABLE IF NOT EXISTS admin_sessions (
        only_row boolean PRIMARY KEY DEFAULT true CHECK (only_row),
        epoch uuid NOT NULL DEFAULT gen_random_uuid(),
        rotated_at timestamptz NOT NULL DEFAULT now()
      );

      INSERT INTO admin_sessions (only_row) VALUES (true) ON CONFLICT DO NOTHING;
    `)
    .then(async () => {
      const result = await database().query('SELECT epoch FROM admin_sessions WHERE only_row')
      epoch = result.rows[0].epoch
      return epoch
    })
    .catch((error) => {
      epochReady = undefined
      throw error
    })

  return epochReady
}

/** End every session everywhere. There is one admin, so there is one answer. */
export async function revokeAdminSessions() {
  await ensureAdminSessions()
  if (!config.database.configured) {
    epoch = crypto.randomUUID()
    return
  }
  const result = await database().query(
    'UPDATE admin_sessions SET epoch = gen_random_uuid(), rotated_at = now() WHERE only_row RETURNING epoch',
  )
  epoch = result.rows[0].epoch
}

function key() {
  if (signingKey) return signingKey
  if (config.admin.secret) {
    signingKey = crypto.createHash('sha256').update(config.admin.secret).digest()
  } else {
    // Working out of the box matters more here than surviving a deploy. The
    // cost of the fallback is one extra sign in after a restart, and it is
    // spelled out at boot rather than discovered later.
    signingKey = crypto.randomBytes(32)
    log('ADMIN_SESSION_SECRET is unset: admin sessions end when the server restarts.', 'FgYellow')
  }
  return signingKey
}

const encode = (claims) => Buffer.from(JSON.stringify(claims)).toString('base64url')
const sign = (payload) => crypto.createHmac('sha256', key()).update(payload).digest('base64url')

/** Compares without letting the clock describe how much of the value matched. */
function equal(left, right) {
  const a = Buffer.from(String(left ?? ''))
  const b = Buffer.from(String(right ?? ''))
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

export const normalizeEmail = (value) => String(value ?? '').trim().toLowerCase()

export function isAdminEmail(email) {
  return Boolean(config.admin.email) && equal(normalizeEmail(email), config.admin.email)
}

function issueSession(email, now) {
  const payload = encode({ email, epoch, exp: now + SESSION_TTL })
  return `${payload}.${sign(payload)}`
}

/**
 * A six digit code for the owner's mailbox, or null for anybody else.
 *
 * Returning null instead of throwing keeps the route's answer identical for
 * every address, so this endpoint never confirms who the admin is.
 */
export function requestAdminCode(email, { now = Date.now } = {}) {
  if (!config.admin.configured) throw new ApiError('Admin sign in is not configured.', 503)
  if (!isAdminEmail(email)) return null
  if (challenge && now() - challenge.sentAt < RESEND_AFTER) {
    throw new ApiError('A code was just sent. Check your inbox before asking for another.', 429)
  }

  // A code that is still good gets sent again rather than replaced. Minting a
  // new one here would let anyone who can reach this endpoint invalidate the
  // code the owner is halfway through typing, simply by asking for one.
  if (challenge && challenge.expiresAt > now()) {
    challenge.sentAt = now()
    return challenge.code
  }

  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0')
  challenge = { code, expiresAt: now() + CODE_TTL, attempts: 0, sentAt: now() }
  return code
}

/** The session token for a correct code. Every failure reads the same. */
export function verifyAdminCode(email, code, { now = Date.now } = {}) {
  if (!config.admin.configured) throw new ApiError('Admin sign in is not configured.', 503)
  const invalid = new ApiError('That code is not valid. Ask for a new one.', 401)
  if (!isAdminEmail(email) || !challenge) throw invalid

  if (challenge.expiresAt < now()) {
    challenge = undefined
    throw invalid
  }

  challenge.attempts += 1
  // Guessing is what a six digit code is weak against, so a code that has been
  // guessed at enough times stops being a code.
  if (challenge.attempts > MAX_ATTEMPTS) {
    challenge = undefined
    throw invalid
  }
  if (!equal(String(code ?? '').trim(), challenge.code)) throw invalid

  challenge = undefined
  return issueSession(config.admin.email, now())
}

/** The session a token stands for, or null if it proves nothing. */
export function verifyAdminToken(token, { now = Date.now } = {}) {
  const [payload, signature] = String(token ?? '').split('.')
  if (!payload || !signature || !equal(signature, sign(payload))) return null

  let claims
  try {
    claims = JSON.parse(Buffer.from(payload, 'base64url').toString())
  } catch {
    return null
  }

  if (!claims?.exp || claims.exp < now()) return null
  // ADMIN_EMAIL can change. A token minted for the previous owner should not
  // outlive that change.
  if (!isAdminEmail(claims.email)) return null
  // Signed out, or asked about before the current generation was loaded. Both
  // mean this token proves nothing right now.
  if (!epoch || claims.epoch !== epoch) return null
  return { email: normalizeEmail(claims.email), expiresAt: claims.exp }
}

export const SESSION_COOKIE = 'guestbook_admin'
export const SESSION_MAX_AGE = SESSION_TTL

/**
 * The admin session on a request, from a cookie or a bearer header.
 *
 * The cookie is the one worth having, because it can be httpOnly and so is
 * beyond the reach of any script on the page. It only works when the browser
 * and the API share an origin, which they do in production and do not in
 * development, where Vite serves on its own port. So the header stays as the
 * way in for development, and for anything that is not a browser.
 */
export function readAdminSession(req) {
  const header = req.get?.('Authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : readCookie(req, SESSION_COOKIE)
  if (!token) return null
  return verifyAdminToken(token)
}

function readCookie(req, name) {
  const jar = req.headers?.cookie
  if (!jar) return ''
  for (const part of jar.split(';')) {
    const separator = part.indexOf('=')
    if (separator < 0) continue
    if (part.slice(0, separator).trim() !== name) continue
    return decodeURIComponent(part.slice(separator + 1).trim())
  }
  return ''
}
