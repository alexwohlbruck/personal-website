import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { BACKEND_URL, JUKEBOX_URL } from '@/data/site'
import type {
  CalendarEvent,
  InstagramImage,
  InstagramPost,
  SpotifyListening,
  SpotifyPlaybackState,
} from '@/data/types'

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  if (!BACKEND_URL) throw new Error('No backend configured')
  const response = await fetch(`${BACKEND_URL}/${path}`, {
    ...init,
    // The server caches each provider response at the right cadence. Bypassing
    // the browser cache here prevents a response from before a newly granted
    // Spotify scope from keeping an empty panel on screen for half an hour.
    cache: 'no-store',
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
type AudioStatus = 'idle' | 'loading' | 'playing' | 'error'

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
  /** Kept in the store rather than a card so route changes never stop audio. */
  let spotifyAudio: HTMLAudioElement | undefined
  let preloadedSpotifyAudio: HTMLAudioElement | undefined
  let preloadedSpotifyTrackId: string | undefined
  let audioRequest = 0
  const spotifyAudioStatus = ref<AudioStatus>('idle')
  const spotifyAudioPlaying = ref(false)
  /** A muted stream advances with Spotify before the visitor elects to hear it. */
  const spotifyAudioReady = ref(false)

  const listening = ref<SpotifyListening | null>(null)
  const listeningStatus = ref<Status>('idle')

  const instagram = ref<InstagramPost[]>([])
  const instagramStatus = ref<Status>('idle')
  /** Cursor for the page after the ones already loaded. Null once at the end. */
  const instagramCursor = ref<string | null>(null)
  const instagramDone = ref(false)

  const calendar = ref<CalendarEvent[]>([])
  const calendarStatus = ref<Status>('idle')

  function audioStreamUrl(progressMs: number, item = spotify.value?.item) {
    if (!item?.id) return null
    const url = new URL('/v1/stream', JUKEBOX_URL)
    url.searchParams.set('spotifyTrackId', item.id)
    // A finished timestamp is not a playable offset. Jukebox begins the
    // transcode at this point rather than requiring the browser to seek a
    // chunked response.
    const offset = Math.min(Math.max(0, progressMs), Math.max(0, item.duration_ms - 1))
    url.searchParams.set('startMs', String(Math.round(offset)))
    // Jukebox advances the source by the time it spent resolving and starting
    // the stream, so a warm muted stream begins near the live position rather
    // than a few seconds behind it.
    url.searchParams.set('requestedAtMs', String(Date.now()))
    return url.href
  }

  function createSpotifyAudio() {
    const audio = new Audio()
    audio.preload = 'none'
    audio.addEventListener('error', () => {
      if (audio !== spotifyAudio) return
      spotifyAudioPlaying.value = false
      spotifyAudioReady.value = false
      spotifyAudioStatus.value = 'error'
    })
    return audio
  }

  function discardPreloadedSpotifyAudio() {
    preloadedSpotifyAudio?.pause()
    preloadedSpotifyAudio?.removeAttribute('src')
    preloadedSpotifyAudio?.load()
    preloadedSpotifyAudio = undefined
    preloadedSpotifyTrackId = undefined
  }

  /** Warm exactly one predicted next track. Preload fetches and decodes audio
   * without playing it, so the user hears nothing until Spotify switches. */
  function preloadNextSpotifyAudio() {
    if (!spotifyAudioPlaying.value) return
    const next = spotify.value?.next_item
    if (!next?.id || next.id === spotify.value?.item.id) return discardPreloadedSpotifyAudio()
    if (preloadedSpotifyTrackId === next.id) return

    discardPreloadedSpotifyAudio()
    const url = audioStreamUrl(0, next)
    if (!url) return
    const audio = createSpotifyAudio()
    audio.preload = 'auto'
    audio.src = url
    audio.load()
    preloadedSpotifyAudio = audio
    preloadedSpotifyTrackId = next.id
  }

  async function startSpotifyAudio(progressMs: number) {
    if (!spotify.value?.is_playing) return
    if (spotifyAudio && spotifyAudioReady.value) {
      spotifyAudio.muted = false
      spotifyAudioPlaying.value = true
      spotifyAudioStatus.value = 'playing'
      preloadNextSpotifyAudio()
      return
    }
    const url = audioStreamUrl(progressMs)
    if (!url) return

    const request = ++audioRequest
    const previous = spotifyAudio
    const audio = createSpotifyAudio()
    spotifyAudioStatus.value = 'loading'
    audio.volume = previous ? 0 : 1
    audio.src = url
    audio.load()
    try {
      await audio.play()
      // A later track change won while this source was resolving.
      if (request !== audioRequest) {
        audio.pause()
        audio.removeAttribute('src')
        return
      }

      spotifyAudio = audio
      spotifyAudioPlaying.value = true
      spotifyAudioReady.value = true
      spotifyAudioStatus.value = 'playing'
      if (previous) crossfade(previous, audio)
      preloadNextSpotifyAudio()
    } catch {
      if (request !== audioRequest) return
      spotifyAudioPlaying.value = false
      spotifyAudioStatus.value = 'error'
    }
  }

  /**
   * A muted element is eligible for autoplay in browsers that block audible
   * autoplay. Starting it now is what keeps its clock near Spotify's; the
   * click merely unmutes an already-running stream.
   */
  async function warmSpotifyAudio(progressMs: number) {
    if (!spotify.value?.is_playing || spotifyAudio) return
    const url = audioStreamUrl(progressMs)
    if (!url) return

    const request = ++audioRequest
    const audio = createSpotifyAudio()
    audio.muted = true
    audio.src = url
    audio.load()
    try {
      await audio.play()
      if (request !== audioRequest) {
        audio.pause()
        audio.removeAttribute('src')
        return
      }
      spotifyAudio = audio
      spotifyAudioReady.value = true
      spotifyAudioStatus.value = 'idle'
    } catch {
      // Some browsers disallow muted autoplay too. The sleeve still starts a
      // fresh stream from the live offset when clicked.
    }
  }

  /** Let the new track buffer and start before fading the old one out. */
  function crossfade(oldAudio: HTMLAudioElement, newAudio: HTMLAudioElement) {
    const duration = 450
    const started = performance.now()
    const oldVolume = oldAudio.volume

    const frame = (now: number) => {
      const progress = Math.min(1, (now - started) / duration)
      oldAudio.volume = oldVolume * (1 - progress)
      newAudio.volume = progress
      if (progress < 1) requestAnimationFrame(frame)
      else {
        oldAudio.pause()
        oldAudio.removeAttribute('src')
        oldAudio.load()
      }
    }
    requestAnimationFrame(frame)
  }

  function stopSpotifyAudio() {
    audioRequest += 1
    spotifyAudioPlaying.value = false
    spotifyAudioReady.value = false
    spotifyAudioStatus.value = 'idle'
    spotifyAudio?.pause()
    spotifyAudio?.removeAttribute('src')
    spotifyAudio?.load()
    spotifyAudio = undefined
    discardPreloadedSpotifyAudio()
  }

  /** Mute preserves the warmed stream and its buffer; unmute is immediate. */
  function toggleSpotifyAudio(progressMs: number) {
    if (spotifyAudioPlaying.value && spotifyAudio) {
      spotifyAudio.muted = true
      spotifyAudioPlaying.value = false
      spotifyAudioStatus.value = 'idle'
      return
    }
    return startSpotifyAudio(progressMs)
  }

  watch(
    () => spotify.value?.item.id,
    (id, previous) => {
      if (!id || id === previous || !spotify.value?.is_playing) return
      if (spotifyAudioPlaying.value) {
        if (preloadedSpotifyTrackId === id && preloadedSpotifyAudio && spotifyAudio) {
          void playPreloadedSpotifyAudio(spotifyAudio, preloadedSpotifyAudio)
        } else {
          // A manual skip can bypass Spotify's queue prediction. Do not let a
          // stale track play through while the replacement is being resolved.
          stopSpotifyAudio()
          void startSpotifyAudio(spotify.value.progress_ms)
        }
      } else {
        stopSpotifyAudio()
        void warmSpotifyAudio(spotify.value.progress_ms)
      }
    },
  )

  watch(
    () => spotify.value?.next_item?.id,
    () => preloadNextSpotifyAudio(),
  )

  watch(
    () => spotify.value?.is_playing,
    (isPlaying) => {
      if (spotifyAudio && !isPlaying) stopSpotifyAudio()
    },
  )

  async function playPreloadedSpotifyAudio(oldAudio: HTMLAudioElement, newAudio: HTMLAudioElement) {
    const request = ++audioRequest
    // Take ownership without clearing the source we just spent time buffering.
    preloadedSpotifyAudio = undefined
    preloadedSpotifyTrackId = undefined
    newAudio.volume = 0
    try {
      await newAudio.play()
      if (request !== audioRequest) return
      spotifyAudio = newAudio
      spotifyAudioStatus.value = 'playing'
      crossfade(oldAudio, newAudio)
      preloadNextSpotifyAudio()
    } catch {
      if (request !== audioRequest) return
      stopSpotifyAudio()
      void startSpotifyAudio(spotify.value?.progress_ms ?? 0)
    }
  }

  /**
   * The server holds one connection open and writes the track when it changes,
   * so this waits to be told instead of asking. Spotify itself has no push API,
   * but the server polls once for everybody, which is the part that used to
   * scale with the number of people reading the page.
   */
  function fetchSpotify() {
    if (!BACKEND_URL) return
    // The persistent header owns the connection; cards can safely ask for it
    // too without multiplying SSE sockets or visibility listeners.
    if (stream || polling) return
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

  /**
   * Top artists, genres, history, likes, playlists and podcasts.
   *
   * Fetched once per page load and never refreshed. Nothing in it moves on a
   * timescale a visitor would sit through, and the server caches every part of
   * it for hours anyway, so re-asking would only ever return the same answer.
   */
  async function fetchListening() {
    if (listening.value || listeningStatus.value === 'loading') return
    listeningStatus.value = 'loading'
    try {
      listening.value = await api<SpotifyListening>('spotify/listening')
      listeningStatus.value = 'ready'
    } catch {
      listeningStatus.value = 'error'
    }
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
    spotifyAudioStatus,
    spotifyAudioPlaying,
    startSpotifyAudio,
    stopSpotifyAudio,
    toggleSpotifyAudio,
    listening,
    listeningStatus,
    fetchListening,
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
