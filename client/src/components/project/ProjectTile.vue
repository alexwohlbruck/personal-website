<script setup lang="ts">
import { computed } from 'vue'
import { assetUrl } from '@/lib/assets'
import type { Project } from '@/data/types'

const props = withDefaults(defineProps<{ project: Project; size?: number }>(), { size: 56 })

const icon = computed(() => assetUrl(props.project.icon))
</script>

<template>
  <!--
    Tiles carry a brand colour, not paper, so they get their own lighting. The
    shared `--sheen` is a 75% white inset tuned for cream surfaces; on a tile
    like Parchment's near-black it read as a hard clipped edge.
  -->
  <span
    class="relative grid shrink-0 place-items-center overflow-hidden rounded-tile"
    :style="{
      width: `${size}px`,
      height: `${size}px`,
      backgroundColor: project.color,
      boxShadow: 'inset 0 1px 0 oklch(100% 0 0 / 0.16), var(--tile-ring), var(--shadow-1)',
    }"
  >
    <img :src="icon" :alt="`${project.title} logo`" class="w-1/2" loading="lazy" />
    <span
      class="pointer-events-none absolute inset-0 rounded-tile"
      style="
        background: linear-gradient(
          to bottom,
          oklch(100% 0 0 / 0.06),
          transparent 40%,
          oklch(0% 0 0 / 0.05)
        );
      "
    />
  </span>
</template>
