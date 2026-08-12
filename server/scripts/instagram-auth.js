#!/usr/bin/env node
/**
 * One-time: prove an Instagram token works and start its clock.
 *
 * The easy path is Meta's dashboard. Under your app, Instagram > API setup with
 * Instagram business login, there is a button that mints a 60-day token
 * directly. Paste it into .env as INSTAGRAM_ACCESS_TOKEN and run this with no
 * arguments: it checks the token, tells you whose account it opens, and records
 * the expiry so the server knows when to renew it.
 *
 *   npm run auth:instagram
 *
 * If you would rather do the full OAuth round trip, this can do that too. Meta
 * requires an https redirect URI, so there is no loopback server to catch the
 * code the way the Spotify script does. Run --authorize, approve in the
 * browser, then copy the `code` query parameter off the redirect:
 *
 *   npm run auth:instagram -- --authorize
 *   npm run auth:instagram -- --code=AQBx-hBsH3...
 */
import { config } from '../src/config.js'
import { authorizeUrl, exchangeCode, getProfile, SCOPES } from '../src/apis/instagram.js'
import { setToken } from '../src/tokens.js'
import { log } from '../src/util.js'

const args = process.argv.slice(2)
const codeArg = args.find((arg) => arg.startsWith('--code='))?.slice('--code='.length)

/** Meta's dashboard tokens are long-lived, which means 60 days. */
const SIXTY_DAYS = 60 * 24 * 60 * 60

if (args.includes('--authorize')) {
  if (!config.instagram.appId) {
    log('Set INSTAGRAM_APP_ID in server/.env first.', 'FgRed')
    process.exit(1)
  }
  log(`Asking for: ${SCOPES.join(', ')}`, 'FgGray')
  log(`Redirecting to: ${config.instagram.redirectUri}`, 'FgGray')
  log('\nOpen this, approve, then copy the ?code= value off the URL you land on:\n', 'FgGreen')
  console.log(`${authorizeUrl()}\n`)
  process.exit(0)
}

if (codeArg) {
  if (!config.instagram.appId || !config.instagram.appSecret) {
    log('Set INSTAGRAM_APP_ID and INSTAGRAM_APP_SECRET in server/.env first.', 'FgRed')
    process.exit(1)
  }

  try {
    const token = await exchangeCode(codeArg)
    setToken('instagram_access_token', token.access_token, Number(token.expires_in) || SIXTY_DAYS)

    log('\nSaved to .tokens.json. Also put it in server/.env so a fresh checkout works:\n', 'FgGreen')
    console.log(`INSTAGRAM_ACCESS_TOKEN=${token.access_token}\n`)
  } catch (err) {
    log(`Could not exchange that code: ${err.message}`, 'FgRed')
    log('Codes are single use and expire quickly, so run --authorize again.', 'FgGray')
    process.exit(1)
  }

  process.exit(0)
}

if (!config.instagram.configured) {
  log('Set INSTAGRAM_ACCESS_TOKEN in server/.env, or run with --authorize.', 'FgRed')
  process.exit(1)
}

try {
  const profile = await getProfile()

  log(`\nToken works. It opens @${profile.username}.`, 'FgGreen')
  if (profile.account_type) log(`Account type: ${profile.account_type}`, 'FgGray')
  if (profile.media_count !== undefined) log(`Posts: ${profile.media_count}`, 'FgGray')

  if (profile.account_type === 'PERSONAL') {
    log('\nThat is a personal account, so the media endpoints will refuse it.', 'FgYellow')
    log('Switch to Creator or Business in the Instagram app and try again.', 'FgYellow')
    process.exit(1)
  }

  // A guess, and flagged as one. Meta does not report how long a token minted
  // in its dashboard lasts, so the server confirms this against the real expiry
  // once the token is old enough for Meta to allow a refresh.
  setToken('instagram_access_token', config.instagram.accessToken, SIXTY_DAYS, {
    estimated: true,
  })
  log('\nAssuming 60 days for now. Meta does not say, so that is inference.', 'FgGray')
  log('The server confirms it against the real expiry after 24 hours.', 'FgGray')
} catch (err) {
  log(`\nThat token did not work: ${err.message}`, 'FgRed')
  process.exit(1)
}
