<script setup lang="ts">
import { Motion } from 'motion-v'
import { duration, ease } from '@/lib/motion'

const props = withDefaults(defineProps<{ value: number; max?: number }>(), { max: 10 })
const segments = Array.from({ length: props.max }, (_, i) => i)
</script>

<template>
  <div
    class="flex items-center gap-[3px]"
    role="meter"
    :aria-valuenow="value"
    :aria-valuemin="0"
    :aria-valuemax="max"
    :aria-label="`Proficiency ${value} of ${max}`"
  >
    <Motion
      v-for="i in segments"
      :key="i"
      as="span"
      class="h-3 w-[5px] rounded-[2px]"
      :class="i < value ? 'bg-accent' : 'bg-rule'"
      :initial="{ scaleY: 0.35, opacity: 0 }"
      :animate="{ scaleY: 1, opacity: 1 }"
      :transition="{ duration: duration.quick, ease, delay: i * 0.02 }"
    />
  </div>
</template>
