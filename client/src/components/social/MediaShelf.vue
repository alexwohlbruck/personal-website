<script setup lang="ts">
import { Motion } from 'motion-v'
import { duration, ease, inView, step } from '@/lib/motion'

/**
 * A shelf of covers: playlists in one place, podcasts in another. Both are a
 * square, a name and one line under it, so they share a component rather than
 * each getting a near-identical one.
 */
defineProps<{
  items: { id: string; name: string; url: string; image: string | null; note: string }[]
  /** Playlist art is square; podcast art is square. The rounding differs so the
   *  two shelves do not read as one continuous grid. */
  round?: boolean
}>()
</script>

<template>
  <ul class="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4">
    <Motion
      v-for="(item, index) in items"
      :key="item.id"
      as="li"
      :initial="{ opacity: 0, y: 10, filter: 'blur(3px)' }"
      :while-in-view="{ opacity: 1, y: 0, filter: 'blur(0px)' }"
      :in-view-options="inView"
      :transition="{ duration: duration.base, ease, delay: step(index) }"
    >
      <a :href="item.url" target="_blank" rel="noopener noreferrer" class="group block">
        <span
          class="block aspect-square overflow-hidden transition-transform duration-300 ease-out-quint group-hover:-translate-y-1"
          :class="round ? 'rounded-xl' : 'rounded-md'"
          style="box-shadow: var(--tile-ring), var(--shadow-2)"
        >
          <img
            v-if="item.image"
            :src="item.image"
            :alt="item.name"
            loading="lazy"
            class="h-full w-full object-cover"
          />
          <span v-else class="grid h-full w-full place-items-center bg-paper-sunk">
            <span class="title text-2xl text-ink-3">{{ item.name.charAt(0) }}</span>
          </span>
        </span>

        <span class="mt-2.5 block truncate text-sm transition-colors group-hover:text-accent">
          {{ item.name }}
        </span>
        <span class="block truncate text-xs text-ink-3">{{ item.note }}</span>
      </a>
    </Motion>
  </ul>
</template>
