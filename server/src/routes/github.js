import { Router } from 'express'
import { getGithubStats } from '../apis/github.js'

const router = Router()

router.get('/stats', async (req, res) => {
  res.set('Cache-Control', 'public, max-age=1800, stale-while-revalidate=86400')
  res.json(await getGithubStats())
})

export default router
