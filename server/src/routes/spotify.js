import { Router } from 'express'
import { config } from '../config.js'
import { current, subscribe } from '../lib/now-playing.js'
import { openStream } from '../lib/sse.js'
import { ApiError } from '../util.js'

const router = Router()

function requireConfig() {
  if (!config.spotify.configured) throw new ApiError('Spotify is not configured', 503)
}

/**
 * The live one. Holds the connection open and writes a frame whenever the track
 * changes, so the browser is told rather than having to ask.
 */
router.get('/stream', async (req, res) => {
  requireConfig()

  const { send, close } = openStream(req, res)

  const { state } = await current()
  send('playback', state)

  close(subscribe((next) => send('playback', next)))
})

/** The same answer as one request, for a first paint or a browser without
 *  EventSource. Served from the shared cache, so it costs nothing extra. */
router.get('/playback-state', async (req, res) => {
  requireConfig()
  const { state, status } = await current()

  // A null body means "nothing playing", which is a normal and common answer.
  // Returning that when the poll actually failed makes a dead integration look
  // like a quiet one, and the site renders both the same way, so a broken token
  // could sit there for weeks looking like nobody had played anything. Only
  // report a failure when there is no cached answer to fall back on.
  if (status === 'error' && !state) throw new ApiError('Spotify is unavailable.', 502)

  res.json(state)
})

export default router
