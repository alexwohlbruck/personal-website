const colors = {
  Reset: '\x1b[0m',
  FgRed: '\x1b[31m',
  FgGreen: '\x1b[32m',
  FgYellow: '\x1b[33m',
  FgCyan: '\x1b[36m',
  FgGray: '\x1b[90m',
}

/** Log to console with nice colors :) */
export function log(text, color = 'FgCyan') {
  console.info(`${colors[color] ?? colors.FgCyan}${text}${colors.Reset}`)
}

/**
 * setTimeout modified to allow for larger intervals.
 * https://catonmat.net/settimeout-setinterval
 */
export function setTimeout_(fn, delay) {
  const maxDelay = 2 ** 31 - 1
  if (delay <= maxDelay) return setTimeout(fn, delay)
  return setTimeout(() => setTimeout_(fn, delay - maxDelay), maxDelay)
}

/**
 * An error carrying the HTTP status a route should answer with, so the routes
 * stay a single try/catch instead of unpicking each provider's error shape.
 */
export class ApiError extends Error {
  constructor(message, status = 502) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

/**
 * fetch that throws on a non-2xx instead of quietly handing back an error body.
 * Providers put their real complaint in different places, so pull out whatever
 * looks like a message and leave the rest.
 */
export async function fetchJson(url, init) {
  const response = await fetch(url, init)

  if (response.status === 204) return null

  const text = await response.text()
  let body
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = null
  }

  if (!response.ok) {
    const message =
      body?.error?.message ??
      body?.error_description ??
      body?.error?.error_user_msg ??
      (typeof body?.error === 'string' ? body.error : undefined) ??
      text.slice(0, 200) ??
      response.statusText
    throw new ApiError(`${response.status} ${message}`, response.status)
  }

  return body
}
