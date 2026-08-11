<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useIntervalFn, useMediaQuery } from '@vueuse/core'
import { useLiveStore } from '@/stores/live'
import { timezoneLabel } from '@/lib/format'

/**
 * A week at a glance: which hours are already spoken for. Titles are
 * deliberately not shown. This is a public page, so a busy block says "busy".
 */
const DAY_START = 7
const DAY_END = 22
const SPAN_MINUTES = (DAY_END - DAY_START) * 60

const live = useLiveStore()
const compact = useMediaQuery('(max-width: 640px)')
const now = ref(new Date())

useIntervalFn(() => (now.value = new Date()), 60_000)
onMounted(() => void live.fetchCalendar())

const days = computed(() => {
  const count = compact.value ? 3 : 7
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Array.from({ length: count }, (_, i) => {
    const day = new Date(today)
    day.setDate(today.getDate() + i)
    return day
  })
})

const hours = computed(() =>
  Array.from({ length: DAY_END - DAY_START + 1 }, (_, i) => {
    const hour = DAY_START + i
    const label = hour % 12 === 0 ? 12 : hour % 12
    return { hour, label: `${label}${hour < 12 ? 'am' : 'pm'}` }
  }),
)

function minutesFromStart(date: Date) {
  return (date.getHours() - DAY_START) * 60 + date.getMinutes()
}

/** Busy blocks for one day, clipped to the visible window. */
function blocksFor(day: Date) {
  return live.calendar
    .map((event) => {
      const start = new Date(event.start)
      const end = new Date(event.end)
      if (start.toDateString() !== day.toDateString()) return null

      const from = Math.max(0, minutesFromStart(start))
      const to = Math.min(SPAN_MINUTES, minutesFromStart(end))
      if (to <= 0 || from >= SPAN_MINUTES || to <= from) return null

      return {
        key: `${event.start}-${event.end}`,
        top: (from / SPAN_MINUTES) * 100,
        height: ((to - from) / SPAN_MINUTES) * 100,
      }
    })
    .filter((block): block is NonNullable<typeof block> => block !== null)
}

const nowOffset = computed(() => {
  const minutes = minutesFromStart(now.value)
  if (minutes < 0 || minutes > SPAN_MINUTES) return null
  return (minutes / SPAN_MINUTES) * 100
})

const weekday = (date: Date) => date.toLocaleDateString('en-US', { weekday: 'short' })
const isToday = (date: Date) => date.toDateString() === new Date().toDateString()
const isWeekend = (date: Date) => [0, 6].includes(date.getDay())
</script>

<template>
  <div>
    <div class="card overflow-hidden">
      <!-- Day headers -->
      <div
        class="grid border-b border-rule"
        :style="{ gridTemplateColumns: `2.75rem repeat(${days.length}, 1fr)` }"
      >
        <span />
        <div
          v-for="day in days"
          :key="day.toISOString()"
          class="border-l border-rule px-2 py-2.5 text-center"
          :class="isWeekend(day) && 'bg-paper-sunk/60'"
        >
          <p class="text-xs text-ink-3">{{ weekday(day) }}</p>
          <p
            class="tabular mt-1 text-sm"
            :class="isToday(day) ? 'font-medium text-accent' : 'text-ink-2'"
          >
            {{ day.getDate() }}
          </p>
        </div>
      </div>

      <!-- Grid -->
      <div
        class="relative grid"
        :style="{ gridTemplateColumns: `2.75rem repeat(${days.length}, 1fr)` }"
      >
        <!-- Hour gutter -->
        <div>
          <div
            v-for="hour in hours.slice(0, -1)"
            :key="hour.hour"
            class="relative h-9 pr-2 text-right"
          >
            <span class="tabular absolute -top-1.5 right-2 text-[0.5625rem] text-ink-3">
              {{ hour.label }}
            </span>
          </div>
        </div>

        <!-- Day columns -->
        <div
          v-for="day in days"
          :key="day.toISOString()"
          class="relative border-l border-rule"
          :class="isWeekend(day) && 'bg-paper-sunk/60'"
        >
          <div
            v-for="hour in hours.slice(0, -1)"
            :key="hour.hour"
            class="h-9 border-b border-rule/60 last:border-b-0"
          />

          <div
            v-for="block in blocksFor(day)"
            :key="block.key"
            class="absolute inset-x-[3px] rounded-[5px] bg-marine-wash"
            :style="{
              top: `${block.top}%`,
              height: `${block.height}%`,
              boxShadow: 'inset 0 0 0 1px var(--marine)',
            }"
          >
            <span class="block truncate px-1.5 py-1 text-[0.625rem] text-marine">Busy</span>
          </div>

          <!-- Now marker -->
          <div
            v-if="isToday(day) && nowOffset !== null"
            class="pointer-events-none absolute inset-x-0 z-10 h-px bg-accent"
            :style="{ top: `${nowOffset}%` }"
          >
            <span class="absolute -left-[3px] -top-[3px] size-[7px] rounded-full bg-accent" />
          </div>
        </div>
      </div>
    </div>

    <p class="mt-3 text-xs text-ink-3">
      <template v-if="live.calendarStatus === 'error'">
        My calendar is offline right now. Send a message and I'll find a slot.
      </template>
      <template v-else>
        Shown in your time zone, {{ timezoneLabel() }}. A block means I'm booked then.
      </template>
    </p>
  </div>
</template>
