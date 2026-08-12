<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { useIntervalFn } from '@vueuse/core'
import InlineIcon from '@/components/ui/InlineIcon.vue'
import RecordSleeve from '@/components/social/RecordSleeve.vue'
import { useLiveStore } from '@/stores/live'
import { JUKEBOX_URL, links } from '@/data/site'
import { formatDuration, relativeTime } from '@/lib/format'

withDefaults(defineProps<{ compact?: boolean }>(), { compact: false })

const live = useLiveStore()

/** Ticks between polls so the progress bar keeps moving. */
const drift = ref(0)
useIntervalFn(() => {
  if (live.spotify?.is_playing) drift.value += 1000
}, 1000)

watch(
  () => live.spotify,
  () => (drift.value = 0),
)

onMounted(() => void live.fetchSpotify())
onBeforeUnmount(() => live.stopSpotifyPolling())

const track = computed(() => live.spotify?.item)
const playing = computed(() => Boolean(live.spotify?.is_playing))
const artwork = computed(() => {
  const images = track.value?.album.images ?? []
  return images[images.length - 2]?.url ?? images[0]?.url
})
const artists = computed(() => track.value?.artists.map((a) => a.name).join(', ') ?? '')
const progress = computed(() => (live.spotify?.progress_ms ?? 0) + drift.value)
const percent = computed(() =>
  track.value ? Math.min(100, (progress.value / track.value.duration_ms) * 100) : 0,
)
const status = computed(() => {
  if (!live.spotify) return 'Listening'
  return playing.value ? 'Listening now' : `Last played ${relativeTime(live.spotify.timestamp)}`
})

/** Audio must begin from a click. Apart from satisfying browser autoplay rules,
 * it avoids opening a Jukebox transcode for visitors who only want the title. */
const audio = ref<HTMLAudioElement>()
const audible = ref(false)
const audioError = ref(false)

const streamUrl = computed(() => {
  if (!track.value?.id) return null
  const url = new URL('/v1/stream', JUKEBOX_URL)
  url.searchParams.set('spotifyTrackId', track.value.id)
  return url.href
})

async function startAudio() {
  if (!audio.value || !streamUrl.value) return

  audioError.value = false
  audible.value = true
  audio.value.src = streamUrl.value
  audio.value.load()

  try {
    await audio.value.play()
  } catch {
    audible.value = false
    audioError.value = true
  }
}

function stopAudio() {
  audible.value = false
  audio.value?.pause()
  if (audio.value) audio.value.removeAttribute('src')
}

async function toggleAudio() {
  if (audible.value) stopAudio()
  else await startAudio()
}

watch(streamUrl, async (next, previous) => {
  if (!audible.value || !playing.value || !next || next === previous) return
  await startAudio()
})

watch(playing, (isPlaying) => {
  // Do not keep an old stream audible after Spotify itself has stopped.
  if (audible.value && !isPlaying) stopAudio()
})

onBeforeUnmount(stopAudio)
</script>

<template>
  <div>
    <div class="flex items-center justify-between gap-4">
      <span class="text-sm text-ink-3" :class="playing && '!text-accent'">
        {{ compact ? status : 'On repeat' }}
      </span>
      <a
        v-if="!compact"
        :href="links.spotify"
        target="_blank"
        rel="noopener noreferrer"
        class="flex items-center gap-1.5 text-xs text-ink-3 transition-colors hover:text-accent"
      >
        <InlineIcon name="spotify" :size="14" />
        Spotify
      </a>
    </div>

    <!-- Loading -->
    <div v-if="live.spotifyStatus === 'loading'" class="mt-3 flex items-center gap-3">
      <div class="size-10 animate-pulse rounded-md bg-paper-sunk" />
      <div class="flex-1 space-y-2">
        <div class="h-3 w-2/3 animate-pulse rounded bg-paper-sunk" />
        <div class="h-2.5 w-1/3 animate-pulse rounded bg-paper-sunk" />
      </div>
    </div>

    <!-- Nothing to show: stay quiet rather than shout an error. -->
    <p v-else-if="!track" class="mt-2 text-sm text-ink-3">
      Nothing playing right now. Have a look at
      <a :href="links.spotify" target="_blank" rel="noopener noreferrer" class="link"
        >my Spotify</a
      >.
    </p>

    <div
      v-else
      class="mt-3 flex items-center gap-3"
      :class="[
        !compact && 'gap-4',
        compact && 'w-full',
      ]"
    >
      <a
        :href="track.external_urls.spotify"
        target="_blank"
        rel="noopener noreferrer"
        class="shrink-0"
      >
        <RecordSleeve
          :artwork="artwork"
          :alt="`${track.name} album art`"
          :size="compact ? 40 : 76"
          :playing="playing"
        >
          <span
            v-if="playing"
            class="absolute inset-x-0 bottom-0 flex items-end justify-center gap-[2px] p-1"
            style="background: linear-gradient(to top, oklch(0% 0 0 / 0.6), transparent)"
            aria-hidden="true"
          >
            <i
              v-for="bar in 3"
              :key="bar"
              class="eq-bar"
              :style="{ animationDelay: `${bar * 0.18}s` }"
            />
          </span>
        </RecordSleeve>
      </a>

      <div class="min-w-0 flex-1" :class="compact && 'text-right'">
        <a
          :href="track.external_urls.spotify"
          target="_blank"
          rel="noopener noreferrer"
          class="block truncate text-sm font-medium transition-colors hover:text-accent"
          :class="!compact && 'text-base'"
        >
          {{ track.name }}
        </a>
        <p class="truncate text-xs text-ink-3">{{ artists }}</p>

        <div v-if="!compact" class="mt-2.5 flex items-center gap-2">
          <div class="h-1 flex-1 overflow-hidden rounded-full bg-paper-sunk">
            <div
              class="h-full rounded-full bg-accent transition-[width] duration-1000 ease-linear"
              :style="{ width: `${percent}%` }"
            />
          </div>
          <span class="tabular shrink-0 text-xs text-ink-3">
            {{ formatDuration(progress) }} / {{ formatDuration(track.duration_ms) }}
          </span>
        </div>
      </div>
    </div>

    <div v-if="track" class="mt-3 flex items-center gap-2">
      <audio ref="audio" preload="none" @error="audioError = true; audible = false" />
      <button
        type="button"
        class="rounded-full border border-ink-3/25 px-3 py-1.5 text-xs font-medium text-ink-2 transition-colors hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="!streamUrl || !playing"
        :aria-pressed="audible"
        @click="toggleAudio"
      >
        {{ audible ? 'Mute live playback' : 'Unmute live playback' }}
      </button>
      <span v-if="audioError" class="text-xs text-ink-3">Playback is unavailable right now.</span>
      <span v-else-if="!playing" class="text-xs text-ink-3">Playback resumes when the music does.</span>
    </div>

    <p v-if="!compact && track" class="mt-3 text-xs text-ink-3">{{ status }}</p>
  </div>
</template>

<style scoped>
.eq-bar {
  width: 2px;
  height: 8px;
  border-radius: 1px;
  background: oklch(98% 0 0);
  transform-origin: bottom;
  animation: eq 0.9s ease-in-out infinite alternate;
}

@keyframes eq {
  from {
    transform: scaleY(0.35);
  }
  to {
    transform: scaleY(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .eq-bar {
    animation: none;
    transform: scaleY(0.7);
  }
}
</style>
