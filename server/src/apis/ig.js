const InstagramBasicDisplayApi = require('instagram-basic-display')

const ig = new InstagramBasicDisplayApi({
  appId: process.env.IG_APP_ID,
  appSecret: process.env.IG_APP_SECRET,
  redirectUri: process.env.IG_REDIRECT_URI,
})

module.exports = ig