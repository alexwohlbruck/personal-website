<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useIntervalFn } from '@vueuse/core'
import { LoaderCircle, VolumeX } from '@lucide/vue'
import InlineIcon from '@/components/ui/InlineIcon.vue'
import RecordSleeve from '@/components/social/RecordSleeve.vue'
import { useLiveStore } from '@/stores/live'
import { links } from '@/data/site'
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

const streamUrl = computed(() => {
  return Boolean(track.value?.id && playing.value)
})

async function toggleAudio() {
  if (!live.spotifyAudioPlaying) await live.startSpotifyAudio(progress.value)
}
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
      <button
        v-if="playing"
        type="button"
        class="group relative shrink-0 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:cursor-default"
        :disabled="!streamUrl || live.spotifyAudioPlaying || live.spotifyAudioStatus === 'loading'"
        :aria-label="
          live.spotifyAudioPlaying
            ? 'Live playback is unmuted'
            : live.spotifyAudioStatus === 'loading'
              ? 'Loading live playback'
              : 'Unmute live playback'
        "
        :aria-pressed="live.spotifyAudioPlaying"
        @click="toggleAudio"
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
        <span
          v-if="!live.spotifyAudioPlaying"
          class="absolute -right-1 -top-1 grid size-6 place-items-center rounded-full border border-rule bg-paper text-ink-2 shadow-sm transition-colors group-hover:border-accent group-hover:text-accent"
          aria-hidden="true"
        >
          <LoaderCircle v-if="live.spotifyAudioStatus === 'loading'" class="size-3.5 animate-spin" />
          <VolumeX v-else class="size-3.5" />
        </span>
      </button>
      <RecordSleeve
        v-else
        :artwork="artwork"
        :alt="`${track.name} album art`"
        :size="compact ? 40 : 76"
        :playing="false"
        class="shrink-0"
      />

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

    <p v-if="track && live.spotifyAudioStatus === 'error'" class="mt-3 text-xs text-ink-3">
      Playback is unavailable right now.
    </p>

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
