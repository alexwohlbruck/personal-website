var router = require('express').Router()

router.use('/spotify', require('./spotify'))
router.use('/ig', require('./ig'))
router.use('/mailer', require('./mailer'))
router.use('/calendar', require('./calendar'))

// For default route, redirect to the static site
router.get('/', (req, res) => {
  res.redirect('https://alex.wohlbruck.com')
})

module.exports = router
