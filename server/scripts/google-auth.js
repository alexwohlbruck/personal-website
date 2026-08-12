#!/usr/bin/env node
/**
 * One-time: turn a downloaded service account key into .env lines, and prove
 * the calendar is actually shared with it.
 *
 *   npm run auth:google -- ~/Downloads/your-project-abc123.json
 *
 * With no arguments it verifies whatever is already in .env, which is the
 * useful thing to run when the calendar has gone quiet.
 *
 * The sharing step is the one that goes wrong. A service account is a separate
 * identity: creating it grants nothing, and until the calendar is shared with
 * its address the API answers "not found" rather than "not allowed", which
 * reads like a wrong calendar ID.
 */
import fs from 'node:fs'
import { JWT } from 'google-auth-library'
import { config } from '../src/config.js'
import { fetchJson, log } from '../src/util.js'

const FREEBUSY = 'https://www.googleapis.com/calendar/v3/freeBusy'
const SCOPES = ['https://www.googleapis.com/auth/calendar.freebusy']

const keyPath = process.argv.slice(2).find((arg) => !arg.startsWith('--'))

let clientEmail = config.calendar.clientEmail
let privateKey = config.calendar.privateKey

if (keyPath) {
  let key
  try {
    key = JSON.parse(fs.readFileSync(keyPath, 'utf8'))
  } catch (err) {
    log(`Could not read ${keyPath}: ${err.message}`, 'FgRed')
    process.exit(1)
  }

  if (key.type !== 'service_account' || !key.client_email || !key.private_key) {
    log('That is not a service account key file.', 'FgRed')
    log('In the console: Service accounts > your account > Keys > Add key > JSON.', 'FgGray')
    process.exit(1)
  }

  clientEmail = key.client_email
  privateKey = key.private_key

  log('\nAdd these to server/.env:\n', 'FgGreen')
  console.log(`GOOGLE_CLIENT_EMAIL=${key.client_email}`)
  // Quoted with the newlines escaped, which is the form that survives a .env
  // round trip. config.js turns them back into real newlines.
  console.log(`GOOGLE_PRIVATE_KEY="${key.private_key.replace(/\n/g, '\\n')}"`)
  console.log()
  log(`Then share your calendar with ${key.client_email}`, 'FgYellow')
  log('at "See only free/busy (hide details)".\n', 'FgYellow')
}

if (!clientEmail || !privateKey) {
  log('No service account configured. Pass the path to a downloaded key file.', 'FgRed')
  process.exit(1)
}

if (!config.calendar.calendarId) {
  log('Set GOOGLE_CALENDAR_ID in .env, then run this again to check the sharing.', 'FgYellow')
  log('It is under the calendar\'s Settings > Integrate calendar.', 'FgGray')
  process.exit(0)
}

log(`Checking ${config.calendar.calendarId}`, 'FgGray')
log(`as ${clientEmail}\n`, 'FgGray')

let token
try {
  const auth = new JWT({ email: clientEmail, key: privateKey, scopes: SCOPES })
  ;({ token } = await auth.getAccessToken())
} catch (err) {
  log(`Could not authenticate: ${err.message}`, 'FgRed')
  if (/DECODER|asn1|PEM/i.test(err.message)) {
    log('\nThat private key is malformed. It has to keep its BEGIN and END', 'FgGray')
    log('lines and its newlines. Re-run this with the key file to get it right.', 'FgGray')
  }
  if (/invalid_grant/i.test(err.message)) {
    log('\nEither the service account was deleted, or this machine\'s clock is', 'FgGray')
    log('off far enough that Google rejects the signed assertion.', 'FgGray')
  }
  process.exit(1)
}

const now = new Date()
const week = new Date(now.getTime() + 7 * 24 * 60 * 60_000)

try {
  const body = await fetchJson(FREEBUSY, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      timeMin: now.toISOString(),
      timeMax: week.toISOString(),
      items: [{ id: config.calendar.calendarId }],
    }),
  })

  const calendar = body?.calendars?.[config.calendar.calendarId]

  if (calendar?.errors?.length) {
    const reason = calendar.errors[0].reason
    log(`Google says: ${reason}`, 'FgRed')
    if (reason === 'notFound') {
      log('\nThat means one of two things, and it cannot tell you which:', 'FgYellow')
      log(`  1. The calendar is not shared with ${clientEmail}`, 'FgYellow')
      log('  2. GOOGLE_CALENDAR_ID is wrong', 'FgYellow')
      log('\nSharing is the usual one. Google Calendar > the calendar > Settings >', 'FgGray')
      log('Share with specific people > Add people, paste the address above,', 'FgGray')
      log('permission "See only free/busy (hide details)".', 'FgGray')
    }
    process.exit(1)
  }

  const busy = calendar?.busy ?? []
  log(`Working. ${busy.length} busy block${busy.length === 1 ? '' : 's'} in the next week.`, 'FgGreen')
  if (busy.length) {
    const first = busy[0]
    log(`First one: ${new Date(first.start).toLocaleString()}`, 'FgGray')
  }
  log('\nNo titles came back, which is the point. Free/busy is all it can see.', 'FgGray')
} catch (err) {
  log(`Free/busy query failed: ${err.message}`, 'FgRed')
  if (/403/.test(err.message)) {
    log('\nA 403 here usually means the Calendar API is not enabled on the', 'FgGray')
    log('project. Console > APIs & Services > Library > Google Calendar API.', 'FgGray')
  }
  process.exit(1)
}
