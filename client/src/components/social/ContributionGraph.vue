<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, useTemplateRef, watch } from 'vue'
import { useElementVisibility } from '@vueuse/core'
import type { CalendarDay, ContributionCalendar } from '@/data/types'

/**
 * A year of work, one square a day.
 *
 * Drawn the way GitHub draws it, but in the site's own ink: a green heat ramp
 * on parchment reads as a foreign widget pasted into the page. Which ink is the
 * caller's choice — the commits run in the accent rust, the map edits in the
 * marine that every other plotted thing on this site uses.
 *
 * Every date is parsed and formatted in UTC. The server sends plain calendar
 * days, and reading them as local time moves every square in the western
 * hemisphere up a row.
 */
const props = withDefaults(
  defineProps<{
    calendar: ContributionCalendar
    /** Singular. Pluralised with an "s" for the caption and the summary. */
    noun?: string
    /** Which of the two site colours the ramp is mixed from. */
    tint?: 'accent' | 'marine'
  }>(),
  { noun: 'contribution', tint: 'accent' },
)

const weeks = computed(() => props.calendar.weeks)

const WEEKDAYS = ['', 'Mon', '', 'Wed', '', 'Fri', '']

const number = new Intl.NumberFormat('en-US')

function parse(date: string) {
  return new Date(`${date}T00:00:00Z`)
}

function monthOf(date: string) {
  return parse(date).toLocaleString('en-US', { month: 'short', timeZone: 'UTC' })
}

function dayOf(date: string) {
  return parse(date).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

/** The ends of the window are a year apart, so they carry their year: without
 * it "Aug 10 – Aug 13" reads as four days rather than twelve months. */
function endOf(date: string) {
  return parse(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

const first = computed(() => weeks.value[0]?.find(Boolean) ?? null)
const last = computed(() => weeks.value.at(-1)?.findLast(Boolean) ?? null)

function plural(count: number) {
  return `${number.format(count)} ${props.noun}${count === 1 ? '' : 's'}`
}

/** Read out in place of the grid, which is 371 squares of nothing to a screen
 *  reader that is handed them one at a time. */
const summary = computed(() =>
  first.value && last.value
    ? `${plural(props.calendar.total)} between ${endOf(first.value.date)} and ${endOf(last.value.date)}.`
    : '',
)

/**
 * One label per column, or null. A month is announced by the first column its
 * days appear in, and the last two columns are left unlabelled: a label there
 * has no width to sit over and would collide with the one before it.
 */
const months = computed(() =>
  weeks.value.map((week, index) => {
    const day = week.find(Boolean)
    if (!day || index > weeks.value.length - 3) return null

    const previous = index ? weeks.value[index - 1].find(Boolean) : null
    if (previous && monthOf(previous.date) === monthOf(day.date)) return null
    return monthOf(day.date)
  }),
)

const hovered = ref<CalendarDay | null>(null)

const caption = computed(() => {
  const day = hovered.value
  if (day) return `${day.count ? plural(day.count) : 'Nothing'} on ${dayOf(day.date)}`
  if (!first.value || !last.value) return ''
  return `${endOf(first.value.date)} – ${endOf(last.value.date)}`
})

/**
 * The squares fill in as a wave from the left once the graph is on screen.
 * Three hundred and sixty five animated components would be an absurd way to
 * buy that, so the whole thing is one class and a per-column CSS delay.
 */
const root = useTemplateRef<HTMLElement>('root')
const onScreen = useElementVisibility(root)
const shown = ref(false)
const stop = watch(onScreen, (visible) => visible && (shown.value = true))

const scroller = useTemplateRef<HTMLElement>('scroller')

// Nothing should be able to leave the graph invisible: a browser without an
// IntersectionObserver, or one that never reports the element, draws it anyway.
let timer: ReturnType<typeof setTimeout>
onMounted(() => {
  timer = setTimeout(() => (shown.value = true), 1_500)
  // Too narrow to hold the year. The recent weeks are the ones worth seeing
  // without being asked for, so it opens at that end and scrolls back.
  if (scroller.value) scroller.value.scrollLeft = scroller.value.scrollWidth
})
onUnmounted(() => {
  clearTimeout(timer)
  stop()
})
</script>

<template>
  <div ref="root" :style="{ '--heat': `var(--${tint})` }">
    <div ref="scroller" class="scroller">
      <div class="frame" :style="{ '--weeks': weeks.length }">
        <div class="months" aria-hidden="true">
          <template v-for="(month, index) in months" :key="index">
            <span v-if="month" :style="{ gridColumn: index + 1 }">{{ month }}</span>
          </template>
        </div>

        <div class="weekdays" aria-hidden="true">
          <span v-for="(day, index) in WEEKDAYS" :key="index">{{ day }}</span>
        </div>

        <div
          class="cells"
          :class="shown && 'is-shown'"
          role="img"
          :aria-label="summary"
          @pointerleave="hovered = null"
        >
          <template v-for="(week, column) in weeks" :key="column">
            <span
              v-for="(day, row) in week"
              :key="`${column}-${row}`"
              class="cell"
              :class="[!day && 'is-empty', hovered && day && hovered.date === day.date && 'is-hovered']"
              :data-level="day?.level ?? 0"
              :style="{ '--column': column }"
              @pointerenter="hovered = day"
              @pointerdown="hovered = day"
            />
          </template>
        </div>
      </div>
    </div>

    <div class="mt-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
      <p class="text-xs text-ink-3 tabular">{{ caption }}</p>

      <div class="flex items-center gap-1.5 text-xs text-ink-3" aria-hidden="true">
        <span>Less</span>
        <span v-for="level in [0, 1, 2, 3, 4]" :key="level" class="cell key" :data-level="level" />
        <span>More</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Below this the year stops being legible, so it scrolls instead of shrinking.
   The panel starts scrolled to the right, where the recent weeks are. */
.scroller {
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scrollbar-width: none;
  padding-bottom: 2px;
}

.scroller::-webkit-scrollbar {
  display: none;
}

.frame {
  --gap: 0.1875rem;

  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  grid-template-rows: auto minmax(0, 1fr);
  column-gap: 0.5rem;
  row-gap: 0.375rem;
  min-width: 42rem;
}

.months {
  grid-area: 1 / 2;
  display: grid;
  grid-template-columns: repeat(var(--weeks), minmax(0, 1fr));
  font-family: var(--font-mono);
  font-size: 0.625rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-3);
}

.months span {
  /* Wider than its column, and free to overhang the next one. */
  white-space: nowrap;
}

.weekdays {
  grid-area: 2 / 1;
  display: grid;
  grid-template-rows: repeat(7, 1fr);
  gap: var(--gap);
  align-items: center;
  font-family: var(--font-mono);
  font-size: 0.625rem;
  line-height: 1;
  color: var(--ink-3);
  text-align: right;
}

.cells {
  grid-area: 2 / 2;
  display: grid;
  grid-auto-flow: column;
  grid-template-columns: repeat(var(--weeks), minmax(0, 1fr));
  grid-template-rows: repeat(7, auto);
  gap: var(--gap);
}

/**
 * The ramp is `--heat` mixed into the paper at four strengths, so a section
 * picks its colour and both themes get a scale that belongs to them without
 * any of it being listed twice. An empty day is the sunk paper it sits on.
 */
.cell {
  aspect-ratio: 1;
  border-radius: 2px;
  background-color: var(--paper-sunk);
  box-shadow: inset 0 0 0 1px var(--rule);
  transition: transform 0.15s var(--ease-out-quint);
}

.cell[data-level='1'] {
  background-color: color-mix(in oklab, var(--heat) 30%, var(--paper-sunk));
}

.cell[data-level='2'] {
  background-color: color-mix(in oklab, var(--heat) 55%, var(--paper-sunk));
}

.cell[data-level='3'] {
  background-color: color-mix(in oklab, var(--heat) 78%, var(--paper-sunk));
}

.cell[data-level='4'] {
  background-color: var(--heat);
}

.cell[data-level='0'] {
  box-shadow: inset 0 0 0 1px var(--rule);
}

/* Padding at the ends of the window: days that have not happened, or predate
   the year being shown. Neither is a day with nothing on it. */
.cell.is-empty {
  background-color: transparent;
  box-shadow: none;
  pointer-events: none;
}

.cell.is-hovered {
  transform: scale(1.35);
  box-shadow: 0 0 0 1px var(--ink-3);
}

.key {
  width: 0.625rem;
  aspect-ratio: 1;
  border-radius: 2px;
}

.cells .cell {
  opacity: 0;
}

.cells.is-shown .cell {
  animation: square-in 0.4s var(--ease-out-quint) backwards;
  animation-delay: calc(var(--column) * 9ms);
  opacity: 1;
}

@keyframes square-in {
  from {
    opacity: 0;
    transform: scale(0.4);
  }
}

@media (prefers-reduced-motion: reduce) {
  .cells .cell {
    opacity: 1;
  }
}
</style>
