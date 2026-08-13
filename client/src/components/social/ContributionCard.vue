<script setup lang="ts">
import { computed } from 'vue'
import ContributionGraph from '@/components/social/ContributionGraph.vue'
import BinaryField from '@/components/ui/BinaryField.vue'
import type { ContributionCalendar } from '@/data/types'

/**
 * A year of squares with its headline numbers: the card the GitHub and
 * OpenStreetMap sections both open with.
 *
 * Everything the two panels disagree about is a prop, so the layout, the
 * figures and the wording around them stay one thing rather than two that
 * drift apart the first time either is touched.
 */
const props = withDefaults(
  defineProps<{
    calendar: ContributionCalendar
    /** Small mono heading, top left. */
    label: string
    /** The line under it. */
    note?: string
    /** What the big number counts, e.g. "contributions in the last year". */
    unit: string
    /** Singular, for the graph's own captions. */
    noun?: string
    tint?: 'accent' | 'marine'
    /** The faint sheet behind the card: contours for the map, digits for code. */
    pattern?: 'topo' | 'binary' | 'none'
  }>(),
  { note: undefined, noun: 'contribution', tint: 'accent', pattern: 'none' },
)

const number = new Intl.NumberFormat('en-US')

function day(date: string) {
  return new Date(`${date}T00:00:00Z`).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

/** Only the figures there is something to say about. A quiet year should not
 * get a cell reading "0 days". */
const figures = computed(() => {
  const { activeDays, currentStreak, longestStreak, busiestDay } = props.calendar

  return [
    activeDays && { label: 'Active days', value: `${number.format(activeDays)} of 365` },
    currentStreak && { label: 'Current streak', value: `${currentStreak} days` },
    longestStreak && { label: 'Longest streak', value: `${longestStreak} days` },
    busiestDay && {
      label: 'Busiest day',
      value: `${number.format(busiestDay.count)} on ${day(busiestDay.date)}`,
    },
  ].filter(Boolean) as { label: string; value: string }[]
})
</script>

<template>
  <div class="card relative overflow-hidden p-6 sm:p-7">
    <div
      v-if="pattern === 'topo'"
      class="topo-close pointer-events-none absolute inset-0 opacity-45"
      aria-hidden="true"
    />
    <BinaryField v-else-if="pattern === 'binary'" />

    <div class="relative">
      <div class="flex items-start justify-between gap-4">
        <div>
          <p class="label text-ink-3">{{ label }}</p>
          <p v-if="note" class="mt-1.5 text-xs text-ink-3">{{ note }}</p>
        </div>
        <!-- Whatever the section wants in the corner: usually a link out. -->
        <slot name="action" />
      </div>

      <div class="mt-4 flex flex-wrap items-end gap-x-8 gap-y-3">
        <div>
          <p
            class="title tabular text-6xl sm:text-7xl"
            :style="{ color: `var(--${tint})` }"
          >
            {{ number.format(calendar.total) }}
          </p>
          <p class="mt-1 text-xs text-ink-3">{{ unit }}</p>
        </div>

        <dl class="flex flex-wrap gap-x-8 gap-y-3 pb-1">
          <div v-for="figure in figures" :key="figure.label">
            <dt class="label text-ink-3">{{ figure.label }}</dt>
            <dd class="tabular mt-1.5 text-sm font-medium">{{ figure.value }}</dd>
          </div>
        </dl>
      </div>

      <div class="mt-6 border-t border-rule pt-6">
        <ContributionGraph :calendar="calendar" :noun="noun" :tint="tint" />
      </div>
    </div>
  </div>
</template>
