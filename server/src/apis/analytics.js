import { JWT } from 'google-auth-library'
import { config } from '../config.js'
import { cached } from '../lib/cache.js'
import { ApiError, fetchJson } from '../util.js'

const DATA_API = 'https://analyticsdata.googleapis.com/v1beta'
const SCOPES = ['https://www.googleapis.com/auth/analytics.readonly']
const TTL = 10 * 60_000

let client

function auth() {
  if (!config.analytics.configured) throw new ApiError('Analytics is not configured', 503)
  client ??= new JWT({
    email: config.analytics.clientEmail,
    key: config.analytics.privateKey,
    scopes: SCOPES,
  })
  return client
}

export function parseVisitorCount(report) {
  const value = Number(report?.rows?.[0]?.metricValues?.[0]?.value ?? 0)
  return Number.isSafeInteger(value) && value >= 0 ? value : 0
}

/** Historical sessions across the site. */
export async function getGuestbookVisitorCount() {
  return cached(`analytics:guestbook-sessions:${config.analytics.propertyId}`, TTL, async () => {
    const { token } = await auth().getAccessToken()
    const report = await fetchJson(
      `${DATA_API}/properties/${config.analytics.propertyId}:runReport`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateRanges: [{ startDate: '2020-01-01', endDate: 'today' }],
          metrics: [{ name: 'sessions' }],
        }),
      },
    )
    return parseVisitorCount(report)
  })
}
