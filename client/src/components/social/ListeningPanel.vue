<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import SectionHeading from '@/components/ui/SectionHeading.vue'
import NowPlaying from '@/components/social/NowPlaying.vue'
import ArtistRow from '@/components/social/ArtistRow.vue'
import GenreBars from '@/components/social/GenreBars.vue'
import TrackList from '@/components/social/TrackList.vue'
import { useLiveStore } from '@/stores/live'
import type { SpotifyRange } from '@/data/types'

/**
 * Current music: the player, what has been liked lately, and what Spotify
 * itself says the top artists and genres are.
 *
 * Every block is behind a `v-if` on its own data. All three need a Spotify
 * scope that a token minted before this section existed was never granted, and
 * the server answers with nulls rather than an error in that case, so the
 * section has to read as well with one panel as with three.
 */
const live = useLiveStore()

onMounted(() => void live.fetchListening())

const liked = computed(() => live.listening?.liked ?? [])

const RANGES: { key: SpotifyRange; label: string; note: string }[] = [
  { key: 'month', label: '4 weeks', note: 'What Spotify makes of the last four weeks.' },
  { key: 'sixMonths', label: '6 months', note: 'What Spotify makes of the last six months.' },
  { key: 'allTime', label: 'all time', note: 'As far back as Spotify keeps count.' },
]

const range = ref<SpotifyRange>('month')

/** Only offer a window the server actually returned data for. */
const available = computed(() =>
  RANGES.filter((option) => live.listening?.ranges[option.key]?.artists.length),
)

const top = computed(() => live.listening?.ranges[range.value] ?? null)
const note = computed(() => RANGES.find((option) => option.key === range.value)?.note ?? '')
</script>

<template>
  <section class="py-10">
    <SectionHeading
      title="Currently in my ears"
      note="Here's what I've been listening to lately."
    />

    <div v-if="available.length > 1" class="mt-7 flex flex-wrap items-center gap-x-3 gap-y-2">
      <span class="label text-ink-3">Listening window</span>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="option in available"
          :key="option.key"
          type="button"
          class="chip cursor-pointer"
          :class="range === option.key && 'chip-active'"
          :aria-pressed="range === option.key"
          @click="range = option.key"
        >
          {{ option.label }}
        </button>
      </div>
      <span class="text-xs text-ink-3">{{ note }}</span>
    </div>

    <div class="grid gap-6 lg:grid-cols-2 lg:items-start" :class="available.length > 1 ? 'mt-6' : 'mt-10'">
      <!-- Keep cards content-sized. Equal-width columns do not need empty
           stretched cards to look balanced. -->
      <div class="space-y-6">
        <div class="card p-5">
          <NowPlaying />
        </div>

        <div v-if="top?.genres.length" class="card p-5">
          <h3 class="label mb-4 text-ink-3">Genres</h3>
          <GenreBars :genres="top.genres" />
        </div>

        <div v-if="top?.artists.length" class="card p-5">
          <h3 class="label mb-5 text-ink-3">Artists</h3>
          <ArtistRow :artists="top.artists" />
        </div>
      </div>

      <div v-if="liked.length" class="card p-5 pb-7">
        <h3 class="label mb-2 text-ink-3">Freshly liked</h3>
        <TrackList :tracks="liked" />
      </div>
    </div>
  </section>
</template>
