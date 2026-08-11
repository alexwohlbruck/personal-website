const router = require('express').Router()
const { spotify } = require('../apis')
const { setTimeout_, log } = require('../util')

/* Spotify helper functions */

// Use refresh token to get a new access token.
// Failures are logged and retried rather than thrown: this runs at boot and on
// a timer, so an unhandled rejection here takes down the whole server, and
// with it the Instagram, calendar and contact endpoints that have nothing to
// do with Spotify.
const RETRY_DELAY = 5 * 60 * 1000

async function refreshSpotifyAccessToken() {
  if (!process.env.SPOTIFY_REFRESH_TOKEN) {
    log('Spotify is not configured, skipping token refresh', 'FgYellow')
    return
  }

  try {
    const data = await spotify.refreshAccessToken()
    spotify.setAccessToken(data.body['access_token'])

    // Refresh again one minute before expiration
    const expiresIn = parseInt(data.body['expires_in'])
    setTimeout_(refreshSpotifyAccessToken, (expiresIn - 60) * 1000)
  }
  catch (err) {
    log(`Spotify token refresh failed: ${err.message}`, 'FgRed')
    setTimeout_(refreshSpotifyAccessToken, RETRY_DELAY)
  }
}

// Retrieve Spotify player state
let playbackTimeout
async function getSpotifyPlaybackState(io) {
  const { body: playbackState } = await spotify.getMyCurrentPlaybackState()

  let response = {}

  const isPlayingPodcast = playbackState.currently_playing_type === 'episode'
  const currentlyPlaying = !isPlayingPodcast && !!playbackState.timestamp

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

  if (!response || !response.item) return null

  const progress = parseInt(response.progress_ms)
  const duration = parseInt(response.item.duration_ms)
  const timeLeft = duration - progress

  log(`Playing song: ${response?.item.name}, Time left: ${Math.round(timeLeft / 1000)}s`)

  // Rerun the function when the song is over
  if (response.is_playing) {
    clearTimeout(playbackTimeout)
    playbackTimeout = setTimeout(() => {
      return getSpotifyPlaybackState(io)
    }, (timeLeft + 2000))
  }

  io.emit('SET_SPOTIFY_PLAYBACK_STATE', response)

  return response
}

/* Spotify routes */

router.get('/playback-state', async (req, res) => {
  try {
    const io = req.app.get('socketio')
    const playbackState = await getSpotifyPlaybackState(io)
    res.status(200).json(playbackState)
  }
  catch (err) {
    log(`Spotify playback state failed: ${err.message}`, 'FgRed')
    res.status(502).json({ message: 'Spotify is unavailable.' })
  }
})

router.get('/authorize', async (req, res) => {
  const url = await spotify.createAuthorizeURL([
    'user-read-playback-state',
    'user-read-recently-played',
  ])
  res.status(200).json({url})
})

router.get('/token', async (req, res) => {
  try {
    const { code } = req.query
    const data = await spotify.getRefreshToken(code)
    res.status(200).json(data)
  }
  catch (err) {
    res.status(502).json({ message: err.message })
  }
})

refreshSpotifyAccessToken()

module.exports = router