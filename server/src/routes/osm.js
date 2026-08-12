import { Router } from 'express'
import { getOsmStats } from '../apis/osm.js'

const router = Router()

router.get('/stats', async (req, res) => {
  res.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400')
  res.json(await getOsmStats())
})

export default router
