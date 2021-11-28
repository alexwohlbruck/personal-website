const router = require('express').Router()
const CronJob = require('cron').CronJob
const { ig } = require('../apis')
const { log } = require('../util')

/* Instagram helper functions */

// Refresh long-lived token before it expires
async function refreshIgAccessToken(updateEnvironmentFile) {
  log("Getting new IG access token")
  const { access_token: accessToken, expires_in: expiresIn } = await ig.refreshLongLivedToken(process.env.IG_ACCESS_TOKEN)
  process.env.IG_ACCESS_TOKEN = accessToken
  if (updateEnvironmentFile)
    updateEnvironment('IG_ACCESS_TOKEN', accessToken)
}

// Refresh the IG access token once a day at midnight (PT)
// Normally, when updateEvnironment is called, the Heroku server will restart anyway
function startIgAccessTokenCron() {
  let job = new CronJob('0 0 0 * * *', refreshIgAccessToken, null, true, 'America/Los_Angeles')
  job.start()
}

/* Instagram routes */

router.get('/grid', async (req, res) => {
  try {
    const { data } = await ig.retrieveUserMedia(process.env.IG_ACCESS_TOKEN)
    res.status(200).json(data)
  }
  catch (err) {
    console.log(err)
    res.status(err.status || 500).json(err)
  } 
})

function init () {
  startIgAccessTokenCron()
}

init()

module.exports = router