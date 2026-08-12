<script setup lang="ts">
import { Motion } from 'motion-v'
import { inView, rise } from '@/lib/motion'

defineProps<{
  title: string
  /** Sits in the right column on wide screens, under the title otherwise. */
  note?: string
}>()
</script>

<template>
  <Motion
    as="header"
    :initial="rise.initial"
    :while-in-view="rise.animate"
    :in-view-options="inView"
    :transition="rise.transition"
    class="mb-10 grid gap-x-12 gap-y-3 border-b border-rule pb-7 md:grid-cols-[1fr_auto] md:items-end"
  >
    <h2 class="title text-4xl md:text-5xl">{{ title }}</h2>
    <p v-if="note" class="max-w-xs text-sm leading-relaxed text-ink-3 md:text-right">
      {{ note }}
    </p>
  </Motion>
</template>
