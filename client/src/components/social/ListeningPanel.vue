<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import SectionHeading from '@/components/ui/SectionHeading.vue'
import ArtistRow from '@/components/social/ArtistRow.vue'
import GenreBars from '@/components/social/GenreBars.vue'
import MediaShelf from '@/components/social/MediaShelf.vue'
import TrackList from '@/components/social/TrackList.vue'
import { useLiveStore } from '@/stores/live'
import type { SpotifyRange } from '@/data/types'

/**
 * The listening habits section: favourites, genres, history, likes, playlists
 * and podcasts.
 *
 * Every block is behind a `v-if` on its own data. Half of this needs Spotify
 * scopes that a token minted before the section existed was never granted, and
 * the server answers with nulls rather than an error in that case, so the page
 * has to be able to show four panels as comfortably as six. Nothing here says
 * "unavailable": a missing panel simply is not there.
 */
const live = useLiveStore()

onMounted(() => void live.fetchListening())

const RANGES: { key: SpotifyRange; label: string; note: string }[] = [
  { key: 'month', label: '4 weeks', note: 'the last four weeks' },
  { key: 'sixMonths', label: '6 months', note: 'the last six months' },
  { key: 'allTime', label: 'all time', note: 'as far back as Spotify counts' },
]

const range = ref<SpotifyRange>('month')

/** Only offer a window the server actually returned data for. */
const available = computed(() =>
  RANGES.filter((option) => live.listening?.ranges[option.key]?.artists.length),
)

const top = computed(() => live.listening?.ranges[range.value] ?? null)
const note = computed(() => RANGES.find((option) => option.key === range.value)?.note ?? '')

/** Ten in a single column leaves half the width empty, so the chart splits and
 *  the second half carries on counting from six. */
const half = computed(() => Math.ceil((top.value?.tracks.length ?? 0) / 2))

const recent = computed(() => live.listening?.recent ?? [])
const liked = computed(() => live.listening?.liked ?? [])

const playlists = computed(() =>
  (live.listening?.playlists?.items ?? []).map((playlist) => ({
    id: playlist.id,
    name: playlist.name,
    url: playlist.url,
    image: playlist.image,
    note: `${playlist.tracks} track${playlist.tracks === 1 ? '' : 's'}`,
  })),
)

const playlistTotal = computed(() => live.listening?.playlists?.total ?? 0)

const shows = computed(() =>
  (live.listening?.shows ?? []).map((show) => ({
    id: show.id,
    name: show.name,
    url: show.url,
    image: show.image,
    note: show.publisher,
  })),
)
</script>

<template>
  <!-- Favourites, and the genres they add up to ---------------------------- -->
  <section v-if="available.length && top" class="py-10">
    <SectionHeading title="On heavy rotation" :note="`What Spotify makes of ${note}.`" />

    <div v-if="available.length > 1" class="mb-8 flex flex-wrap gap-2">
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

    <div class="grid gap-x-12 gap-y-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
      <div v-if="top.genres.length">
        <h3 class="label mb-5 text-ink-3">Genres</h3>
        <GenreBars :genres="top.genres" />
      </div>

      <div v-if="top.artists.length">
        <h3 class="label mb-5 text-ink-3">Artists</h3>
        <ArtistRow :artists="top.artists" />
      </div>
    </div>

    <div v-if="top.tracks.length" class="mt-12">
      <h3 class="label mb-2 text-ink-3">Tracks</h3>
      <div class="grid gap-x-12 md:grid-cols-2">
        <TrackList :tracks="top.tracks.slice(0, half)" ranked />
        <TrackList :tracks="top.tracks.slice(half)" ranked :offset="half" />
      </div>
    </div>
  </section>

  <!-- What actually went through the speakers ------------------------------- -->
  <section v-if="recent.length || liked.length" class="py-10">
    <SectionHeading
      title="The paper trail"
      note="Plays and saves, straight off the account. No curation involved."
    />

    <div class="grid gap-x-12 gap-y-10 md:grid-cols-2">
      <div v-if="recent.length">
        <h3 class="label mb-2 text-ink-3">Recently played</h3>
        <TrackList :tracks="recent" />
      </div>

      <div v-if="liked.length">
        <h3 class="label mb-2 text-ink-3">Freshly liked</h3>
        <TrackList :tracks="liked" />
      </div>
    </div>
  </section>

  <!-- Shelves ---------------------------------------------------------------->
  <section v-if="playlists.length || shows.length" class="py-10">
    <SectionHeading
      title="Off the shelf"
      :note="
        playlistTotal > playlists.length
          ? `${playlistTotal} public playlists, which is more than anyone needs.`
          : 'Playlists and podcasts, public ones only.'
      "
    />

    <div class="space-y-12">
      <div v-if="playlists.length">
        <h3 class="label mb-5 text-ink-3">Playlists</h3>
        <MediaShelf :items="playlists" />
      </div>

      <div v-if="shows.length">
        <h3 class="label mb-5 text-ink-3">In the queue</h3>
        <MediaShelf :items="shows" round />
      </div>
    </div>
  </section>
</template>
