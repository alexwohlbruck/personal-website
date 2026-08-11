<script setup lang="ts">
import { Motion } from 'motion-v'
import { ArrowUpRight } from '@lucide/vue'
import { assetUrl } from '@/lib/assets'
import { timeline } from '@/data/timeline'
import { site } from '@/data/site'
import { monthShort } from '@/lib/format'
import { duration, ease, inView, step } from '@/lib/motion'
import type { TimelineEvent } from '@/data/types'

/**
 * In the source data `start` is the later boundary and `end` the earlier one,
 * so a span reads end → start. Entries without an end are single moments,
 * except the current role, which runs to now. Spans inside one year fall back
 * to months, so nothing reads "2019–2019".
 */
function period(event: TimelineEvent): string {
  const isCurrent = event.title === site.currently.company
  if (isCurrent) return `${event.start.getFullYear()}–Now`
  if (!event.end) return String(event.start.getFullYear())
  if (event.end.getFullYear() === event.start.getFullYear()) {
    return `${monthShort(event.end)}–${monthShort(event.start)} ${event.start.getFullYear()}`
  }
  return `${event.end.getFullYear()}–${event.start.getFullYear()}`
}
</script>

<template>
  <ol class="relative">
    <!-- The margin rule the whole column hangs off. -->
    <span
      class="absolute bottom-6 left-[4.75rem] top-3 w-px bg-rule sm:left-[7.5rem]"
      aria-hidden="true"
    />

    <Motion
      v-for="(event, index) in timeline"
      :key="`${event.title}-${index}`"
      as="li"
      :initial="{ opacity: 0, x: -10, filter: 'blur(3px)' }"
      :while-in-view="{ opacity: 1, x: 0, filter: 'blur(0px)' }"
      :in-view-options="inView"
      :transition="{ duration: duration.base, ease, delay: step(index % 4) }"
      class="group relative grid grid-cols-[4.75rem_1fr] gap-x-6 pb-9 sm:grid-cols-[7.5rem_1fr]"
    >
      <time class="label tabular pt-1 pr-3 text-right text-ink-3">{{ period(event) }}</time>

      <div class="relative">
        <span
          class="absolute -left-[1.6875rem] top-[0.4rem] size-[9px] rounded-full border-2 border-paper bg-ink-3 transition-colors duration-300 group-hover:bg-accent sm:-left-[1.6875rem]"
          aria-hidden="true"
        />

        <div class="flex items-center gap-2.5">
          <img
            v-if="event.icon"
            :src="assetUrl(event.icon)"
            :alt="`${event.title} logo`"
            class="size-5 shrink-0 rounded-sm"
            loading="lazy"
          />
          <h3 class="title text-xl">{{ event.title }}</h3>
        </div>

        <p class="mt-1.5 max-w-xl text-sm leading-relaxed text-ink-3">{{ event.description }}</p>

        <RouterLink
          v-if="event.project"
          :to="{ name: 'project', params: { name: event.project } }"
          class="nudge mt-2.5 inline-flex items-center gap-1 text-sm text-accent"
        >
          See the project
          <ArrowUpRight class="size-3.5" />
        </RouterLink>
      </div>
    </Motion>
  </ol>
</template>
