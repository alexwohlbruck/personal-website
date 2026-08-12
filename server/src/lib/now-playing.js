import { getPlaybackState } from '../apis/spotify.js'
import { config } from '../config.js'
import { log } from '../util.js'

/**
 * One poll loop for the whole site.
 *
 * Spotify has no webhook, push or streaming API, so somebody has to ask. The
 * question is who and how often. Previously every visitor's browser polled this
 * server, and every one of those requests turned into a fresh pair of Spotify
 * calls, so ten people reading the about page meant ten times the API traffic
 * for one answer that is identical for all of them.
 *
 * Here the server asks once, caches the answer, and pushes it to every open
 * browser over SSE. Spotify call volume is now a function of how often the
 * music changes rather than how many people are looking. It also sleeps: with
 * nobody on the site there is nothing to tell, so the loop stops entirely and
 * restarts on the next subscriber.
 */

/** While a track is playing, never wait longer than this between checks, so a
 *  skip or a pause shows up reasonably soon rather than at the end of the song. */
const ACTIVE_MAX = 10_000
const ACTIVE_MIN = 5_000
/** Nothing playing changes slowly. */
const IDLE = 60_000
const ERROR_MIN = 60_000
const ERROR_MAX = 15 * 60_000
/** Keep polling this long after the last listener leaves, so a reload or a
 *  click through to another page does not pay for a cold start. */
const LINGER = 2 * 60_000

const subscribers = new Set()

let state = null
let status = 'idle'
let timer
let running
let polledAt = 0
let lastWanted = 0
let errorDelay = ERROR_MIN

/**
 * The cached track, with its position moved forward to now.
 *
 * A playing track is the one thing here that is wrong the moment it is stored:
 * the poll captured a position, and the song has been going ever since. Serving
 * that verbatim means anyone arriving between polls gets a progress bar behind
 * by however long ago the last poll was, and a listened-time that disagrees
 * with their own ears.
 *
 * Caching is still the right call, since it is what lets one Spotify call serve
 * everybody. It just has to account for its own age. A paused or finished track
 * is left alone: its position is not moving.
 */
function project(current) {
  if (!current?.is_playing || !current.item) return current

  const elapsed = Date.now() - polledAt
  if (elapsed < 1000) return current

  return {
    ...current,
    progress_ms: Math.min(current.item.duration_ms, current.progress_ms + elapsed),
  }
}

export function snapshot() {
  return { state: project(state), status }
}

function broadcast() {
  const payload = project(state)
  for (const send of subscribers) {
    try {
      send(payload)
    } catch {
      // A dead socket is the stream route's problem, not ours.
    }
  }
}

function wanted() {
  return subscribers.size > 0 || Date.now() - lastWanted < LINGER
}

function schedule(delay) {
  clearTimeout(timer)
  timer = setTimeout(tick, delay)
  // A pending poll should never be the reason the process refuses to exit.
  timer.unref?.()
}

/**
 * The scheduled poll and a first caller waiting on one can land at the same
 * moment. Sharing the run means that costs one Spotify call rather than two.
 */
function tick() {
  running ??= run()
    // run() handles its own failures, so this only catches a future edit that
    // stops doing that. Nothing awaits the scheduled call, and an unhandled
    // rejection here is exactly what used to take the whole server down.
    .catch((err) => log(`Poll loop error: ${err.message}`, 'FgRed'))
    .finally(() => {
      running = undefined
    })
  return running
}

async function run() {
  if (!wanted()) {
    timer = undefined
    return
  }

  try {
    const next = await getPlaybackState()
    // Compared raw. Projecting first would make every poll look like a change,
    // since the position moves on its own between them.
    const changed = JSON.stringify(next) !== JSON.stringify(state)

    state = next
    polledAt = Date.now()
    status = 'ready'
    errorDelay = ERROR_MIN

    if (changed) broadcast()

    if (next?.is_playing && next.item) {
      const remaining = next.item.duration_ms - next.progress_ms + 1500
      schedule(Math.min(ACTIVE_MAX, Math.max(ACTIVE_MIN, remaining)))
    } else {
      schedule(IDLE)
    }
  } catch (err) {
    status = 'error'
    log(`Spotify poll failed: ${err.message}`, 'FgRed')
    schedule(errorDelay)
    errorDelay = Math.min(ERROR_MAX, errorDelay * 2)
  }
}

/** Note that somebody wants an answer, and wake the loop if it is asleep. */
export function touch() {
  lastWanted = Date.now()
  if (!config.spotify.configured) return
  if (!timer) schedule(0)
}

/**
 * Called by the SSE route. `send` is handed the state on every change; the
 * returned function detaches it.
 */
export function subscribe(send) {
  subscribers.add(send)
  touch()
  return () => subscribers.delete(send)
}

/** The cached answer, waiting for the first poll if we have never run. */
export async function current() {
  touch()
  if (status === 'idle' && config.spotify.configured) {
    // Nothing cached yet, so this first caller waits rather than getting a null
    // that would render as "nothing playing".
    await tick()
  }
  return snapshot()
}
