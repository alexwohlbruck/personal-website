import { Router } from 'express'
import { sendContactMessage } from '../apis/mailer.js'
import { ApiError, log } from '../util.js'

const router = Router()

const LIMIT = { windowMs: 10 * 60_000, max: 5 }
const hits = new Map()

/** Enough to stop a bored script filling an inbox. Anything more determined is
 *  the mail provider's problem, not this endpoint's. */
function rateLimit(req) {
  const key = req.ip ?? 'unknown'
  const now = Date.now()
  const recent = (hits.get(key) ?? []).filter((at) => now - at < LIMIT.windowMs)

  if (recent.length >= LIMIT.max) throw new ApiError('Too many messages, try again later.', 429)

  recent.push(now)
  hits.set(key, recent)

  // The map only ever holds addresses seen this window.
  if (hits.size > 500) {
    for (const [addr, times] of hits) {
      if (!times.some((at) => now - at < LIMIT.windowMs)) hits.delete(addr)
    }
  }
}

router.post('/contact', async (req, res) => {
  rateLimit(req)

  const name = String(req.body?.name ?? '').trim()
  const email = String(req.body?.email ?? '').trim()
  const message = String(req.body?.message ?? '').trim()

  if (!name || !email || !message) throw new ApiError('Name, email and message are required.', 400)
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new ApiError('That email looks wrong.', 400)
  if (message.length > 5000) throw new ApiError('That message is too long.', 400)

  const info = await sendContactMessage({ name, email, message })
  log(`Message sent: ${info.messageId}`, 'FgGreen')

  res.json({ message: 'Message sent successfully.' })
})

export default router
