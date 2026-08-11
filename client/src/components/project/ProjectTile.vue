<script setup lang="ts">
import { computed } from 'vue'
import { assetUrl } from '@/lib/assets'
import type { Project } from '@/data/types'

const props = withDefaults(defineProps<{ project: Project; size?: number }>(), { size: 56 })

const icon = computed(() => assetUrl(props.project.icon))
</script>

<template>
  <span
    class="relative grid shrink-0 place-items-center overflow-hidden rounded-tile"
    :style="{
      width: `${size}px`,
      height: `${size}px`,
      backgroundColor: project.color,
      boxShadow: 'var(--sheen), var(--tile-ring), var(--shadow-1)',
    }"
  >
    <img :src="icon" :alt="`${project.title} logo`" class="w-1/2" loading="lazy" />
    <!-- A sliver of light along the top edge keeps pale tiles off the page. -->
    <span
      class="pointer-events-none absolute inset-0 rounded-tile"
      style="
        background: linear-gradient(
          to bottom,
          oklch(100% 0 0 / 0.14),
          transparent 45%,
          oklch(0% 0 0 / 0.08)
        );
      "
    />
  </span>
</template>
