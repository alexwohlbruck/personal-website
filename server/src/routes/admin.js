import { Router } from 'express'
import { sendAdminSignInCode } from '../apis/mailer.js'
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  ensureAdminSessions,
  normalizeEmail,
  readAdminSession,
  requestAdminCode,
  revokeAdminSessions,
  verifyAdminCode,
} from '../lib/admin-auth.js'
import { ApiError, log } from '../util.js'

const router = Router()

const LIMIT = { windowMs: 15 * 60_000, max: 10 }
const hits = new Map()

/** Stops a stranger using the mailer as a doorbell, or the code as a guess. */
function rateLimit(req) {
  const key = req.ip ?? 'unknown'
  const now = Date.now()
  const recent = (hits.get(key) ?? []).filter((at) => now - at < LIMIT.windowMs)

  if (recent.length >= LIMIT.max) throw new ApiError('Too many attempts, try again later.', 429)

  recent.push(now)
  hits.set(key, recent)

  if (hits.size > 500) {
    for (const [address, times] of hits) {
      if (!times.some((at) => now - at < LIMIT.windowMs)) hits.delete(address)
    }
  }
}

router.post('/code', async (req, res) => {
  rateLimit(req)
  const email = normalizeEmail(req.body?.email)
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new ApiError('That email looks wrong.', 400)

  const code = requestAdminCode(email)
  if (code) {
    await sendAdminSignInCode({ email, code })
    log('Sent an admin sign in code.', 'FgGreen')
  }

  // Deliberately the same answer either way. Only the owner's mailbox learns
  // whether a code was created.
  res.json({ message: 'If that address can moderate this site, a code is on its way.' })
})

router.post('/session', async (req, res) => {
  rateLimit(req)
  await ensureAdminSessions()
  const email = normalizeEmail(req.body?.email)
  const token = verifyAdminCode(email, req.body?.code)

  // Same token by two routes. The cookie is the one a script on the page
  // cannot read; the body is for a client whose API lives on another origin,
  // where the browser will not send the cookie back.
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  })
  res.set('Cache-Control', 'no-store')
  res.json({ token, email })
})

/** Whether the session the browser is carrying is still worth anything. */
router.get('/session', async (req, res) => {
  await ensureAdminSessions()
  const session = readAdminSession(req)
  res.set('Cache-Control', 'no-store')
  res.json({ signedIn: Boolean(session), email: session?.email ?? null })
})

/**
 * Sign out, for real.
 *
 * Ends every session rather than only this one, which for a site with a single
 * owner is the same sentence said two ways, and means a token that leaked from
 * a browser somewhere else stops working the moment you notice.
 */
router.delete('/session', async (req, res) => {
  await ensureAdminSessions()
  if (!readAdminSession(req)) throw new ApiError('You are not signed in.', 401)

  await revokeAdminSessions()
  res.clearCookie(SESSION_COOKIE, { path: '/' })
  res.set('Cache-Control', 'no-store')
  res.status(204).end()
})

export default router
