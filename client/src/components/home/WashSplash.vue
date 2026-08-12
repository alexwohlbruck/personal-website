<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { usePreferredReducedMotion } from '@vueuse/core'

/**
 * Colour spilled on the hero, wherever you press, and dragged around like a
 * loaded brush.
 *
 * The hero already floats on a wash: soft pools of rust and marine that you
 * feel rather than read. This is the same wash, poured on demand. Each stamp
 * arrives at full size out of a blur rather than growing from the press —
 * anything that expands from a point reads as a circle, however soft its edge.
 * What it does instead is drift: three overlapping lobes, each wandering on its
 * own clock, so the mass keeps changing shape for as long as it is on the page.
 *
 * Holding and moving lays down more stamps along the way. They overlap into one
 * body of colour, which is what makes it feel painted rather than clicked. The
 * tint is chosen per stroke, not per stamp, so a drag stays one colour and it
 * is the next press that changes hue.
 */

/** Enough for a full-width drag; they expire faster than a stroke fills it. */
const LIMIT = 14
/** How far the brush travels before it leaves another stamp, and how often. */
const STEP = 70
const GAP = 110
const TINTS = ['accent', 'marine'] as const

interface Pour {
  id: number
  x: number
  y: number
  size: number
  turn: number
  tint: (typeof TINTS)[number]
}

const layer = ref<HTMLElement | null>(null)
const pours = ref<Pour[]>([])
const reduced = usePreferredReducedMotion()

let painting = false
let last = { x: 0, y: 0, at: 0 }
let nextId = 0
let nextTint = 0
let tint: (typeof TINTS)[number] = 'accent'

/** Pointer position inside the layer, or null if the press missed the hero. */
function local(event: PointerEvent) {
  const el = layer.value
  if (!el) return null
  const rect = el.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  if (x < 0 || y < 0 || x > rect.width || y > rect.height) return null
  return { x, y }
}

function stamp(x: number, y: number, at: number) {
  // Size and rotation vary per stamp, so a stroke doesn't read as one shape
  // rubber-stamped along a line.
  if (pours.value.length >= LIMIT) pours.value.shift()
  pours.value.push({
    id: nextId++,
    x,
    y,
    size: Math.round(360 + Math.random() * 220),
    turn: Math.round(Math.random() * 360),
    tint,
  })
  last = { x, y, at }
}

function press(event: PointerEvent) {
  if (reduced.value === 'reduce') return
  const at = local(event)
  if (!at) return
  painting = true
  tint = TINTS[nextTint++ % TINTS.length]!
  stamp(at.x, at.y, performance.now())
}

function drag(event: PointerEvent) {
  if (!painting) return
  const at = local(event)
  if (!at) return

  // Two gates: one so a slow drag doesn't pile stamps on one spot, one so a
  // fast flick across the page doesn't lay down more than the limit holds.
  const now = performance.now()
  if (now - last.at < GAP) return
  if (Math.hypot(at.x - last.x, at.y - last.y) < STEP) return
  stamp(at.x, at.y, now)
}

function release() {
  painting = false
}

/** A stamp is done when its animation is; nothing to time in JS. */
function drain(id: number) {
  pours.value = pours.value.filter((p) => p.id !== id)
}

onMounted(() => {
  window.addEventListener('pointerdown', press, { passive: true })
  window.addEventListener('pointermove', drag, { passive: true })
  window.addEventListener('pointerup', release, { passive: true })
  window.addEventListener('pointercancel', release, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('pointerdown', press)
  window.removeEventListener('pointermove', drag)
  window.removeEventListener('pointerup', release)
  window.removeEventListener('pointercancel', release)
})
</script>

<template>
  <span ref="layer" class="pointer-events-none absolute inset-0" aria-hidden="true">
    <span
      v-for="p in pours"
      :key="p.id"
      class="pour"
      :class="`pour-${p.tint}`"
      :style="{
        left: `${p.x}px`,
        top: `${p.y}px`,
        '--pour-size': `${p.size}px`,
        '--pour-turn': `${p.turn}deg`,
      }"
      @animationend="drain(p.id)"
    >
      <span class="lobe" />
    </span>
  </span>
</template>

<style scoped>
.pour {
  --pour-blob: radial-gradient(
    closest-side,
    color-mix(in oklab, var(--pour-ink) var(--pour-core), transparent) 0,
    color-mix(in oklab, var(--pour-ink) var(--pour-edge), transparent) 46%,
    transparent 74%
  );

  position: absolute;
  width: var(--pour-size);
  height: var(--pour-size);
  margin: calc(var(--pour-size) / -2) 0 0 calc(var(--pour-size) / -2);
  opacity: 0;
  transform: rotate(var(--pour-turn));
  /*
   * The one place in this design where a blur filter earns its cost. Soft
   * gradient stops alone still leave a readable silhouette, and the whole point
   * here is that you cannot tell what shape the colour is. The lobes move under
   * it every frame anyway, so the layer is being recomposited regardless.
   */
  filter: blur(28px);
  animation: pour-in 5.2s linear forwards;
}

/*
 * Three lobes rather than one: their union is lopsided, and because each drifts
 * on a different clock the outline never settles into anything you could name.
 * Mixed from the solid accents rather than the wash tokens — the washes are
 * already dilute, and colour arriving needs more pigment than colour that has
 * been sitting there all day.
 */
.lobe,
.pour::before,
.pour::after {
  position: absolute;
  border-radius: 50%;
  background: var(--pour-blob);
}

.pour::before,
.pour::after {
  content: '';
}

.lobe {
  inset: 4% 22% 20% 2%;
  animation: flow-a 4.5s ease-in-out infinite alternate;
}

/* The two that hang off the edges are what break the outline. */
.pour::before {
  inset: 18% -14% 12% 26%;
  animation: flow-b 5.5s ease-in-out infinite alternate;
}

.pour::after {
  inset: -12% 30% 26% -8%;
  animation: flow-c 6.5s ease-in-out infinite alternate;
}

.pour-accent {
  --pour-ink: var(--accent);
  --pour-core: 7%;
  --pour-edge: 3%;
}

/* Marine is the quieter of the two hues, so it is poured a little thicker. */
.pour-marine {
  --pour-ink: var(--marine);
  --pour-core: 8%;
  --pour-edge: 3.5%;
}

/*
 * On the dark sheet the same mix barely lifts off the page: there is no paper
 * underneath to carry it, and both accents are already light.
 */
[data-theme='dark'] .pour-accent {
  --pour-core: 12%;
  --pour-edge: 5%;
}

[data-theme='dark'] .pour-marine {
  --pour-core: 13%;
  --pour-edge: 5.5%;
}

/*
 * Fades and focuses in on the spot, never scaling: opacity and blur are the
 * only things that move, so there is no expanding edge to follow.
 */
@keyframes pour-in {
  from {
    opacity: 0;
    filter: blur(64px);
  }
  16% {
    opacity: 1;
  }
  34% {
    filter: blur(28px);
  }
  to {
    opacity: 0;
    filter: blur(28px);
  }
}

@keyframes flow-a {
  from {
    transform: translate(5%, -4%) scale(1.08);
  }
  to {
    transform: translate(-8%, 7%) scale(0.94);
  }
}

@keyframes flow-b {
  from {
    transform: translate(-7%, 5%) scale(0.9);
  }
  to {
    transform: translate(9%, -8%) scale(1.12);
  }
}

@keyframes flow-c {
  from {
    transform: translate(8%, -6%) scale(1.1);
  }
  to {
    transform: translate(-6%, 9%) scale(0.92);
  }
}

@media (prefers-reduced-motion: reduce) {
  .pour {
    display: none;
  }
}
</style>
