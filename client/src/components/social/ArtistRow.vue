<script setup lang="ts">
import { Motion } from 'motion-v'
import { duration, ease, inView, step } from '@/lib/motion'
import type { SpotifyArtist } from '@/data/types'

/**
 * Top artists, ranked. Round portraits because that is how Spotify frames an
 * artist and a square would read as an album instead.
 */
defineProps<{ artists: SpotifyArtist[] }>()
</script>

<template>
  <ul class="grid grid-cols-3 gap-x-4 gap-y-6 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5">
    <Motion
      v-for="(artist, index) in artists"
      :key="artist.id"
      as="li"
      :initial="{ opacity: 0, y: 10, filter: 'blur(3px)' }"
      :while-in-view="{ opacity: 1, y: 0, filter: 'blur(0px)' }"
      :in-view-options="inView"
      :transition="{ duration: duration.base, ease, delay: step(index) }"
    >
      <a
        :href="artist.url"
        target="_blank"
        rel="noopener noreferrer"
        class="group block text-center"
      >
        <span class="relative mx-auto block w-fit">
          <img
            v-if="artist.image"
            :src="artist.image"
            :alt="artist.name"
            loading="lazy"
            class="size-16 rounded-full object-cover transition-transform duration-300 ease-out-quint group-hover:-translate-y-1 sm:size-20"
            style="box-shadow: var(--tile-ring), var(--shadow-2)"
          />
          <span
            v-else
            class="grid size-16 place-items-center rounded-full bg-paper-sunk sm:size-20"
            style="box-shadow: var(--tile-ring)"
          >
            <span class="title text-xl text-ink-3">{{ artist.name.charAt(0) }}</span>
          </span>

          <span
            class="label absolute -top-1 -left-1 grid size-6 place-items-center rounded-full bg-paper text-ink-3 transition-colors duration-300 group-hover:bg-accent group-hover:text-[var(--on-accent)]"
            style="box-shadow: var(--tile-ring)"
          >
            {{ index + 1 }}
          </span>
        </span>

        <span
          class="mt-2.5 block truncate text-xs text-ink-2 transition-colors group-hover:text-accent"
        >
          {{ artist.name }}
        </span>
      </a>
    </Motion>
  </ul>
</template>
