const router = require('express').Router()
const calendar = require('../apis/calendar')

router.get('/', async (req, res) => {

  const timezone = req.query.timezone || 'America/New_York'

  // Get beginning and end of the current week (today plus 7 days)
  const today = (new Date()).setHours(0, 0, 0, 0)
  const oneDay = 1000 * 60 * 60 * 24
  const oneWeek = oneDay * 7

  const weekStart = new Date(today)
  const weekEnd = new Date(weekStart.getTime() + oneWeek)

  const { data } = await calendar.events.list({
    calendarId: process.env.GOOGLE_CALENDAR_ID,
    timeMin: weekStart,
    timeMax: weekEnd,
    timeZone: timezone,
  })

  const events = []
  for (const event of data.items) {
    events.push({
      start: event.start.dateTime,
      end: event.end.dateTime,
      summary: event.summary,
    })
  }

  res.json({ events })
})

module.exports = router
