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

const pickNextIndex = () => {
  if (props.words.length < 2) return 0

  // Earlier words stay a little more likely without making the order feel fixed.
  const candidates = props.words
    .map((_, candidateIndex) => ({
      index: candidateIndex,
      weight: candidateIndex === index.value ? 0 : 0.9 ** candidateIndex,
    }))
    .filter(({ weight }) => weight > 0)
  let roll = Math.random() * candidates.reduce((total, candidate) => total + candidate.weight, 0)

  for (const candidate of candidates) {
    roll -= candidate.weight
    if (roll <= 0) return candidate.index
  }

  return candidates.at(-1)?.index ?? 0
}

useIntervalFn(
  () => {
    if (reduced.value === 'reduce') return
    index.value = pickNextIndex()
  },
  () => props.interval,
)

const word = computed(() => props.words[index.value] ?? '')
const articleFor = (value: string) => (/^[aeiou]/i.test(value) ? 'an' : 'a')
</script>

<template>
  <!--
    Replaces the old typewriter. One phrase swaps in with a blur, and it holds
    still entirely for reduced-motion visitors.

    Every phrase is also rendered invisibly into the same grid cell, so the
    longest one sets the width once and nothing reflows on the swap. The
    article rides along inside the cell, because "a" and "an" are different
    widths and moving the word by that much on every other swap was the most
    visible jump of all. Wrapping stays on: "an OpenStreetMap contributor" is
    wider than a phone, and the tallest phrase sets the height for all of them.
  -->
  <span class="inline-flex flex-wrap items-baseline gap-[0.3em]">
    <span class="text-ink-3">Also</span>

    <span class="inline-grid">
      <span
        v-for="option in words"
        :key="option"
        class="invisible col-start-1 row-start-1"
        aria-hidden="true"
      >
        {{ articleFor(option) }} {{ option }}
      </span>

      <AnimatePresence mode="wait">
        <Motion
          :key="word"
          as="span"
          class="col-start-1 row-start-1"
          :initial="{ opacity: 0, y: '0.3em', filter: 'blur(3px)' }"
          :animate="{ opacity: 1, y: '0em', filter: 'blur(0px)' }"
          :exit="{ opacity: 0, y: '-0.3em', filter: 'blur(3px)' }"
          :transition="{ duration: 0.32, ease }"
        >
          <!-- Explicit space: Vue's whitespace condensing drops the gap
               between two elements when a newline sits between them. -->
          <span class="text-ink-3">{{ articleFor(word) }}</span>{{ ' ' }}<span
            class="text-ink"
            >{{ word }}</span
          >
        </Motion>
      </AnimatePresence>
    </span>
  </span>
</template>
