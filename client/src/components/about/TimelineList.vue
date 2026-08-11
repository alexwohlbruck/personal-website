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
 * The span an entry covers, shown on the entry itself. A single moment shows
 * one year. A span inside one year falls back to months, so nothing reads
 * "2019–2019".
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

  // The gutter is a scale, not a caption: one descending run of years, each
  // printed once. Entries that start in a year already marked sit under it
  // silently and carry their own span instead.
  let marked: number | null = null

  return events.map((event, i) => {
    const start = event.from.getFullYear()
    const year = start === marked ? null : start
    if (year !== null) marked = year

    // A single moment is already fully described by the year in the gutter.
    const span = period(event)

    return {
      event,
      row: i,
      reach: reach[i]!,
      lane: lanes[i]!,
      year,
      period: span === String(start) ? null : span,
      color:
        event.ongoing
          ? 'var(--accent)'
          : event.kind === 'education'
            ? 'var(--marine)'
            : 'var(--ink-3)',
    }
  })
})

const laneCount = computed(() => Math.max(...rows.value.map((r) => r.lane)) + 1)

/** Pixels, so the connector SVG can be drawn at exactly its rendered size. */
const LANE = 14
const CURVE = 26

/**
 * The S a fork makes leaving the trunk, and the mirrored one bringing it back.
 * Both control points sit directly below the start and above the end, which
 * lands the curve tangent to vertical at both ends: it eases out of the trunk
 * and eases into the branch instead of turning a corner. A quarter-circle
 * radius cannot do that, it meets the straight runs at a fixed rate.
 */
function connector(lane: number) {
  const w = lane * LANE
  return {
    width: w,
    height: CURVE,
    out: `M0 0C0 ${CURVE / 2} ${w} ${CURVE / 2} ${w} ${CURVE}`,
    back: `M${w} 0C${w} ${CURVE / 2} 0 ${CURVE / 2} 0 ${CURVE}`,
  }
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
        v-if="entry.year !== null"
        :datetime="String(entry.year)"
        class="label pr-5 pt-[0.15rem] text-right text-ink-3"
        :style="{ gridRow: entry.row + 1, gridColumn: 1 }"
      >
        {{ entry.year }}
      </time>

      <!--
        A fork, drawn the way a branch graph draws one. It leaves the trunk at
        the dot of the entry it overlaps, runs down its own lane, and curves
        back into the trunk below its dot, so the branch closes instead of
        trailing off. Every stroke matches the trunk exactly: same hairline,
        same colour, no transparency of its own. Only the dots carry colour.
      -->
      <template v-if="entry.lane > 0">
        <svg
          aria-hidden="true"
          class="overflow-visible text-rule-strong"
          :viewBox="`0 0 ${connector(entry.lane).width} ${CURVE}`"
          :width="connector(entry.lane).width"
          :height="CURVE"
          fill="none"
          :style="{
            gridRow: entry.reach + 1,
            gridColumn: `2 / ${entry.lane + 3}`,
            marginTop: 'var(--dot)',
            marginLeft: 'calc(var(--lane) / 2)',
          }"
        >
          <path :d="connector(entry.lane).out" stroke="currentColor" stroke-width="1" />
        </svg>

        <span
          aria-hidden="true"
          class="w-px justify-self-center bg-rule-strong"
          :style="{
            gridRow: `${entry.reach + 1} / ${entry.row + 1}`,
            gridColumn: entry.lane + 2,
            marginTop: `calc(var(--dot) + ${CURVE}px)`,
            height: `calc(100% + var(--row-gap) - ${CURVE}px)`,
          }"
        />

        <svg
          aria-hidden="true"
          class="overflow-visible text-rule-strong"
          :viewBox="`0 0 ${connector(entry.lane).width} ${CURVE}`"
          :width="connector(entry.lane).width"
          :height="CURVE"
          fill="none"
          :style="{
            gridRow: entry.row + 1,
            gridColumn: `2 / ${entry.lane + 3}`,
            marginTop: 'var(--dot)',
            marginLeft: 'calc(var(--lane) / 2)',
          }"
        >
          <path :d="connector(entry.lane).back" stroke="currentColor" stroke-width="1" />
        </svg>
      </template>

      <!-- z-10 so a later entry's curve cannot paint over an earlier dot. -->
      <span
        aria-hidden="true"
        class="z-10 size-[9px] justify-self-center self-start rounded-full ring-2 ring-paper"
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

        <p v-if="entry.period" class="label mt-2 text-ink-3">{{ entry.period }}</p>

        <p class="mt-2 max-w-xl text-sm leading-relaxed text-ink-3">
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
  /* Four digits and the gap to the trunk. Nothing wider ever lands here. */
  --date-col: 4rem;
  /* Declared together: every connector length is measured against this gap,
     and a Tailwind class setting one of them silently dropped the other. */
  --row-gap: 2.25rem;
  row-gap: var(--row-gap);
}

@media (width >= 40rem) {
  ol {
    --date-col: 5rem;
  }
}
</style>
