#!/usr/bin/env node
/**
 * One-time: turn a Spotify app's client ID and secret into a refresh token.
 *
 * Run it, click the link, approve. It listens on the loopback address for the
 * redirect, trades the code, and prints the line to paste into .env. The
 * refresh token does not expire, so this is a thing you do once.
 *
 *   npm run auth:spotify
 */
import http from 'node:http'
import { randomBytes } from 'node:crypto'
import { config } from '../src/config.js'
import { authorizeUrl, exchangeCode, SCOPES } from '../src/apis/spotify.js'
import { log } from '../src/util.js'

if (!config.spotify.clientId || !config.spotify.clientSecret) {
  log('Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in server/.env first.', 'FgRed')
  process.exit(1)
}

const redirect = new URL(config.spotify.redirectUri)
const state = randomBytes(16).toString('hex')

const page = (title, body) =>
  `<!doctype html><meta charset="utf-8"><title>${title}</title>` +
  `<body style="font:16px/1.6 system-ui;margin:4rem auto;max-width:32rem;padding:0 1rem">` +
  `<h1 style="font-size:1.25rem">${title}</h1><p>${body}</p>`

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`)
  if (url.pathname !== redirect.pathname) {
    res.writeHead(404).end()
    return
  }

  const error = url.searchParams.get('error')
  const code = url.searchParams.get('code')

  if (error || !code) {
    res.writeHead(400, { 'Content-Type': 'text/html' })
    res.end(page('Authorization failed', error ?? 'No code came back.'))
    log(`Authorization failed: ${error ?? 'no code'}`, 'FgRed')
    server.close()
    process.exitCode = 1
    return
  }

  if (url.searchParams.get('state') !== state) {
    res.writeHead(400, { 'Content-Type': 'text/html' })
    res.end(page('Authorization failed', 'State did not match.'))
    log('State mismatch, ignoring the response.', 'FgRed')
    server.close()
    process.exitCode = 1
    return
  }

  try {
    const token = await exchangeCode(code)
    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end(page('Done', 'Back to the terminal.'))

    log('\nAdd this to server/.env:\n', 'FgGreen')
    console.log(`SPOTIFY_REFRESH_TOKEN=${token.refresh_token}\n`)
    log(`Scopes granted: ${token.scope}`, 'FgGray')
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/html' })
    res.end(page('Token exchange failed', err.message))
    log(`Token exchange failed: ${err.message}`, 'FgRed')
    process.exitCode = 1
  }

  server.close()
})

server.listen(Number(redirect.port || 80), redirect.hostname, () => {
  log(`Waiting for the redirect on ${config.spotify.redirectUri}`, 'FgGray')
  log(`This exact URI has to be listed in your app's settings.\n`, 'FgGray')
  log(`Asking for: ${SCOPES.join(', ')}\n`)
  log('Open this and approve:\n', 'FgGreen')
  console.log(`${authorizeUrl(state)}\n`)
})
