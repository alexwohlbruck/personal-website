import { Router } from 'express'
import { getMedia } from '../apis/instagram.js'

const router = Router()

/**
 * One page of photos plus the cursor for the next, or null at the end.
 *
 * Cached hard: a photo grid that is fifteen minutes stale is indistinguishable
 * from a fresh one, and the browser re-asking on every visit is pure latency
 * for an answer nobody notices changing.
 */
router.get('/grid', async (req, res) => {
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 12))
  const after = typeof req.query.after === 'string' ? req.query.after : undefined

  res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=900')
  res.json(await getMedia({ limit, after }))
})

export default router
