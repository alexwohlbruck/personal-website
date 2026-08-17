<script setup lang="ts">
import { computed } from 'vue'
import { Info, Lightbulb, TriangleAlert } from '@lucide/vue'

/** An aside in the margin of the page: a note, a caveat, a thing learned. */
const props = withDefaults(
  defineProps<{
    kind?: 'note' | 'warning' | 'insight'
    title?: string
  }>(),
  { kind: 'note' },
)

const icons = { note: Info, warning: TriangleAlert, insight: Lightbulb }

const icon = computed(() => icons[props.kind])

// A warning is the only one that earns the accent; the others stay in ink so a
// page of asides does not read as a page of alarms.
const tone = computed(() =>
  props.kind === 'warning' ? 'text-accent' : 'text-ink-3',
)
</script>

<template>
  <aside class="card flex gap-3.5 p-4 md:p-5">
    <component :is="icon" class="mt-0.5 size-4 shrink-0" :class="tone" aria-hidden="true" />
    <div class="min-w-0 flex-1 text-[0.9375rem] leading-relaxed">
      <p v-if="title" class="mb-1 font-semibold text-ink">{{ title }}</p>
      <slot />
    </div>
  </aside>
</template>
