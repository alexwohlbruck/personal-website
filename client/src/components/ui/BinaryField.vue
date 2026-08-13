<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, useTemplateRef, watch } from 'vue'
import { useDocumentVisibility, usePreferredReducedMotion, useResizeObserver } from '@vueuse/core'

/**
 * A wall of ones and zeroes, faintly, behind a card.
 *
 * The paper motifs elsewhere on the site are all things you feel rather than
 * read — a dot grid, a graticule, contour lines. This is the same idea for the
 * side of the site that is made of code: dense, close-set, and washed down to
 * most of the way to nothing, so it reads as tooth in the paper rather than a
 * panel of text sitting behind the copy.
 *
 * Digits change without announcing it. An animated flip drags the eye to
 * whichever character moved, which is the opposite of what a texture should do;
 * swapping them outright at this contrast reads as the surface quietly
 * shifting. A few change every tenth of a second, so the whole wall stays alive
 * without anything in it ever asking to be watched.
 *
 * The grid is rendered once and then written to directly. Vue owns the initial
 * field, but a few thousand reactive characters would mean diffing the whole
 * wall several times a second to change a couple of dozen, and this is
 * decoration: the animation talks to the nodes instead.
 */
const CELL = { width: 10, height: 12 }
/** Small and fast rather than large and slow: the wall never visibly pulses. */
const FLIP_EVERY = 90
/** Share of the wall that turns over each tick. At this contrast a handful of
 * changed digits is invisible, so it takes a lot of them to read as alive. */
const FLIP_SHARE = 0.06
/**
 * Reduced motion does not mean a frozen surface. Nothing here moves, slides or
 * blinks — characters are simply not what they were a moment ago — so the wall
 * keeps turning over, slowly enough that it is never something you could catch
 * happening.
 */
const CALM_EVERY = 1_400
const CALM_SHARE = 0.004

const root = useTemplateRef<HTMLElement>('root')
const page = useDocumentVisibility()
const reduced = usePreferredReducedMotion()

const size = ref({ width: 0, height: 0 })

/**
 * Measured rather than observed.
 *
 * A ResizeObserver alone is not enough: mounted in a backgrounded tab — which
 * is what a hot reload behind another window is — it may never deliver its
 * first observation, and the wall then sits at zero columns forever with
 * nothing in it to change. So the box is also read outright on mount and again
 * whenever the tab is returned to.
 */
function measure() {
  const rect = root.value?.getBoundingClientRect()
  if (rect?.width && rect.height) size.value = { width: rect.width, height: rect.height }
}

useResizeObserver(root, measure)
onMounted(measure)
watch(page, (state) => state === 'visible' && measure())

const columns = computed(() => Math.ceil(size.value.width / CELL.width) || 0)
const rows = computed(() => Math.ceil(size.value.height / CELL.height) || 0)

/** Shallow: this is the starting state of the wall, not a live model of it. */
const digits = shallowRef<string[]>([])

/** Rebuilt only when the card changes size, which is a resize or a breakpoint,
 * never a flip. */
watch(
  () => columns.value * rows.value,
  (count) => {
    if (count === digits.value.length) return
    digits.value = Array.from({ length: count }, () => (Math.random() < 0.5 ? '0' : '1'))
  },
  { immediate: true },
)

let timer: ReturnType<typeof setInterval> | undefined

function flip(share: number) {
  const cells = root.value?.children
  if (!cells?.length) return

  const count = Math.round(cells.length * share)
  for (let i = 0; i < count; i += 1) {
    const cell = cells[Math.floor(Math.random() * cells.length)] as HTMLElement | undefined
    if (cell) cell.textContent = cell.textContent === '0' ? '1' : '0'
  }
}

function stop() {
  clearInterval(timer)
  timer = undefined
}

watch(
  [page, reduced, () => digits.value.length],
  ([state, motion]) => {
    stop()
    // Whether the card is scrolled into view is deliberately not part of this.
    // A few hundred text writes a second cost nothing next to an element the
    // compositor is not painting, and an IntersectionObserver that never
    // reports — a hidden or throttled tab will do that — leaves the wall dead
    // for the rest of the session.
    if (state === 'hidden') return

    const calm = motion === 'reduce'
    timer = setInterval(() => flip(calm ? CALM_SHARE : FLIP_SHARE), calm ? CALM_EVERY : FLIP_EVERY)
  },
  { immediate: true },
)

onBeforeUnmount(stop)
</script>

<template>
  <div
    ref="root"
    class="wall"
    aria-hidden="true"
    :style="{
      '--columns': columns,
      '--cell-w': `${CELL.width}px`,
      '--cell-h': `${CELL.height}px`,
    }"
  >
    <span v-for="(digit, index) in digits" :key="index" class="bit">{{ digit }}</span>
  </div>
</template>

<style scoped>
.wall {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: repeat(var(--columns), var(--cell-w));
  grid-auto-rows: var(--cell-h);
  overflow: hidden;
  pointer-events: none;
  user-select: none;
  font-family: var(--font-mono);
  font-size: 0.5625rem;
  line-height: 1;
  /* A fraction of the ink the contour sheets are drawn in. At full strength a
     wall this dense stops being texture and starts being a paragraph. */
  color: color-mix(in oklab, var(--topo-ink) 40%, transparent);
  /*
   * Washed off rather than cut off. A soft pool centred above the card carries
   * the digits down from the top edge and dissolves them into the corners; the
   * second layer takes what is left out before the graph. Intersecting two
   * gradients is how the topo sheets are masked as well.
   */
  mask-image:
    radial-gradient(135% 105% at 50% -12%, #000 0%, #000 30%, transparent 82%),
    linear-gradient(to bottom, #000 0%, #000 22%, transparent 76%);
  mask-composite: intersect;
}

.bit {
  display: grid;
  place-items: center;
}
</style>
