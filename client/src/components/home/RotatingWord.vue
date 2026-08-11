<script setup lang="ts">
import { computed, ref } from 'vue'
import { AnimatePresence, Motion } from 'motion-v'
import { useIntervalFn, usePreferredReducedMotion } from '@vueuse/core'
import { ease } from '@/lib/motion'

const props = withDefaults(defineProps<{ words: readonly string[]; interval?: number }>(), {
  interval: 2600,
})

const index = ref(0)
const reduced = usePreferredReducedMotion()

useIntervalFn(
  () => {
    if (reduced.value === 'reduce') return
    index.value = (index.value + 1) % props.words.length
  },
  () => props.interval,
)

const word = computed(() => props.words[index.value] ?? '')
const article = computed(() => (/^[aeiou]/i.test(word.value) ? 'an' : 'a'))
</script>

<template>
  <!--
    Replaces the old typewriter. One word swaps in with a blur, the line never
    reflows, and it holds still entirely for reduced-motion visitors.
  -->
  <span class="inline-flex items-baseline gap-[0.3em] whitespace-nowrap">
    <span class="text-ink-3">Also {{ article }}</span>
    <AnimatePresence mode="wait">
      <Motion
        :key="word"
        as="span"
        class="inline-block text-ink"
        :initial="{ opacity: 0, y: '0.3em', filter: 'blur(3px)' }"
        :animate="{ opacity: 1, y: '0em', filter: 'blur(0px)' }"
        :exit="{ opacity: 0, y: '-0.3em', filter: 'blur(3px)' }"
        :transition="{ duration: 0.32, ease }"
      >
        {{ word }}
      </Motion>
    </AnimatePresence>
  </span>
</template>
