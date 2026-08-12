<script setup lang="ts">
import { computed } from 'vue'
import { inlineIcon } from '@/lib/assets'

const props = withDefaults(defineProps<{ name: string; size?: number }>(), { size: 20 })

// Local, build-time assets only. Never remote or user-supplied markup.
const svg = computed(() => inlineIcon(props.name))
</script>

<template>
  <span
    class="inline-flex shrink-0 items-center justify-center [&>svg]:h-full [&>svg]:w-full"
    :style="{ width: `${size}px`, height: `${size}px` }"
    v-html="svg"
  />
</template>
