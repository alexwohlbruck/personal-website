/**
 * GA4 tracking via gtag.js.
 *
 * The measurement id ships in the page anyway, so it lives here rather than in
 * deploy configuration — the same reasoning the server applies to the GA
 * property id it reads the guest counter from. Override with
 * `VITE_GA_MEASUREMENT_ID` for local experiments.
 */
const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID ?? 'G-MNXNSBCLCN'

// Dev navigation would otherwise land in the same property as real visitors,
// and the guest counter reads that property's session total.
const enabled = import.meta.env.PROD && Boolean(MEASUREMENT_ID)

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

/** Loads gtag.js. Call once, before the router sends its first page view. */
export function initAnalytics() {
  if (!enabled || window.gtag) return

  window.dataLayer = window.dataLayer ?? []
  // gtag.js reads the `arguments` object off the queue, so this cannot be an
  // arrow function or forward a rest array.
  window.gtag = function gtag() {
    window.dataLayer!.push(arguments)
  }

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`
  document.head.append(script)

  window.gtag('js', new Date())
  // This is a single-page app: gtag only ever sees the first URL, so automatic
  // page views would miss every in-app navigation and double-count the entry
  // page against the router's own event. The router reports instead.
  window.gtag('config', MEASUREMENT_ID, { send_page_view: false })
}

/** Reports one page view. `title` should already be resolved for the route. */
export function trackPageView(title: string) {
  if (!enabled) return
  window.gtag?.('event', 'page_view', {
    page_title: title,
    page_location: window.location.href,
  })
}
