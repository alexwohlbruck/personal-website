#!/usr/bin/env node
/**
 * One-time: turn a Spotify app's client ID and secret into a refresh token.
 *
 * Run it, click the link, approve. It listens on the address in
 * SPOTIFY_REDIRECT_URI for the redirect, trades the code, and prints the line
 * to paste into .env. The refresh token does not expire, so this is a thing you
 * do once.
 *
 *   npm run auth:spotify
 *
 * That URI has to be registered on the app, and the dashboard will only save a
 * set of URIs where every one of them is legal: https, or http on the literal
 * loopback address. One grandfathered `http://example.com/…` row left over from
 * an older app is enough to make the whole form refuse to save.
 *
 * If the only URI you can get registered points somewhere this script cannot
 * listen, authorize by hand instead. The code lands in the address bar of
 * whatever page you get redirected to, so copy it out of there:
 *
 *   npm run auth:spotify -- --print-url
 *   npm run auth:spotify -- --code=AQD9x...
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

const args = process.argv.slice(2)
const codeArg = args.find((arg) => arg.startsWith('--code='))?.slice('--code='.length)

function report(token) {
  log('\nAdd this to server/.env:\n', 'FgGreen')
  console.log(`SPOTIFY_REFRESH_TOKEN=${token.refresh_token}\n`)
  log(`Scopes granted: ${token.scope}`, 'FgGray')
}

if (codeArg) {
  try {
    report(await exchangeCode(codeArg))
  } catch (err) {
    log(`Could not exchange that code: ${err.message}`, 'FgRed')
    log('Codes are single use and expire in minutes, so get a fresh one.', 'FgGray')
    log(`SPOTIFY_REDIRECT_URI must also match the one you authorized with.`, 'FgGray')
    process.exit(1)
  }
  process.exit(0)
}

if (args.includes('--print-url')) {
  log(`Redirecting to: ${config.spotify.redirectUri}`, 'FgGray')
  log('\nOpen this, approve, then copy the ?code= value off the URL you land on:\n', 'FgGreen')
  console.log(`${authorizeUrl()}\n`)
  log('Then: npm run auth:spotify -- --code=THE_CODE', 'FgGray')
  process.exit(0)
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

    report(token)
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/html' })
    res.end(page('Token exchange failed', err.message))
    log(`Token exchange failed: ${err.message}`, 'FgRed')
    process.exitCode = 1
  }

  server.close()
})

// A redirect URI pointing at a host this machine does not answer for cannot be
// caught here. Say so and point at the manual route rather than dying on a
// bare EADDRNOTAVAIL.
server.on('error', (err) => {
  if (err.code === 'EADDRNOTAVAIL' || err.code === 'ENOTFOUND') {
    log(`Cannot listen on ${redirect.host}: it is not this machine.`, 'FgRed')
    log('Authorize by hand instead:\n', 'FgYellow')
    log('  npm run auth:spotify -- --print-url', 'FgYellow')
    log('  npm run auth:spotify -- --code=THE_CODE\n', 'FgYellow')
  } else if (err.code === 'EADDRINUSE') {
    log(`Port ${redirect.port} is already in use. Free it, or use --print-url.`, 'FgRed')
  } else if (err.code === 'EACCES') {
    log(`Not allowed to listen on port ${redirect.port}. Use --print-url.`, 'FgRed')
  } else {
    log(err.message, 'FgRed')
  }
  process.exit(1)
})

server.listen(Number(redirect.port || 80), redirect.hostname, () => {
  log(`Waiting for the redirect on ${config.spotify.redirectUri}`, 'FgGray')
  log(`This exact URI has to be listed in your app's settings.\n`, 'FgGray')
  log(`Asking for: ${SCOPES.join(', ')}\n`)
  log('Open this and approve:\n', 'FgGreen')
  console.log(`${authorizeUrl(state)}\n`)
})
