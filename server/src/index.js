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
});

spotify.setRefreshToken(process.env.SPOTIFY_REFRESH_TOKEN)

function refreshAccessToken() {
  spotify.refreshAccessToken().then(data => {
    spotify.setAccessToken(data.body['access_token'])

    // Refresh again one minute before expiration
    const expiresIn = parseInt(data.body['expires_in'])
    setTimeout(refreshAccessToken, (expiresIn - 60) * 1000)
  })
}

let playbackTimeout

async function getSpotifyPlaybackState() {
  const { body } = await spotify.getMyCurrentPlaybackState()

  const progress = parseInt(body.progress_ms)
  const duration = parseInt(body.item.duration_ms)
  const timeLeft = duration - progress

  console.log(`Playing song: ${body?.item.name}, Time left: ${Math.round(timeLeft / 1000)}s`)

  playbackTimeout = setTimeout(getSpotifyPlaybackState, (timeLeft + 2000))
  io.emit('SET_SPOTIFY_PLAYBACK_STATE', body)

  return body
}

app.get('/spotify/playback-state', async (req, res) => {
  const playbackState = await getSpotifyPlaybackState()
  res.json(playbackState)
})

app.get('/', (req, res) => {
  res.send("Hello world!")
})

refreshAccessToken()
server.listen(port, () => {
  console.log(`Server started on port ${port}!`);
})