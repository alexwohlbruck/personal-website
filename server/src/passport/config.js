const GoogleStrategy = require("passport-google-oauth2").Strategy
const User = require("../models/user")

const config = {
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `http://localhost:3000/auth/google/callback`,
  passReqToCallback: true,
}

const handleAuth = async (request, accessToken, refreshToken, profile, done) => {
  try {
    const { id, picture: pfp } = profile
    const name = {
      first: profile.name.givenName,
      last: profile.name.familyName,
    }
    const email = profile.emails[0].value

    let existingUser = await User.findOne({ email })
    if (existingUser) {
      existingUser.google = { id, accessToken, refreshToken }
      existingUser.pfp = pfp
      existingUser = await existingUser.save()
      return done(null, existingUser)
    }

    const newUser = new User({
      name,
      email,
      pfp,
      google: {
        id,
        accessToken,
        refreshToken,
      }
    })
    await newUser.save()
    return done(null, newUser)
  } catch (error) {
    return done(error, false)
  }
}

const strategy = (passport) => {
  passport.use(new GoogleStrategy(config, handleAuth))
}

module.exports = strategy