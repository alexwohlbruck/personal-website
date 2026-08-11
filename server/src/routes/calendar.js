import { Router } from 'express'
import { getBusy } from '../apis/calendar.js'

const router = Router()

const WEEK = 7 * 24 * 60 * 60_000

router.get('/', async (req, res) => {
  const timezone = String(req.query.timezone || 'America/New_York')

  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date(start.getTime() + WEEK)

  // Still called "events" on the wire so the client keeps working, but there is
  // nothing in them now beyond a start and an end.
  res.json({ events: await getBusy(start, end, timezone) })
})

export default router
