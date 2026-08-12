<script setup lang="ts">
import { Motion } from 'motion-v'
import { duration, ease, inView, step } from '@/lib/motion'
import { relativeTime, ordinal } from '@/lib/format'
import type { SpotifyListTrack } from '@/data/types'

/**
 * One list of tracks, used for favourites, history and likes alike.
 *
 * What changes between them is the right-hand column: a chart position means
 * something for a top ten and nothing for a play history, where the useful
 * number is when. So the rank shows only when the order is a ranking, and
 * anything carrying a timestamp shows that instead.
 */
withDefaults(
  defineProps<{
    tracks: SpotifyListTrack[]
    ranked?: boolean
    /** Where this slice started, so a ranking split across two columns keeps
     *  counting instead of restarting at one halfway across the page. */
    offset?: number
  }>(),
  { ranked: false, offset: 0 },
)

const stamp = (track: SpotifyListTrack) => track.played_at ?? track.added_at
</script>

<template>
  <ol class="divide-y divide-rule">
    <Motion
      v-for="(track, index) in tracks"
      :key="`${track.id}:${index}`"
      as="li"
      :initial="{ opacity: 0, x: -6 }"
      :while-in-view="{ opacity: 1, x: 0 }"
      :in-view-options="inView"
      :transition="{ duration: duration.base, ease, delay: step(index) }"
    >
      <a
        :href="track.url"
        target="_blank"
        rel="noopener noreferrer"
        class="group flex items-center gap-3 py-2.5"
      >
        <span v-if="ranked" class="label w-5 shrink-0 text-ink-3">{{ ordinal(index + offset) }}</span>

        <img
          v-if="track.artwork"
          :src="track.artwork"
          :alt="`${track.album} cover`"
          loading="lazy"
          class="size-9 shrink-0 rounded object-cover"
          style="box-shadow: var(--tile-ring)"
        />
        <span v-else class="size-9 shrink-0 rounded bg-paper-sunk" style="box-shadow: var(--tile-ring)" />

        <span class="min-w-0 flex-1">
          <span class="block truncate text-sm transition-colors group-hover:text-accent">
            {{ track.name }}
          </span>
          <span class="block truncate text-xs text-ink-3">{{ track.artists }}</span>
        </span>

        <time
          v-if="stamp(track)"
          :datetime="stamp(track)"
          class="shrink-0 text-xs whitespace-nowrap text-ink-3"
        >
          {{ relativeTime(stamp(track)!) }}
        </time>
      </a>
    </Motion>
  </ol>
</template>
