import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { log } from './util.js'

/**
 * Somewhere to keep the tokens that rotate on their own.
 *
 * Instagram long-lived tokens expire after 60 days and have to be traded in for
 * a fresh one before then, so the value in .env goes stale the first time that
 * happens. This used to be solved by rewriting .env and patching the Heroku
 * config, which restarted the dyno every time. A small JSON file next to the
 * server does the same job without the restart, and .env stays the thing you
 * paste secrets into rather than something the process edits underneath you.
 */
const file = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.tokens.json')

function read() {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return {}
  }
}

let cache = read()

/** The stored value if we have one, otherwise whatever .env started us with. */
export function getToken(key, fallback) {
  return cache[key]?.value ?? fallback
}

/**
 * When the stored token dies, as a timestamp. Undefined when we have never
 * written this one ourselves, which is the case for a value pasted into .env by
 * hand: we know it works, we just do not know for how long.
 */
export function getTokenExpiry(key) {
  const expires = cache[key]?.expires
  return expires ? Date.parse(expires) : undefined
}

export function setToken(key, value, expiresInSeconds) {
  cache = {
    ...cache,
    [key]: {
      value,
      updated: new Date().toISOString(),
      ...(expiresInSeconds
        ? { expires: new Date(Date.now() + expiresInSeconds * 1000).toISOString() }
        : {}),
    },
  }

  try {
    fs.writeFileSync(file, `${JSON.stringify(cache, null, 2)}\n`, { mode: 0o600 })
  } catch (err) {
    // Worth surviving: an unwritable disk should not cost us the running token.
    log(`Could not persist ${key}: ${err.message}`, 'FgRed')
  }
}
