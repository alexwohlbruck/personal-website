import { Router } from 'express'
import { getMedia } from '../apis/instagram.js'

const router = Router()

router.get('/grid', async (req, res) => {
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 12))
  res.json(await getMedia(limit))
})

export default router
