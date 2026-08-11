<script setup lang="ts">
import { computed } from 'vue'
import { Motion } from 'motion-v'
import { ArrowUpRight } from '@lucide/vue'
import { assetUrl } from '@/lib/assets'
import { timeline } from '@/data/timeline'
import { monthShort } from '@/lib/format'
import { duration, ease, inView, step } from '@/lib/motion'
import type { TimelineEvent } from '@/data/types'

/**
 * A single moment shows one year. A span inside one year falls back to months,
 * so nothing reads "2019–2019".
 */
function period(event: TimelineEvent): string {
  if (event.ongoing) return `${event.from.getFullYear()}–Now`
  if (!event.to) return String(event.from.getFullYear())
  if (event.from.getFullYear() === event.to.getFullYear()) {
    return `${monthShort(event.from)}–${monthShort(event.to)} ${event.from.getFullYear()}`
  }
  return `${event.from.getFullYear()}–${event.to.getFullYear()}`
}

function closesAt(event: TimelineEvent) {
  if (event.ongoing) return Date.now()
  return (event.to ?? event.from).getTime()
}

/**
 * Threads, laid out like transit lines.
 *
 * Entries are listed newest first, so reading down the page walks backwards
 * through time and an entry's duration runs *upward* from where it starts.
 * Anything still running when a later entry began overlaps it, so its thread
 * climbs past that entry rather than stopping.
 *
 * `reach` is the highest row an entry's thread climbs to: the first row above
 * it whose entry had already begun before this one ended. Two entries are
 * concurrent when their reaches overlap, which happens exactly when one
 * entry's reach extends up to or past the other's row. That makes lane
 * assignment a plain greedy sweep, and rows map to CSS grid rows, so the
 * threads need no measurement to draw.
 */
const rows = computed(() => {
  const events = timeline
  const ends = events.map(closesAt)

  const reach = events.map((_, i) => {
    for (let j = 0; j < i; j++) {
      if (events[j]!.from.getTime() <= ends[i]!) return j
    }
    return i
  })

  const lanes: number[] = []
  events.forEach((_, i) => {
    // Conflicts are precisely the entries this thread climbs past.
    const taken = new Set<number>()
    for (let j = reach[i]!; j < i; j++) taken.add(lanes[j]!)
    let lane = 0
    while (taken.has(lane)) lane++
    lanes[i] = lane
  })

  return events.map((event, i) => ({
    event,
    row: i,
    reach: reach[i]!,
    lane: lanes[i]!,
    label: period(event),
    color:
      event.ongoing
        ? 'var(--accent)'
        : event.kind === 'education'
          ? 'var(--marine)'
          : 'var(--ink-3)',
  }))
})

const laneCount = computed(() => Math.max(...rows.value.map((r) => r.lane)) + 1)

/** Pixels, so the connector SVG can be drawn at exactly its rendered size. */
const LANE = 14
const CURVE = 26

/**
 * The S a fork makes leaving the trunk. Both control points sit directly below
 * the start and above the end, which lands the curve tangent to vertical at
 * both ends: it eases out of the trunk and eases into the branch instead of
 * turning a corner. A quarter-circle radius cannot do that, it meets the
 * straight runs at a fixed rate.
 */
function connector(lane: number) {
  const w = lane * LANE
  return { width: w, height: CURVE, d: `M0 0C0 ${CURVE / 2} ${w} ${CURVE / 2} ${w} ${CURVE}` }
}
</script>

<template>
  <ol
    class="grid [--dot:0.62rem] [--lane:14px]"
    :style="{
      gridTemplateColumns: `var(--date-col) repeat(${laneCount}, var(--lane)) minmax(0, 1fr)`,
    }"
  >
    <!--
      The trunk. One unbroken line from the first dot to the last, so the eye
      has something to follow and everything else hangs off it.

      A grid item spanning rows a..b covers the gaps between those rows but not
      the one after the last, so every run here adds a row gap back to reach
      the dot it is aiming at.
    -->
    <span
      aria-hidden="true"
      class="w-px justify-self-center bg-rule-strong"
      :style="{
        gridRow: `1 / ${rows.length}`,
        gridColumn: 2,
        marginTop: 'var(--dot)',
        height: 'calc(100% + var(--row-gap))',
      }"
    />

    <li v-for="entry in rows" :key="`${entry.event.title}-${entry.row}`" class="contents">
      <time
        class="label tabular pr-5 pt-[0.15rem] text-right text-ink-3"
        :style="{ gridRow: entry.row + 1, gridColumn: 1 }"
      >
        {{ entry.label }}
      </time>

      <template v-if="entry.lane > 0">
        <!-- The fork leaves the trunk at the dot of the entry it overlaps. -->
        <svg
          aria-hidden="true"
          :viewBox="`0 0 ${connector(entry.lane).width} ${connector(entry.lane).height}`"
          :width="connector(entry.lane).width"
          :height="connector(entry.lane).height"
          fill="none"
          :style="{
            gridRow: entry.reach + 1,
            gridColumn: `2 / ${entry.lane + 3}`,
            marginTop: 'var(--dot)',
            marginLeft: 'calc(var(--lane) / 2)',
            color: entry.color,
            opacity: entry.event.ongoing ? 0.75 : 0.5,
          }"
        >
          <path
            :d="connector(entry.lane).d"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
          />
        </svg>

        <!-- Then straight down its own lane to its own dot. -->
        <span
          aria-hidden="true"
          class="w-[1.5px] justify-self-center rounded-full"
          :style="{
            gridRow: `${entry.reach + 1} / ${entry.row + 1}`,
            gridColumn: entry.lane + 2,
            marginTop: `calc(var(--dot) + ${CURVE}px)`,
            height: `calc(100% + var(--row-gap) - ${CURVE}px)`,
            background: entry.color,
            opacity: entry.event.ongoing ? 0.75 : 0.5,
          }"
        />
      </template>

      <span
        aria-hidden="true"
        class="size-[9px] justify-self-center self-start rounded-full ring-2 ring-paper"
        :style="{
          gridRow: entry.row + 1,
          gridColumn: entry.lane + 2,
          marginTop: 'calc(var(--dot) - 4.5px)',
          background: entry.color,
        }"
      />

      <Motion
        as="div"
        :initial="{ opacity: 0, x: -10, filter: 'blur(3px)' }"
        :while-in-view="{ opacity: 1, x: 0, filter: 'blur(0px)' }"
        :in-view-options="inView"
        :transition="{ duration: duration.base, ease, delay: step(entry.row % 4) }"
        class="group min-w-0 pl-5"
        :style="{ gridRow: entry.row + 1, gridColumn: laneCount + 2 }"
      >
        <div class="flex items-center gap-2.5">
          <img
            v-if="entry.event.icon && assetUrl(entry.event.icon)"
            :src="assetUrl(entry.event.icon)"
            :alt="`${entry.event.title} logo`"
            class="size-5 shrink-0 rounded-sm"
            loading="lazy"
          />
          <h3 class="title text-xl">
            <a
              v-if="entry.event.url"
              :href="entry.event.url"
              target="_blank"
              rel="noopener noreferrer"
              class="group/link inline-flex items-baseline gap-1.5 transition-colors hover:text-accent"
            >
              {{ entry.event.title }}
              <ArrowUpRight
                class="size-3.5 shrink-0 self-center text-ink-3 opacity-0 transition-all duration-300 ease-out-quint group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5 group-hover/link:text-accent group-hover/link:opacity-100"
              />
            </a>
            <template v-else>{{ entry.event.title }}</template>
          </h3>
        </div>

        <p class="mt-1.5 max-w-xl text-sm leading-relaxed text-ink-3">
          {{ entry.event.description }}
        </p>

        <RouterLink
          v-if="entry.event.project"
          :to="{ name: 'project', params: { name: entry.event.project } }"
          class="nudge mt-2.5 inline-flex items-center gap-1 text-sm text-accent"
        >
          See the project
          <ArrowUpRight class="size-3.5" />
        </RouterLink>
      </Motion>
    </li>
  </ol>
</template>

<style scoped>
ol {
  --date-col: 4.75rem;
  /* Declared together: every connector length is measured against this gap,
     and a Tailwind class setting one of them silently dropped the other. */
  --row-gap: 2.25rem;
  row-gap: var(--row-gap);
}

@media (width >= 40rem) {
  ol {
    --date-col: 7.5rem;
  }
}
</style>
