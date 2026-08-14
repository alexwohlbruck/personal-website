<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { CSSProperties } from 'vue'
import { Motion } from 'motion-v'
import { ArrowRight, PenLine } from '@lucide/vue'
import { BACKEND_URL } from '@/data/site'
import { useLiveStore } from '@/stores/live'
import { duration, ease, step } from '@/lib/motion'
import GuestbookMark from '@/components/guestbook/GuestbookMark.vue'
import GuestbookPaper from '@/components/guestbook/GuestbookPaper.vue'
import { itemBounds, normalizeItem, type GuestbookItem } from '@/lib/guestbook'

type Frame = { x: number; y: number; width: number; height: number }

/** What the card shows before it knows where anything is. */
const RESTING_FRAME: Frame = { x: -360, y: -220, width: 720, height: 440 }
/** A ceiling matching the endpoint's, so a long-lived tab cannot outgrow it. */
const PREVIEW_LIMIT = 400
/** How many of the most recent marks the camera settles over. */
const FOCUS_ON = 12
/** How much board the card shows, in world units, whatever is on it. */
const WINDOW = 1900

const live = useLiveStore()
const guestbookItems = ref<GuestbookItem[]>([])
const guestbookCanvas = ref<SVGSVGElement>()
/** The card's own proportions, so the framing matches what it will show. */
const cardRatio = ref(2.1)
let cardResize: ResizeObserver | undefined
let guestbookStream: EventSource | undefined
let onScreen: IntersectionObserver | undefined
let refillTimer: number | undefined

/**
 * A handful of distinct picks, weighted toward the front of the list.
 *
 * `live.instagramImages` is shared store state: once something has paged
 * through the social gallery it holds every photo fetched so far, not just
 * the first page, so a plain random pick draws evenly from the whole
 * archive. The decay keeps the odds concentrated on the newest posts while
 * still leaving a long tail reachable.
 */
function sample<T>(items: T[], count: number, decay = 0.85): T[] {
  const pool = items.map((item, index) => ({ item, weight: decay ** index }))
  const picked: T[] = []
  while (picked.length < count && pool.length) {
    const total = pool.reduce((sum, entry) => sum + entry.weight, 0)
    let roll = Math.random() * total
    let index = 0
    while (index < pool.length - 1 && roll > pool[index].weight) {
      roll -= pool[index].weight
      index += 1
    }
    picked.push(pool.splice(index, 1)[0].item)
  }
  return picked
}

const pileTiles = computed(() => {
  const photos = sample(live.instagramImages, 5).map((photo) => ({
    key: photo.key,
    url: photo.url,
    alt: photo.caption?.slice(0, 80) ?? 'Recent photo',
  }))
  const seenArtwork = new Set<string>()
  const albums = (live.listening?.liked ?? [])
    .filter((track) => {
      if (!track.artwork || seenArtwork.has(track.artwork)) return false
      seenArtwork.add(track.artwork)
      return true
    })
    .slice(0, 3)
    .map((track) => ({ key: `album:${track.id}`, url: track.artwork!, alt: `${track.album} album art` }))
  const mixed = [
    photos[0], albums[0], photos[1], photos[2], albums[1],
    photos[3], photos[4], albums[2],
  ]
  return Array.from({ length: 8 }, (_, index) => mixed[index])
})

const pileAnchors = [
  { left: -4, top: 29, rotation: -10 },
  { left: 18, top: -4, rotation: 7 },
  { left: 7, top: 10, rotation: -4 },
  { left: 47, top: 31, rotation: 10 },
  { left: 35, top: -3, rotation: -7 },
  { left: 64, top: 8, rotation: 5 },
  { left: 80, top: 28, rotation: -8 },
  { left: 25, top: 32, rotation: 5 },
]

const layers = pileAnchors.map((_, index) => index + 1)
for (let index = layers.length - 1; index > 0; index -= 1) {
  const swap = Math.floor(Math.random() * (index + 1))
  const layer = layers[index]
  layers[index] = layers[swap]
  layers[swap] = layer
}

const pileLayout = pileAnchors.map((anchor, index) => {
  const jitter = (amount: number) => (Math.random() * 2 - 1) * amount
  return {
    left: Math.min(82, Math.max(-5, anchor.left + jitter(3.5))),
    top: Math.min(34, Math.max(-5, anchor.top + jitter(4))),
    rotation: anchor.rotation + jitter(3),
    layer: layers[index],
  }
})
const pileShuffle = pileLayout.map(() => ({ x: 0, y: 0, rotation: 0 }))
const pileMotion = pileLayout.map(() => ({
  mobility: 0.78 + Math.random() * 0.44,
  sway: (Math.random() * 2 - 1) * 0.24,
  duration: 280 + Math.round(Math.random() * 140),
}))

function pileStyle(index: number): CSSProperties {
  const layout = pileLayout[index]
  return {
    left: `${layout.left}%`,
    top: `${layout.top}%`,
    zIndex: layout.layer,
    '--pile-rotation': `${layout.rotation}deg`,
    '--pile-shift-x': '0px',
    '--pile-shift-y': '0px',
    '--pile-wobble': '0deg',
    '--pile-duration': `${pileMotion[index].duration}ms`,
  } as CSSProperties
}

function movePile(event: PointerEvent) {
  if (event.pointerType !== 'mouse' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const host = event.currentTarget as HTMLElement
  const rect = host.getBoundingClientRect()
  if (event.clientY > rect.bottom - 44) return clearPileFocus(event)

  const tiles = [...host.querySelectorAll<HTMLElement>('.pile-photo')]
  const positions = tiles.map((tile) => {
    const shuffle = pileShuffle[Number(tile.dataset.pileIndex)]
    const x = rect.left + tile.offsetLeft + tile.offsetWidth / 2 + shuffle.x
    const y = rect.top + tile.offsetTop + tile.offsetHeight / 2 + shuffle.y
    return { x, y, dx: x - event.clientX, dy: y - event.clientY }
  })
  const nearest = positions.reduce(
    (best, position, index) => {
      const distance = Math.hypot(position.dx, position.dy)
      return distance < best.distance ? { index, distance } : best
    },
    { index: 0, distance: Number.POSITIVE_INFINITY },
  ).index

  const focused = positions[nearest]
  const previous = pileShuffle.map((item) => ({ ...item }))
  const affected = new Set<number>([nearest])
  tiles.forEach((tile, index) => {
    const position = positions[index]
    const pileIndex = Number(tile.dataset.pileIndex)
    const shuffle = pileShuffle[pileIndex]
    const motion = pileMotion[pileIndex]
    if (index === nearest) {
      const distance = Math.max(1, Math.hypot(position.dx, position.dy))
      const follow = Math.min(2.4, distance * 0.025) * motion.mobility
      shuffle.x -= position.dx / distance * follow
      shuffle.y -= position.dy / distance * follow
      tile.dataset.nearest = 'true'
    } else {
      const dx = position.x - focused.x
      const dy = position.y - focused.y
      const distance = Math.max(1, Math.hypot(dx, dy))
      const pressure = Math.max(0, 1 - distance / 150)
      const push = pressure * 3.2 * motion.mobility
      if (push > 0) {
        const radialX = dx / distance
        const radialY = dy / distance
        shuffle.x += (radialX - radialY * motion.sway) * push
        shuffle.y += (radialY + radialX * motion.sway) * push
        affected.add(pileIndex)
      }
      delete tile.dataset.nearest
    }
  })

  // Balance only the local cluster that moved. Distant photos remain still,
  // while the shuffled arrangement is free to persist after hover.
  const localDeltaX = [...affected].reduce((sum, index) => sum + pileShuffle[index].x - previous[index].x, 0) / affected.size
  const localDeltaY = [...affected].reduce((sum, index) => sum + pileShuffle[index].y - previous[index].y, 0) / affected.size
  affected.forEach((index) => {
    pileShuffle[index].x -= localDeltaX
    pileShuffle[index].y -= localDeltaY
  })

  tiles.forEach((tile) => {
    const pileIndex = Number(tile.dataset.pileIndex)
    if (!affected.has(pileIndex)) return
    const shuffle = pileShuffle[pileIndex]
    const motion = pileMotion[pileIndex]

    const photoCenterX = tile.offsetLeft + tile.offsetWidth / 2 + shuffle.x
    const photoCenterY = tile.offsetTop + tile.offsetHeight / 2 + shuffle.y
    const towardCenterX = rect.width / 2 - photoCenterX
    const towardCenterY = (rect.height - 44) / 2 - photoCenterY
    const centerDistance = Math.max(1, Math.hypot(towardCenterX, towardCenterY))
    const centerPull = 3_200 / (centerDistance * centerDistance + 6_400)
    shuffle.x += towardCenterX / centerDistance * centerPull
    shuffle.y += towardCenterY / centerDistance * centerPull

    const bleed = Math.min(26, tile.offsetWidth * 0.2)
    const minX = -bleed - tile.offsetLeft
    const maxX = rect.width + bleed - tile.offsetLeft - tile.offsetWidth
    const minY = -bleed - tile.offsetTop
    const maxY = rect.height + bleed - tile.offsetTop - tile.offsetHeight - 44
    shuffle.x = Math.max(minX, Math.min(maxX, shuffle.x))
    shuffle.y = Math.max(minY, Math.min(maxY, shuffle.y))
    tile.style.setProperty('--pile-shift-x', `${shuffle.x}px`)
    tile.style.setProperty('--pile-shift-y', `${shuffle.y}px`)
    const movementX = shuffle.x - previous[pileIndex].x
    const movementY = shuffle.y - previous[pileIndex].y
    shuffle.rotation = Math.max(
      -6,
      Math.min(6, shuffle.rotation + movementX * 0.11 - movementY * 0.07 + motion.sway * 0.08),
    )
    tile.style.setProperty('--pile-wobble', `${shuffle.rotation}deg`)
  })
}

function clearPileFocus(event: PointerEvent) {
  const host = event.currentTarget as HTMLElement
  host.querySelectorAll<HTMLElement>('.pile-photo').forEach((tile) => {
    delete tile.dataset.nearest
  })
}

const focus = computed(() => {
  if (!guestbookItems.value.length) return RESTING_FRAME

  // The card draws the whole board and points its camera at the newest corner
  // of it. The list arrives oldest first, so the tail is the recent work.
  //
  // Their average, not their bounding box. Recent marks are often scattered —
  // one person drawing across the board leaves a dozen of them three thousand
  // units apart — and framing to hold all of them zooms out until the card is
  // specks on paper. Focusing is a camera move, so the scale stays put and
  // only the position follows.
  const recent = guestbookItems.value.slice(-FOCUS_ON).map(itemBounds)
  const centerX = recent.reduce((sum, box) => sum + box.x + box.width / 2, 0) / recent.length
  const centerY = recent.reduce((sum, box) => sum + box.y + box.height / 2, 0) / recent.length

  // Shaped like the card, because it crops with preserveAspectRatio="slice"
  // and would otherwise lose whatever does not fit. Measured rather than
  // assumed: it was taken to be 1.55 and is nearer 2.1, which quietly cut a
  // quarter of the height off every framing.
  const width = WINDOW
  const height = WINDOW / cardRatio.value

  // The invitation covers the left of the card, so put the marks in the middle
  // of the paper that is actually showing.
  return { x: centerX - width * 0.72, y: centerY - height / 2, width, height }
})

/** Where it is actually looking, which chases `focus` rather than matching it. */
const guestbookFrame = ref<Frame>(RESTING_FRAME)
const guestbookViewBox = computed(() => {
  const frame = guestbookFrame.value
  return `${frame.x} ${frame.y} ${frame.width} ${frame.height}`
})

let cameraMove: number | undefined
let framedOnce = false

/** The card's own curve, the one its hover transition already uses. */
const easeOutQuint = (t: number) => 1 - (1 - t) ** 5

function moveCameraTo(next: Frame, instant = false) {
  if (cameraMove) cancelAnimationFrame(cameraMove)
  cameraMove = undefined

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (instant || reduced) {
    guestbookFrame.value = { ...next }
    return
  }

  const from = { ...guestbookFrame.value }
  const started = performance.now()
  const span = duration.slow * 1000

  const tick = (now: number) => {
    const progress = Math.min(1, (now - started) / span)
    const eased = easeOutQuint(progress)
    guestbookFrame.value = {
      x: from.x + (next.x - from.x) * eased,
      y: from.y + (next.y - from.y) * eased,
      width: from.width + (next.width - from.width) * eased,
      height: from.height + (next.height - from.height) * eased,
    }
    cameraMove = progress < 1 ? requestAnimationFrame(tick) : undefined
  }
  cameraMove = requestAnimationFrame(tick)
}

// The first framing is where the card starts, not somewhere it travels to.
watch(focus, (next) => {
  moveCameraTo(next, !framedOnce)
  framedOnce = true
})

async function loadGuestbookPreview(fresh = false) {
  try {
    const response = await fetch(`${BACKEND_URL}/guestbook/preview`, {
      cache: fresh ? 'no-store' : 'default',
    })
    if (!response.ok) return
    const result = await response.json() as { items: GuestbookItem[] }
    // Oldest first, as the endpoint sends them, so the end of the list is
    // always the most recent mark. Normalised on the way in because the shared
    // renderer draws what a mark says it is rather than guessing defaults.
    guestbookItems.value = result.items.map((item) => normalizeItem(withoutUpload(item)))
  } catch {
    // The invitation and paper texture still make a complete card offline.
  }
}

/**
 * Keep the stamp, not the photograph.
 *
 * The stream already leaves uploads out, so this is usually nothing. It
 * matters for the first load, which reads an endpoint that could carry one,
 * and it keeps a megabyte of base64 off the busiest page on the site either
 * way. GuestbookMark falls back to the thumbnail on its own.
 */
function withoutUpload(item: GuestbookItem): GuestbookItem {
  if (item.kind !== 'image' || !item.src) return item
  const { src, ...rest } = item
  void src
  return rest
}

function applyGuestbookChange(event: Event) {
  const change = JSON.parse((event as MessageEvent<string>).data) as
    | { action: 'upsert'; item: GuestbookItem }
    | { action: 'delete'; id: string }

  if (change.action === 'delete') {
    guestbookItems.value = guestbookItems.value.filter((item) => item.id !== change.id)
    // The card holds a patch of the board, so a removal leaves a hole rather
    // than revealing what was behind it. Ask again for what is there now.
    window.clearTimeout(refillTimer)
    refillTimer = window.setTimeout(() => void loadGuestbookPreview(true), 1_500)
    return
  }

  const item = normalizeItem(withoutUpload(change.item))
  guestbookItems.value = [
    ...guestbookItems.value.filter((existing) => existing.id !== item.id),
    item,
  ].slice(-PREVIEW_LIMIT)
}

/**
 * Watch the board, but only while the card is on screen.
 *
 * This is the busiest page on the site and the stream is a held connection per
 * visitor, so opening one for somebody who never scrolls past the hero is a
 * cost with nothing to show for it.
 */
function watchGuestbook() {
  if (guestbookStream || !BACKEND_URL) return
  guestbookStream = new EventSource(`${BACKEND_URL}/guestbook/stream`)
  // Reconnecting means time has passed and marks were missed.
  guestbookStream.addEventListener('ready', () => void loadGuestbookPreview(true))
  guestbookStream.addEventListener('guestbook', applyGuestbookChange)
}

function stopWatchingGuestbook() {
  guestbookStream?.removeEventListener('guestbook', applyGuestbookChange)
  guestbookStream?.close()
  guestbookStream = undefined
}

onMounted(() => {
  if (!live.instagramImages.length) void live.fetchInstagram()
  if (!live.listening) void live.fetchListening()
  void loadGuestbookPreview()

  if (guestbookCanvas.value) {
    cardResize = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      if (width > 0 && height > 0) cardRatio.value = width / height
    })
    cardResize.observe(guestbookCanvas.value)
  }

  onScreen = new IntersectionObserver(
    ([entry]) => (entry.isIntersecting ? watchGuestbook() : stopWatchingGuestbook()),
    { rootMargin: '200px' },
  )
  if (guestbookCanvas.value) onScreen.observe(guestbookCanvas.value)
})

onBeforeUnmount(() => {
  window.clearTimeout(refillTimer)
  cardResize?.disconnect()
  onScreen?.disconnect()
  stopWatchingGuestbook()
  if (cameraMove) cancelAnimationFrame(cameraMove)
})
</script>

<template>
  <section class="py-10" aria-label="Around here lately">
    <div class="grid gap-5 lg:grid-cols-2">
      <RouterLink
        :to="{ name: 'social' }"
        class="photo-pile group relative block"
        aria-label="See recent photos on the social page"
        @pointermove="movePile"
        @pointerleave="clearPileFocus"
      >
        <div
          v-for="(tile, index) in pileTiles"
          :key="tile?.key ?? `photo-placeholder-${index}`"
          class="pile-photo absolute aspect-square overflow-hidden rounded-lg bg-paper-sunk ring-1 ring-rule"
          :data-pile-index="index"
          :style="pileStyle(index)"
        >
          <Motion
            v-if="tile"
            as="div"
            :initial="{ opacity: 0, scale: 0.94, filter: 'blur(4px)' }"
            :animate="{ opacity: 1, scale: 1, filter: 'blur(0px)' }"
            :transition="{ duration: duration.base, ease, delay: step(index) }"
            class="size-full"
          >
            <img
              :src="tile.url"
              :alt="tile.alt"
              loading="lazy"
              decoding="async"
              class="size-full object-cover"
            />
          </Motion>
          <span v-else class="block size-full animate-pulse bg-paper-sunk" />
        </div>
        <span class="pile-hint absolute bottom-5 right-3 inline-flex items-center gap-2 text-sm text-ink-3">
          See what I’ve been up to
          <ArrowRight class="preview-arrow size-4 text-accent" />
        </span>
      </RouterLink>

      <RouterLink
        :to="{ name: 'guestbook' }"
        class="preview-card guestbook-card group relative block overflow-hidden rounded-2xl"
        aria-label="Open the guestbook and leave your mark"
      >
        <svg
          ref="guestbookCanvas"
          class="guestbook-mini absolute inset-0 size-full"
          :viewBox="guestbookViewBox"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <GuestbookPaper :frame="guestbookFrame" />
        <GuestbookMark v-for="item in guestbookItems" :key="item.id" :item="item" />
        </svg>

        <div class="invite-note absolute bottom-5 left-5 z-10 max-w-[15rem] rounded-sm px-5 py-5 text-[#432d20]">
          <span class="note-tape absolute -top-2 left-1/2 h-4 w-16 -translate-x-1/2" aria-hidden="true" />
          <PenLine class="mb-3 size-4 opacity-60" />
          <p class="font-serif text-2xl leading-[1.08]">Psst… there’s room for your scribble.</p>
          <span class="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-[#76513e]">
            Sign your name
            <ArrowRight class="preview-arrow size-4" />
          </span>
        </div>
      </RouterLink>

    </div>
  </section>
</template>

<style scoped>
.preview-card {
  border: 1px solid var(--rule);
  color: var(--ink);
  background: var(--surface);
  box-shadow: var(--sheen), var(--tile-ring), var(--shadow-2);
  transition: border-color 240ms ease, box-shadow 300ms ease, transform 400ms var(--ease-out-quint);
}

.photo-pile { min-height: 16rem; }
.pile-photo {
  width: min(26%, 7.5rem);
  box-shadow: var(--shadow-2);
  transform: translate(var(--pile-shift-x), var(--pile-shift-y)) rotate(calc(var(--pile-rotation) + var(--pile-wobble)));
  transition: transform var(--pile-duration) cubic-bezier(0.2, 0.9, 0.25, 1.12), box-shadow 220ms ease;
  will-change: transform;
}
.pile-hint { transition: color 200ms ease; }

.guestbook-card { min-height: 15rem; }
.guestbook-mini { transition: transform 700ms var(--ease-out-quint); }
.invite-note {
  background: #f4dd83;
  box-shadow: 0 12px 30px rgb(67 45 32 / 0.2);
  transform: rotate(-2deg);
  transition: transform 450ms var(--ease-out-quint), box-shadow 300ms ease;
}
.note-tape { background: rgb(255 249 226 / 0.72); transform: translateX(-50%) rotate(1deg); }
.preview-arrow { transition: transform 300ms var(--ease-out-quint); }

@media (hover: hover) and (pointer: fine) {
  .preview-card:hover {
    border-color: var(--rule-strong);
    box-shadow: var(--sheen), var(--tile-ring), var(--shadow-3);
    transform: translateY(-3px);
  }
  .pile-photo[data-nearest='true'] { box-shadow: var(--shadow-3); }
  .photo-pile:hover .pile-hint { color: var(--accent); }
  .preview-card:hover .guestbook-mini { transform: scale(1.025); }
  .preview-card:hover .invite-note { box-shadow: 0 18px 38px rgb(67 45 32 / 0.25); transform: rotate(0deg) translateY(-4px); }
  .preview-card:hover .preview-arrow { transform: translateX(4px); }
}

@media (prefers-reduced-motion: reduce) {
  .preview-card,
  .pile-photo,
  .guestbook-mini,
  .invite-note,
  .preview-arrow { transition: none; }
}
</style>
