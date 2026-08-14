import { Router } from 'express'
import { sendAdminSignInCode } from '../apis/mailer.js'
import {
  normalizeEmail,
  readAdminSession,
  requestAdminCode,
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

router.post('/session', (req, res) => {
  rateLimit(req)
  const email = normalizeEmail(req.body?.email)
  const token = verifyAdminCode(email, req.body?.code)
  res.set('Cache-Control', 'no-store')
  res.json({ token, email })
})

/**
 * Whether the token the browser kept is still worth anything.
 *
 * There is no matching sign out. Nothing is stored to delete, so the browser
 * discarding its token is the whole of it.
 */
router.get('/session', (req, res) => {
  const session = readAdminSession(req)
  res.set('Cache-Control', 'no-store')
  res.json({ signedIn: Boolean(session), email: session?.email ?? null })
})

export default router
