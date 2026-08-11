<script setup lang="ts">
import { computed } from 'vue'
import { AnimatePresence, Motion } from 'motion-v'
import { Monitor, Moon, Sun } from '@lucide/vue'
import { useTheme } from '@/composables/useTheme'
import { ease } from '@/lib/motion'

const { setting, cycle } = useTheme()

const icon = computed(() => ({ system: Monitor, light: Sun, dark: Moon })[setting.value])
const label = computed(
  () =>
    ({
      system: 'Theme: follows your system',
      light: 'Theme: light',
      dark: 'Theme: dark',
    })[setting.value],
)
</script>

<template>
  <button type="button" class="btn btn-icon" :title="label" :aria-label="label" @click="cycle">
    <!-- Rotate-and-fade on swap so the change reads as one motion. -->
    <AnimatePresence mode="wait">
      <Motion
        :key="setting"
        as="span"
        class="grid place-items-center"
        :initial="{ opacity: 0, rotate: -45, scale: 0.7 }"
        :animate="{ opacity: 1, rotate: 0, scale: 1 }"
        :exit="{ opacity: 0, rotate: 45, scale: 0.7 }"
        :transition="{ duration: 0.2, ease }"
      >
        <component :is="icon" class="size-4" />
      </Motion>
    </AnimatePresence>
  </button>
</template>
