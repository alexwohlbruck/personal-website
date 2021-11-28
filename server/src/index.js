require('dotenv').config()
const express = require("express")
const app = express()
const cors = require('cors')
const http = require('http')
const server = http.createServer(app)
const fs = require('fs') 
const { parse, stringify } = require('envfile')
const { Server } = require("socket.io")
const io = new Server(server, {
  cors: {
    origin: '*',
  }
})
const CronJob = require('cron').CronJob
const SpotifyWebApi = require('spotify-web-api-node')
const InstagramBasicDisplayApi = require('instagram-basic-display')
const HerokuApi = require('heroku-client')

const { log } = require('./util')

// setTimeout modified to allow for larger intervals
// https://catonmat.net/settimeout-setinterval
function setTimeout_(fn, delay) {
  var maxDelay = Math.pow(2,31)-1;

  if (delay > maxDelay) {
      var args = arguments;
      args[1] -= maxDelay;

      return setTimeout(function () {
          setTimeout_.apply(undefined, args);
      }, maxDelay);
  }

  return setTimeout.apply(undefined, arguments);
}

// Initialize API clients

const spotify = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI
})
spotify.setRefreshToken(process.env.SPOTIFY_REFRESH_TOKEN)

const ig = new InstagramBasicDisplayApi({
  appId: process.env.IG_APP_ID,
  appSecret: process.env.IG_APP_SECRET,
  redirectUri: process.env.IG_REDIRECT_URI,
})

const heroku = new HerokuApi({ token: process.env.HEROKU_API_TOKEN })


// Set the environment variable config locally and in Heroku app config
function updateEnvironment(key, value) {
  // Update local environment file
  const envPath = '.env'
  if (fs.existsSync(envPath)) {
    const env = fs.readFileSync(envPath, 'utf8')
    let parsedFile = parse(env)
    parsedFile[key] = value
    fs.writeFileSync(`./${envPath}`, stringify(parsedFile)) 
  }

  // Update heroku config vars
  heroku.patch(`/apps/${process.env.HEROKU_APP_NAME}/config-vars`, {
    body: {
      [key]: value
    }
  })
}


const port = process.env.PORT || 3000

app.use(cors())

// Use refresh token to get a new access token
async function refreshSpotifyAccessToken() {
  const data = await spotify.refreshAccessToken()
  spotify.setAccessToken(data.body['access_token'])

  // Refresh again one minute before expiration
  const expiresIn = parseInt(data.body['expires_in'])
  setTimeout(refreshSpotifyAccessToken, (expiresIn - 60) * 1000)
}

// Refresh long-lived token before it expires
async function refreshIgAccessToken(updateEnvironmentFile) {
  console.log("Getting new IG access token")
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

// Retrieve Spotify player state
let playbackTimeout
let lastPlaybackState = null // TODO: store this in persistent storage, Heroku will kill memory on sleep
async function getSpotifyPlaybackState() {
  const { body } = await spotify.getMyCurrentPlaybackState()

  if (!body.timestamp) {
    log('Returning cached object')
    // No playback state available, return cached state
    lastPlaybackState.is_playing = false
    return lastPlaybackState
  }

  lastPlaybackState = body

  const progress = parseInt(body.progress_ms)
  const duration = parseInt(body.item.duration_ms)
  const timeLeft = duration - progress

  log(`Playing song: ${body?.item.name}, Time left: ${Math.round(timeLeft / 1000)}s`)

  // Rerun the function when the song is over
  clearTimeout(playbackTimeout)
  playbackTimeout = setTimeout(getSpotifyPlaybackState, (timeLeft + 2000))

  io.emit('SET_SPOTIFY_PLAYBACK_STATE', body)

  return body
}

app.get('/spotify/playback-state', async (req, res) => {
  const playbackState = await getSpotifyPlaybackState()
  res.json(playbackState)
})

app.get('/ig/grid', async (req, res) => {
  try {
    const { data } = await ig.retrieveUserMedia(process.env.IG_ACCESS_TOKEN)
    res.json(data)
  }
  catch (err) {
    console.log(err)
    res.status(err.status || 500).json(err)
  } 
})

app.get('/', (req, res) => {
  res.redirect('https://alex.wohlbruck.com')
})

async function initApp() {
  await refreshSpotifyAccessToken()
  startIgAccessTokenCron()

  server.listen(port, () => {
    log(`Server started on port ${port}!`, 'FgGreen');
  })
}

initApp()