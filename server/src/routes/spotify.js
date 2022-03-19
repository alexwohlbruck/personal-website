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
async function getSpotifyPlaybackState(io) {
  const { body: playbackState } = await spotify.getMyCurrentPlaybackState()
  
  let response = {}
  
  const currentlyPlaying = !!playbackState.timestamp

  if (currentlyPlaying) {
    response = playbackState
  }
  else {
    // No playback state available, get last item in history
    const { body: history } = await spotify.getMyRecentlyPlayedTracks({ limit: 1 })

    if (history.items.length) {
      const item = history.items[0]

      response.is_playing = false
      response.timestamp = item.played_at
      response.item = item.track
      response.progress_ms = item.track.duration_ms
    }
    else {
      return null
    }
  }

  const progress = parseInt(response.progress_ms)
  const duration = parseInt(response.item.duration_ms)
  const timeLeft = duration - progress

  log(`Playing song: ${response?.item.name}, Time left: ${Math.round(timeLeft / 1000)}s`)

  // Rerun the function when the song is over
  clearTimeout(playbackTimeout)
  playbackTimeout = setTimeout(() => {
    return getSpotifyPlaybackState(io)
  }, (timeLeft + 2000))

  io.emit('SET_SPOTIFY_PLAYBACK_STATE', response)

  return response
}

/* Spotify routes */

router.get('/playback-state', async (req, res) => {
  const io = req.app.get('socketio')
  const playbackState = await getSpotifyPlaybackState(io)
  res.status(200).json(playbackState)
})

router.get('/authorize', async (req, res) => {
  const url = await spotify.createAuthorizeURL([
    'user-read-playback-state',
    'user-read-recently-played',
  ])
  console.log(url)
  res.status(200).json({url})
})

router.get('/token', async (req, res) => {
  const { code } = req.query
  const data = await spotify.getRefreshToken(code)
  res.status(200).json(data) 
})

async function init() {
  await refreshSpotifyAccessToken()
}

init()

module.exports = router