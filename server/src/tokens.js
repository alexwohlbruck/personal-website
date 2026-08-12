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
 *
 * TOKENS_FILE moves it, which a deployment wants when the working directory is
 * not writable or the file needs to live on a mounted volume that survives a
 * redeploy. Losing it is not fatal but it does mean pasting a token in by hand.
 */
function tokensFile() {
  return (
    process.env.TOKENS_FILE ??
    path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.tokens.json')
  )
}

/**
 * Anything this process has written, kept per file.
 *
 * The file is the source of truth and is re-read on every access rather than
 * cached, so a token rotated by hand or by another process is picked up without
 * a restart. This holds the other direction: if the write fails, which is what
 * a read-only filesystem looks like, the value we just obtained is still the
 * one we use. Losing a rotated token to a failed write would mean re-running
 * the auth script, and the whole point of rotating is that nobody has to.
 */
const written = new Map()

function read(file) {
  let stored = {}
  try {
    stored = JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    stored = {}
  }
  return { ...stored, ...(written.get(file) ?? {}) }
}

/** The stored value if we have one, otherwise whatever .env started us with. */
export function getToken(key, fallback) {
  return read(tokensFile())[key]?.value ?? fallback
}

/**
 * Everything we know about a stored token: when it was written, when it dies,
 * and whether that expiry came from the provider or was our own guess.
 */
export function getTokenRecord(key) {
  return read(tokensFile())[key]
}

/**
 * `estimated` marks an expiry we assumed rather than one the provider told us.
 * A token generated in a dashboard arrives without a stated lifetime, so the
 * number attached to it is a guess until something confirms it.
 */
export function setToken(key, value, expiresInSeconds, { estimated = false } = {}) {
  const file = tokensFile()
  const record = {
    value,
    updated: new Date().toISOString(),
    ...(expiresInSeconds
      ? { expires: new Date(Date.now() + expiresInSeconds * 1000).toISOString() }
      : {}),
    ...(estimated ? { estimated: true } : {}),
  }

  written.set(file, { ...(written.get(file) ?? {}), [key]: record })

  try {
    fs.writeFileSync(file, `${JSON.stringify(read(file), null, 2)}\n`, { mode: 0o600 })
  } catch (err) {
    // Worth surviving: an unwritable disk should not cost us the running token.
    log(`Could not persist ${key}, keeping it in memory only: ${err.message}`, 'FgRed')
  }
}
