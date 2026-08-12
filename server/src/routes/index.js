import { Router } from 'express'
import { config } from '../config.js'
import calendar from './calendar.js'
import instagram from './instagram.js'
import mailer from './mailer.js'
import osm from './osm.js'
import spotify from './spotify.js'

const router = Router()

router.use('/spotify', spotify)
router.use('/instagram', instagram)
router.use('/calendar', calendar)
router.use('/mailer', mailer)
router.use('/osm', osm)

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
      mailer: config.mail.configured,
    },
  })
})

router.get('/', (req, res) => {
  res.redirect('https://alex.wohlbruck.com')
})

export default router
