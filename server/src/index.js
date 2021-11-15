require('dotenv').config()
const express = require("express")
const app = express()
const cors = require('cors')
const http = require('http')
const server = http.createServer(app)
const { Server } = require("socket.io")
const io = new Server(server, {
  cors: {
    origin: '*',
  }
})

const port = process.env.PORT || 3000

app.use(cors())

const SpotifyWebApi = require('spotify-web-api-node')
const spotify = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI
})
spotify.setRefreshToken(process.env.SPOTIFY_REFRESH_TOKEN)

const InstagramBasicDisplayApi = require('instagram-basic-display')
const ig = new InstagramBasicDisplayApi({
  appId: process.env.IG_APP_ID,
  appSecret: process.env.IG_APP_SECRET,
  redirectUri: process.env.IG_REDIRECT_URI,
})

function refreshSpotifyAccessToken() {
  spotify.refreshAccessToken().then(data => {
    spotify.setAccessToken(data.body['access_token'])

    // Refresh again one minute before expiration
    const expiresIn = parseInt(data.body['expires_in'])
    setTimeout(refreshSpotifyAccessToken, (expiresIn - 60) * 1000)
  })
}

let playbackTimeout

async function getSpotifyPlaybackState() {
  const { body } = await spotify.getMyCurrentPlaybackState()

  const progress = parseInt(body.progress_ms)
  const duration = parseInt(body.item.duration_ms)
  const timeLeft = duration - progress

  console.log(`Playing song: ${body?.item.name}, Time left: ${Math.round(timeLeft / 1000)}s`)

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
  const { data } = await ig.retrieveUserMedia(process.env.IG_ACCESS_TOKEN)
  res.json(data)
})

app.get('/', (req, res) => {
  res.send("Hello world!")
})

refreshSpotifyAccessToken()
server.listen(port, () => {
  console.log(`Server started on port ${port}!`);
})