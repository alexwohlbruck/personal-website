import { log } from '../util.js'

/**
 * A small TTL cache in front of the third-party APIs.
 *
 * Two things it does beyond remembering an answer:
 *
 * Single flight. A cold cache and several visitors at once would otherwise send
 * the same request upstream several times over. Callers that arrive while a
 * fetch is in progress wait on that one instead of starting their own.
 *
 * Stale on failure. When the upstream is down, a slightly old answer beats an
 * error. A calendar that is a few minutes out of date still says roughly when
 * someone is busy, and a photo grid does not change at all between one hour and
 * the next. The alternative is a section of the site going blank because
 * somebody else's API had a bad minute.
 */
const entries = new Map()
const inflight = new Map()

export async function cached(key, ttl, produce) {
  const hit = entries.get(key)
  if (hit && Date.now() - hit.at < ttl) return hit.value

  const running = inflight.get(key)
  if (running) return running

  const attempt = (async () => {
    try {
      const value = await produce()
      entries.set(key, { value, at: Date.now() })
      return value
    } catch (err) {
      if (!hit) throw err
      const age = Math.round((Date.now() - hit.at) / 1000)
      log(`${key} failed, serving ${age}s old copy: ${err.message}`, 'FgYellow')
      return hit.value
    } finally {
      inflight.delete(key)
    }
  })()

  inflight.set(key, attempt)
  return attempt
}

/** Drop an entry, so the next read goes upstream. */
export function invalidate(prefix) {
  for (const key of entries.keys()) {
    if (key.startsWith(prefix)) entries.delete(key)
  }
}
