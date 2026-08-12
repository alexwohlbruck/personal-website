<script setup lang="ts">
import { Motion } from 'motion-v'
import { duration, ease } from '@/lib/motion'

defineProps<{
  title: string
  lede?: string
}>()

const enter = (delay: number) => ({
  initial: { opacity: 0, y: 12, filter: 'blur(3px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  transition: { duration: duration.base, ease, delay },
})
</script>

<template>
  <header class="pb-10 pt-28 md:pb-14 md:pt-36">
    <Motion as="h1" v-bind="enter(0)" class="title text-5xl md:text-7xl">
      {{ title }}
    </Motion>
    <Motion v-if="lede" as="p" v-bind="enter(0.06)" class="prose-body mt-6 max-w-2xl text-balance">
      {{ lede }}
    </Motion>
    <slot />
  </header>
</template>
