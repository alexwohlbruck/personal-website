var router = require('express').Router()

router.use('/spotify', require('./spotify'))
router.use('/ig', require('./ig'))
router.use('/mailer', require('./mailer'))
router.use('/calendar', require('./calendar'))

// Which integrations have credentials. Useful when the site's live sections
// are quiet and it is not obvious whether the server or the config is at fault.
router.get('/health', (req, res) => {
  const has = (...keys) => keys.every((key) => Boolean(process.env[key]))
  res.json({
    ok: true,
    integrations: {
      spotify: has('SPOTIFY_CLIENT_ID', 'SPOTIFY_CLIENT_SECRET', 'SPOTIFY_REFRESH_TOKEN'),
      instagram: has('IG_ACCESS_TOKEN'),
      calendar: has('GOOGLE_API_KEY', 'GOOGLE_CALENDAR_ID'),
      mailer: has('MAIL_HOST', 'MAIL_USER', 'MAIL_PASS'),
    },
  })
})

// For default route, redirect to the static site
router.get('/', (req, res) => {
  res.redirect('https://alex.wohlbruck.com')
})

module.exports = router
