<script setup lang="ts">
import { ref } from 'vue'

/**
 * Pointer-tracked 3D tilt with a glare that follows the cursor, after the
 * transitions.dev recipe: the pointer is tracked on a wrapper that never
 * transforms, so the rotating card can't slip out from under the cursor.
 */
const props = withDefaults(defineProps<{ max?: number }>(), { max: 9 })

const wrapper = ref<HTMLElement | null>(null)
const hovering = ref(false)
const moving = ref(false)
const style = ref<Record<string, string>>({})

const reduced =
  typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null

function track(event: PointerEvent) {
  if (reduced?.matches || !wrapper.value) return
  const rect = wrapper.value.getBoundingClientRect()
  const x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
  const y = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height))

  hovering.value = true
  moving.value = true
  style.value = {
    '--tilt-ry': `${((x - 0.5) * props.max).toFixed(2)}deg`,
    '--tilt-rx': `${((0.5 - y) * props.max).toFixed(2)}deg`,
    '--tilt-gx': `${(x * 100).toFixed(1)}%`,
    '--tilt-gy': `${(y * 100).toFixed(1)}%`,
  }
}

function reset() {
  hovering.value = false
  moving.value = false
  style.value = { '--tilt-rx': '0deg', '--tilt-ry': '0deg' }
}
</script>

<template>
  <div
    ref="wrapper"
    class="tilt"
    @pointermove="track"
    @pointerleave="reset"
    @pointercancel="reset"
  >
    <div class="tilt-card" :class="{ 'is-moving': moving }" :style="style">
      <slot />
      <span class="tilt-glare" :class="{ 'is-lit': hovering }" />
    </div>
  </div>
</template>

<style scoped>
.tilt {
  perspective: 1000px;
}

.tilt-card {
  position: relative;
  height: 100%;
  transform: rotateX(var(--tilt-rx, 0deg)) rotateY(var(--tilt-ry, 0deg));
  transform-style: preserve-3d;
  transition: transform 900ms var(--ease-out-quint);
  will-change: transform;
}

.tilt-card.is-moving {
  transition-duration: 350ms;
}

.tilt-glare {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0;
  border-radius: inherit;
  mix-blend-mode: soft-light;
  background: radial-gradient(
    circle 220px at var(--tilt-gx, 50%) var(--tilt-gy, 50%),
    oklch(100% 0 0 / 0.7),
    oklch(100% 0 0 / 0.08) 55%,
    transparent 80%
  );
  transition: opacity 300ms var(--ease-out-quint);
}

.tilt-glare.is-lit {
  opacity: 0.75;
}

@media (prefers-reduced-motion: reduce) {
  .tilt-card {
    transform: none !important;
    transition: none !important;
  }
}
</style>
