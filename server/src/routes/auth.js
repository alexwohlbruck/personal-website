const express = require("express");
const router = express.Router();
const passport = require("passport");
const jwt = require('jsonwebtoken')

router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email']
  })
)

router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
  }),
  (req, res) => {
    console.log(req.user)
    const { user } = req
    const options = {}
    const handler = (err, token) => {
      if (err) return res.status(500).json({ err })
      return res.redirect(`${process.env.FRONTEND_URL}?token=${token}`)
    }
    jwt.sign({ user }, process.env.JWT_SECRET, options, handler);
  }
)

router.get('/me', (req, res) => {
  res.json(req.user)
})

module.exports = router;