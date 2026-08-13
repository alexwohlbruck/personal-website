import { Router } from 'express'
import { config } from '../config.js'
import calendar from './calendar.js'
import github from './github.js'
import guestbook from './guestbook.js'
import instagram from './instagram.js'
import mailer from './mailer.js'
import osm from './osm.js'
import spotify from './spotify.js'

const router = Router()

router.use('/spotify', spotify)
router.use('/instagram', instagram)
router.use('/calendar', calendar)
router.use('/guestbook', guestbook)
router.use('/mailer', mailer)
router.use('/osm', osm)
router.use('/github', github)

/**
 * Which integrations have credentials. Useful when the site's live sections are
 * quiet and it is not obvious whether the server or the config is at fault.
 */
router.get('/health', (req, res) => {
  res.json({
    ok: true,
    integrations: {
      spotify: config.spotify.configured,
      instagram: config.instagram.configured,
      calendar: config.calendar.configured,
      // False here means the GitHub panel is reading public endpoints, not
      // that it is down. Nothing it shows requires a token.
      github: config.github.configured,
      analytics: config.analytics.configured,
      mailer: config.mail.configured,
      database: config.database.configured,
    },
  })
})

router.get('/', (req, res) => {
  res.redirect('https://alex.wohlbruck.com')
})

export default router
