<script setup lang="ts">
import { Motion } from 'motion-v'
import { duration, ease, inView, step } from '@/lib/motion'
import { relativeTime } from '@/lib/format'
import type { SpotifyListTrack } from '@/data/types'

/**
 * A list of tracks with when each one happened.
 *
 * Deliberately unnumbered: the order here is chronological, and an index down
 * the left would read as a chart position that nothing in the data supports.
 */
defineProps<{ tracks: SpotifyListTrack[] }>()
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
        <img
          v-if="track.artwork"
          :src="track.artwork"
          :alt="`${track.album} cover`"
          loading="lazy"
          class="size-9 shrink-0 rounded object-cover"
          style="box-shadow: var(--tile-ring)"
        />
        <span
          v-else
          class="size-9 shrink-0 rounded bg-paper-sunk"
          style="box-shadow: var(--tile-ring)"
        />

        <span class="min-w-0 flex-1">
          <span class="block truncate text-sm transition-colors group-hover:text-accent">
            {{ track.name }}
          </span>
          <span class="block truncate text-xs text-ink-3">{{ track.artists }}</span>
        </span>

        <time
          v-if="track.added_at"
          :datetime="track.added_at"
          class="shrink-0 text-xs whitespace-nowrap text-ink-3"
        >
          {{ relativeTime(track.added_at) }}
        </time>
      </a>
    </Motion>
  </ol>
</template>
