import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { BACKEND_URL } from '@/data/site'
import type {
  CalendarEvent,
  InstagramImage,
  InstagramPost,
  SpotifyPlaybackState,
} from '@/data/types'

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
  let stream: EventSource | undefined
  let spotifyTimer: ReturnType<typeof setTimeout> | undefined
  let polling = false

  const instagram = ref<InstagramPost[]>([])
  const instagramStatus = ref<Status>('idle')
  /** Cursor for the page after the ones already loaded. Null once at the end. */
  const instagramCursor = ref<string | null>(null)
  const instagramDone = ref(false)

  const calendar = ref<CalendarEvent[]>([])
  const calendarStatus = ref<Status>('idle')

  /**
   * The server holds one connection open and writes the track when it changes,
   * so this waits to be told instead of asking. Spotify itself has no push API,
   * but the server polls once for everybody, which is the part that used to
   * scale with the number of people reading the page.
   */
  function fetchSpotify() {
    if (!BACKEND_URL) return
    if (typeof EventSource === 'undefined') return void pollSpotify()

    openStream()
    document.addEventListener('visibilitychange', onVisibility)
  }

  function openStream() {
    stream?.close()
    if (spotifyStatus.value === 'idle') spotifyStatus.value = 'loading'

    stream = new EventSource(`${BACKEND_URL}/spotify/stream`)

    stream.addEventListener('playback', (event) => {
      spotify.value = JSON.parse((event as MessageEvent<string>).data)
      spotifyStatus.value = 'ready'
    })

    stream.onerror = () => {
      // A dropped connection puts EventSource back into CONNECTING and it
      // retries on its own. CLOSED means the server answered with something
      // that is not a stream, and no amount of retrying will change that, so
      // fall back to asking rather than leaving the section empty.
      if (stream?.readyState !== EventSource.CLOSED) return
      stream = undefined
      void pollSpotify()
    }
  }

  /** The old behaviour, kept for a browser or proxy that will not hold a
   *  stream open. Re-checks when the track is due to end. */
  async function pollSpotify() {
    polling = true
    try {
      spotify.value = await api<SpotifyPlaybackState | null>('spotify/playback-state')
      spotifyStatus.value = 'ready'
    } catch {
      spotifyStatus.value = 'error'
      return
    }

    clearTimeout(spotifyTimer)
    const state = spotify.value
    const remaining =
      state?.is_playing && state.item
        ? Math.max(15_000, state.item.duration_ms - state.progress_ms + 2_000)
        : 120_000
    spotifyTimer = setTimeout(() => {
      if (document.visibilityState === 'visible') void pollSpotify()
      else document.addEventListener('visibilitychange', () => void pollSpotify(), { once: true })
    }, remaining)
  }

  /** A backgrounded tab has nobody looking at it, and an open stream keeps the
   *  server polling Spotify on its behalf. */
  function onVisibility() {
    if (polling) return
    if (document.visibilityState === 'visible') openStream()
    else stream?.close()
  }

  function stopSpotifyPolling() {
    document.removeEventListener('visibilitychange', onVisibility)
    stream?.close()
    stream = undefined
    clearTimeout(spotifyTimer)
    spotifyTimer = undefined
    polling = false
  }

  const INSTAGRAM_PAGE = 12

  /**
   * Guarantees every post has a `media` array, so nothing downstream has to
   * guess. Responses are cached for minutes by the browser and by the server,
   * which means a payload written before `media` existed can still arrive after
   * a deploy. Reading `.length` off that took the whole section down, and a
   * missing field is not worth a blank page.
   */
  function normalise(posts: InstagramPost[]): InstagramPost[] {
    return posts
      .map((post) => ({
        ...post,
        media: post.media?.filter(Boolean) ?? (post.media_url ? [post.media_url] : []),
      }))
      .filter((post) => post.media.length > 0)
  }

  /**
   * Every photo, flattened out of its post.
   *
   * Most posts here are albums, so a grid of posts would show one cover each
   * and hide the rest. Flattening means the grid is photos rather than posts.
   * The post each one came from is carried along for its caption and link.
   */
  const instagramImages = computed<InstagramImage[]>(() =>
    instagram.value.flatMap((post) =>
      post.media.map((url, i) => ({
        key: `${post.id}:${i}`,
        url,
        permalink: post.permalink,
        caption: post.caption,
        position: i + 1,
        total: post.media.length,
      })),
    ),
  )

  /**
   * Pulls the next page and appends it. Photos already loaded stay loaded, so
   * paging back through the slideshow costs nothing and the browser keeps the
   * images it has already decoded.
   */
  async function fetchInstagram() {
    if (instagramDone.value || instagramStatus.value === 'loading') return
    if (instagram.value.length) return loadMoreInstagram()

    instagramStatus.value = 'loading'
    try {
      const page = await api<{ posts: InstagramPost[]; next: string | null }>(
        `instagram/grid?limit=${INSTAGRAM_PAGE}`,
      )
      instagram.value = normalise(page.posts)
      instagramCursor.value = page.next
      instagramDone.value = !page.next
      instagramStatus.value = 'ready'
    } catch {
      instagramStatus.value = 'error'
    }
  }

  async function loadMoreInstagram() {
    if (instagramDone.value || !instagramCursor.value) return
    if (instagramStatus.value === 'loading') return

    instagramStatus.value = 'loading'
    try {
      const page = await api<{ posts: InstagramPost[]; next: string | null }>(
        `instagram/grid?limit=${INSTAGRAM_PAGE}&after=${encodeURIComponent(instagramCursor.value)}`,
      )
      instagram.value = [...instagram.value, ...normalise(page.posts)]
      instagramCursor.value = page.next
      instagramDone.value = !page.next
    } catch {
      // Keep what we have. A failed page turn should not empty the slideshow.
      instagramDone.value = true
    }
    instagramStatus.value = 'ready'
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
    instagramImages,
    instagramStatus,
    instagramDone,
    fetchInstagram,
    loadMoreInstagram,
    calendar,
    calendarStatus,
    fetchCalendar,
    sendMessage,
  }
})
