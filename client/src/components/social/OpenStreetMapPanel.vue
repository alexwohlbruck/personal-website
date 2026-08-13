<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { ArrowUpRight, MapPin } from '@lucide/vue'
import SectionHeading from '@/components/ui/SectionHeading.vue'
import InlineIcon from '@/components/ui/InlineIcon.vue'
import ContributionCard from '@/components/social/ContributionCard.vue'
import { useLiveStore } from '@/stores/live'
import { links } from '@/data/site'
import { relativeTime } from '@/lib/format'

const live = useLiveStore()

onMounted(() => void live.fetchOsm())

const stats = computed(() => live.osm)
const loading = computed(() => live.osmStatus === 'loading' || live.osmStatus === 'idle')
const largestPlace = computed(() => Math.max(...(stats.value?.places.map((place) => place.count) ?? [1])))

const number = new Intl.NumberFormat('en-US')
const memberYear = computed(() =>
  stats.value?.memberSince ? new Date(stats.value.memberSince).getFullYear() : null,
)
</script>

<template>
  <section class="py-10">
    <SectionHeading
      title="Building a better map"
      note="Where I've spent time filling in the details."
    />

    <div v-if="loading" class="space-y-6">
      <div class="card h-72 animate-pulse bg-paper-sunk" />
      <div class="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div class="card h-80 animate-pulse bg-paper-sunk" />
        <div class="card h-80 animate-pulse bg-paper-sunk" />
      </div>
    </div>

    <div v-else-if="stats" class="space-y-6">
      <!-- Marine rather than the rust next door: this is the map colour, and
           the squares are a year of the map being drawn. -->
      <ContributionCard
        :calendar="stats.calendar"
        label="Editing calendar"
        :note="`Mapping since ${memberYear}`"
        unit="changesets in the last year"
        noun="changeset"
        tint="marine"
        pattern="topo"
      />

      <div class="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div class="card p-6 sm:p-7">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="label text-ink-3">OpenStreetMap history</p>
              <p class="mt-1.5 text-xs text-ink-3">Since {{ memberYear }}</p>
            </div>
            <a
              :href="stats.profile"
              target="_blank"
              rel="noopener noreferrer"
              class="grid size-10 shrink-0 place-items-center rounded-lg bg-marine-wash text-marine transition-transform duration-300 ease-out-quint hover:-translate-y-0.5"
              aria-label="Open Alex's OpenStreetMap profile"
            >
              <InlineIcon name="osm" :size="20" />
            </a>
          </div>

          <div class="mt-4 grid grid-cols-[0.8fr_1.2fr] items-end">
            <div class="pr-4 sm:pr-6">
              <p class="title tabular text-6xl text-marine sm:text-7xl">
                {{ number.format(stats.changesets) }}
              </p>
              <p class="mt-1 text-xs text-ink-3">changesets</p>
            </div>
            <div class="pb-1 pl-4 sm:pl-6">
              <p class="title tabular text-4xl sm:text-6xl">
                {{ number.format(stats.mappedObjects) }}
              </p>
              <p class="mt-1 text-xs text-ink-3">map objects</p>
            </div>
          </div>

          <div class="mt-6 border-t border-rule pt-5">
            <p class="label mb-4 text-ink-3">Most active areas</p>

            <ol v-if="stats.places.length" class="space-y-3">
              <li v-for="place in stats.places" :key="place.label">
                <div class="mb-1 flex items-start justify-between gap-3 text-sm">
                  <span class="flex min-w-0 items-start gap-2 font-medium leading-snug">
                    <MapPin class="mt-0.5 size-3.5 shrink-0 text-marine" aria-hidden="true" />
                    <span>{{ place.label }}</span>
                  </span>
                  <span class="tabular shrink-0 text-xs text-ink-3">
                    {{ number.format(place.count) }} changeset{{ place.count === 1 ? '' : 's' }}
                  </span>
                </div>
                <div class="h-1 overflow-hidden rounded-full bg-paper-sunk">
                  <div
                    class="h-full rounded-full bg-marine"
                    :style="{ width: `${Math.max(6, (place.count / largestPlace) * 100)}%` }"
                  />
                </div>
              </li>
            </ol>
          </div>
        </div>

        <div class="card flex flex-col p-6 sm:p-7">
          <div>
            <p class="label text-ink-3">Themes</p>
            <div class="mt-3 flex flex-wrap gap-2">
              <span v-for="theme in stats.themes" :key="theme.name" class="chip">
                {{ theme.name }}
                <span class="tabular text-ink-3">{{ number.format(theme.count) }}</span>
              </span>
            </div>
          </div>

          <div class="mt-7">
            <div class="mb-2 flex items-baseline justify-between gap-4">
              <p class="label text-ink-3">Recent changesets</p>
              <a
                :href="links.osm"
                target="_blank"
                rel="noopener noreferrer"
                class="flex items-center gap-1 text-xs text-ink-3 transition-colors hover:text-accent"
              >
                Full history
                <ArrowUpRight class="size-3.5" aria-hidden="true" />
              </a>
            </div>

            <ul>
              <li v-for="edit in stats.recent" :key="edit.id" class="border-b border-rule last:border-0">
                <a
                  :href="edit.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="group grid grid-cols-[1fr_auto] gap-4 py-3"
                >
                  <span class="min-w-0">
                    <span class="block truncate text-sm font-medium transition-colors group-hover:text-accent">
                      {{ edit.comment }}
                    </span>
                    <span class="mt-1 block text-xs text-ink-3">{{ relativeTime(edit.createdAt) }}</span>
                  </span>
                  <span class="tabular self-center text-xs text-ink-3">
                    {{ number.format(edit.changes) }} change{{ edit.changes === 1 ? '' : 's' }}
                  </span>
                </a>
              </li>
            </ul>
          </div>

          <p class="mt-auto pt-5 text-xs text-ink-3">
            Map data and place names ©
            <a
              href="https://www.openstreetmap.org/copyright"
              target="_blank"
              rel="noopener noreferrer"
              class="link"
            >OpenStreetMap contributors</a>.
          </p>
        </div>
      </div>
    </div>

    <div v-else class="card p-6 text-sm text-ink-3">
      Map stats aren't loading right now. See my profile on
      <a :href="links.osm" target="_blank" rel="noopener noreferrer" class="link">OpenStreetMap</a>.
    </div>
  </section>
</template>
