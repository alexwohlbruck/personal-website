<script setup lang="ts">
import { Motion } from 'motion-v'
import { duration, ease, inView, step } from '@/lib/motion'
import type { SpotifyGenre } from '@/data/types'

/**
 * Genres, as a ranked set of bars.
 *
 * The numbers behind these are a weighted tally over top artists rather than
 * anything Spotify measures directly, so they are shown relative to the leading
 * genre and never as a percentage of anything. A bar that is two thirds as long
 * is a claim the data can support; "18% jangle pop" is not.
 */
defineProps<{ genres: SpotifyGenre[] }>()
</script>

<template>
  <ul class="space-y-2.5">
    <Motion
      v-for="(genre, index) in genres"
      :key="genre.name"
      as="li"
      :initial="{ opacity: 0, x: -6 }"
      :while-in-view="{ opacity: 1, x: 0 }"
      :in-view-options="inView"
      :transition="{ duration: duration.base, ease, delay: step(index) }"
    >
      <div class="flex items-baseline justify-between gap-3">
        <span class="truncate text-sm text-ink-2">{{ genre.name }}</span>
        <span v-if="index === 0" class="label text-accent">top</span>
      </div>
      <div class="mt-1.5 h-1 overflow-hidden rounded-full bg-paper-sunk">
        <Motion
          as="div"
          class="h-full rounded-full"
          :initial="{ width: '0%' }"
          :while-in-view="{ width: `${Math.max(6, genre.weight * 100)}%` }"
          :in-view-options="inView"
          :transition="{ duration: duration.slow, ease, delay: step(index, 0.1) }"
          :style="{
            background: index === 0 ? 'var(--accent)' : 'var(--ink-3)',
            opacity: index === 0 ? 1 : 0.55,
          }"
        />
      </div>
    </Motion>
  </ul>
</template>
