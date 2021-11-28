const router = require('express').Router()
const { spotify } = require('../apis')
const { setTimeout_, log } = require('../util')

/* Spotify helper functions */

// Use refresh token to get a new access token
async function refreshSpotifyAccessToken() {
  const data = await spotify.refreshAccessToken()
  spotify.setAccessToken(data.body['access_token'])

  // Refresh again one minute before expiration
  const expiresIn = parseInt(data.body['expires_in'])
  setTimeout_(refreshSpotifyAccessToken, (expiresIn - 60) * 1000)
}

// Retrieve Spotify player state
let playbackTimeout
let lastPlaybackState = null // TODO: store this in persistent storage, Heroku will kill memory on sleep
async function getSpotifyPlaybackState(io) {
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
  playbackTimeout = setTimeout(() => {
    return getSpotifyPlaybackState(io)
  }, (timeLeft + 2000))

  io.emit('SET_SPOTIFY_PLAYBACK_STATE', body)

  return body
}

/* Spotify routes */

router.get('/playback-state', async (req, res) => {
  const io = req.app.get('socketio')
  const playbackState = await getSpotifyPlaybackState(io)
  res.status(200).json(playbackState)
})

async function init() {
  await refreshSpotifyAccessToken()
}

init()

module.exports = router