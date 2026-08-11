import { defineStore } from 'pinia'
import { ref } from 'vue'
import { BACKEND_URL } from '@/data/site'
import type { CalendarEvent, InstagramPost, SpotifyPlaybackState } from '@/data/types'

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  if (!BACKEND_URL) throw new Error('No backend configured')
  const response = await fetch(`${BACKEND_URL}/${path}`, {
    ...init,
    // Only the POST carries a body. Adding this header to the reads would
    // make them non-simple requests and cost a CORS preflight each.
    headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
  })
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.message || `Request failed (${response.status})`)
  }
  return response.json() as Promise<T>
}

type Status = 'idle' | 'loading' | 'ready' | 'error'

/**
 * Everything on the site that comes from the Express server. Each section owns
 * its own status so one dead integration never takes a page down with it.
 */
export const useLiveStore = defineStore('live', () => {
  const spotify = ref<SpotifyPlaybackState | null>(null)
  const spotifyStatus = ref<Status>('idle')
  let spotifyTimer: ReturnType<typeof setTimeout> | undefined

  const instagram = ref<InstagramPost[]>([])
  const instagramStatus = ref<Status>('idle')

  const calendar = ref<CalendarEvent[]>([])
  const calendarStatus = ref<Status>('idle')

  /**
   * Re-checks when the current track is due to end (the server refreshes its own
   * state on the same cadence), and otherwise every couple of minutes. Sleeps
   * while the tab is hidden.
   */
  async function fetchSpotify() {
    if (spotifyStatus.value === 'idle') spotifyStatus.value = 'loading'
    try {
      spotify.value = await api<SpotifyPlaybackState | null>('spotify/playback-state')
      spotifyStatus.value = 'ready'
    } catch {
      spotifyStatus.value = 'error'
    }

    clearTimeout(spotifyTimer)
    const state = spotify.value
    const remaining =
      state?.is_playing && state.item
        ? Math.max(15_000, state.item.duration_ms - state.progress_ms + 2_000)
        : 120_000
    spotifyTimer = setTimeout(() => {
      if (document.visibilityState === 'visible') void fetchSpotify()
      else document.addEventListener('visibilitychange', () => void fetchSpotify(), { once: true })
    }, remaining)
  }

  function stopSpotifyPolling() {
    clearTimeout(spotifyTimer)
    spotifyTimer = undefined
  }

  async function fetchInstagram() {
    if (instagram.value.length) return
    instagramStatus.value = 'loading'
    try {
      instagram.value = await api<InstagramPost[]>('ig/grid')
      instagramStatus.value = 'ready'
    } catch {
      instagramStatus.value = 'error'
    }
  }

  async function fetchCalendar() {
    if (calendar.value.length) return
    calendarStatus.value = 'loading'
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      const data = await api<{ events: CalendarEvent[] }>(
        `calendar?timezone=${encodeURIComponent(timezone)}`,
      )
      calendar.value = data.events ?? []
      calendarStatus.value = 'ready'
    } catch {
      calendarStatus.value = 'error'
    }
  }

  async function sendMessage(payload: { name: string; email: string; message: string }) {
    return api<{ message: string }>('mailer/contact', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }

  return {
    spotify,
    spotifyStatus,
    fetchSpotify,
    stopSpotifyPolling,
    instagram,
    instagramStatus,
    fetchInstagram,
    calendar,
    calendarStatus,
    fetchCalendar,
    sendMessage,
  }
})
