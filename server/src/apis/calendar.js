import { JWT } from 'google-auth-library'
import { config } from '../config.js'
import { cached } from '../lib/cache.js'
import { ApiError, fetchJson } from '../util.js'

/**
 * Free/busy only, through a service account.
 *
 * The old setup authenticated with a bare API key, and an API key can only read
 * a calendar that has been made fully public. That published every event title,
 * guest list and location to anyone who guessed the calendar ID, in order to
 * render a page that deliberately shows nothing but the word "Busy".
 *
 * A service account with the calendar shared to it at "See only free/busy"
 * closes that. The freeBusy endpoint answers with intervals and no titles at
 * all, so the private data never leaves Google in the first place rather than
 * being fetched and then discarded here.
 */
const FREEBUSY = 'https://www.googleapis.com/calendar/v3/freeBusy'
const SCOPES = ['https://www.googleapis.com/auth/calendar.freebusy']

let client

function auth() {
  if (!config.calendar.configured) throw new ApiError('Calendar is not configured', 503)
  client ??= new JWT({
    email: config.calendar.clientEmail,
    key: config.calendar.privateKey,
    scopes: SCOPES,
  })
  return client
}

/**
 * How long a week's free/busy is worth reusing. Long enough that a burst of
 * visitors costs one round trip, short enough that an hour of the day being
 * booked shows up while it still matters.
 */
const TTL = 5 * 60_000

/** Busy intervals between two dates, as ISO strings. */
export async function getBusy(from, to, timeZone = 'America/New_York') {
  // The window is the same for everyone until the day rolls over, so the key is
  // the window itself. The timezone only shifts how Google resolves all-day
  // events, but it changes the answer, so it belongs in the key too.
  const key = `calendar:${timeZone}:${from.toISOString()}:${to.toISOString()}`

  return cached(key, TTL, async () => {
    const { token } = await auth().getAccessToken()

    const body = await fetchJson(FREEBUSY, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        timeMin: from.toISOString(),
        timeMax: to.toISOString(),
        timeZone,
        items: [{ id: config.calendar.calendarId }],
      }),
    })

    const calendar = body?.calendars?.[config.calendar.calendarId]

    // A calendar that has not been shared with the service account comes back
    // as a per-calendar error rather than a failed request, which would
    // otherwise read as a genuinely empty week.
    if (calendar?.errors?.length) {
      throw new ApiError(`Calendar ${calendar.errors[0].reason}`, 502)
    }

    return (calendar?.busy ?? []).map(({ start, end }) => ({ start, end }))
  })
}
