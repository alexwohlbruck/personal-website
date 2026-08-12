<script setup lang="ts">
import { computed } from 'vue'
import { assetUrl } from '@/lib/assets'
import type { Project } from '@/data/types'

const props = withDefaults(defineProps<{ project: Project; size?: number }>(), { size: 56 })

const icon = computed(() => (props.project.icon ? assetUrl(props.project.icon) : ''))
const monogram = computed(() => props.project.title.charAt(0))

/**
 * Projects without a logo get their initial instead, which needs to sit on
 * whatever brand colour the tile carries. Relative luminance off the hex,
 * using the sRGB coefficients, so a pale tile gets dark type and vice versa.
 */
const monogramColor = computed(() => {
  const hex = props.project.color.replace('#', '')
  const full = hex.length === 3 ? [...hex].map((c) => c + c).join('') : hex
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255)
  const luminance = 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0)
  return luminance > 0.55 ? 'oklch(26% 0.036 38)' : 'oklch(97% 0.01 85)'
})
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
    <img v-if="icon" :src="icon" :alt="`${project.title} logo`" class="w-1/2" loading="lazy" />
    <span
      v-else
      class="font-serif leading-none"
      :style="{ color: monogramColor, fontSize: `${size * 0.44}px` }"
      aria-hidden="true"
    >
      {{ monogram }}
    </span>

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
