<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ArrowRight, PenLine } from '@lucide/vue'
import { BACKEND_URL } from '@/data/site'
import { useLiveStore } from '@/stores/live'

type Point = [number, number]
type PreviewItem = {
  id: string
  kind: 'drawing' | 'text' | 'sticky' | 'emoji' | 'image'
  x: number
  y: number
  rotation?: number
  points?: Point[]
  color?: string
  width?: number
  height?: number
  size?: number
  text?: string
  emoji?: string
}

const live = useLiveStore()
const guestbookItems = ref<PreviewItem[]>([])

const photos = computed(() => live.instagramImages.slice(0, 7).reverse())
const pileTiles = computed(() => Array.from({ length: 7 }, (_, index) => photos.value[index]))

const stickyColors: Record<string, string> = {
  yellow: '#f4dd83',
  pink: '#efb5b7',
  blue: '#acd8df',
  green: '#b9d6aa',
  orange: '#f3bd85',
  lavender: '#cbbbe5',
}

function bounds(item: PreviewItem) {
  if (item.kind === 'drawing' && item.points?.length) {
    const xs = item.points.map(([x]) => x)
    const ys = item.points.map(([, y]) => y)
    const x = Math.min(...xs)
    const y = Math.min(...ys)
    return { x, y, width: Math.max(8, Math.max(...xs) - x), height: Math.max(8, Math.max(...ys) - y) }
  }
  if (item.kind === 'emoji') {
    const size = item.size ?? 48
    return { x: item.x - size / 2, y: item.y - size / 2, width: size, height: size }
  }
  return { x: item.x, y: item.y, width: item.width ?? 160, height: item.height ?? 80 }
}

const guestbookFrame = computed(() => {
  if (!guestbookItems.value.length) return { x: -360, y: -220, width: 720, height: 440 }
  const boxes = guestbookItems.value.map(bounds)
  const left = Math.min(...boxes.map((box) => box.x))
  const right = Math.max(...boxes.map((box) => box.x + box.width))
  const top = Math.min(...boxes.map((box) => box.y))
  const bottom = Math.max(...boxes.map((box) => box.y + box.height))
  const centerX = (left + right) / 2
  const centerY = (top + bottom) / 2
  let width = Math.max(620, right - left + 120)
  let height = Math.max(380, bottom - top + 120)
  const ratio = 1.55
  if (width / height > ratio) height = width / ratio
  else width = height * ratio
  return { x: centerX - width / 2, y: centerY - height / 2, width, height }
})
const guestbookViewBox = computed(() => {
  const frame = guestbookFrame.value
  return `${frame.x} ${frame.y} ${frame.width} ${frame.height}`
})

function transform(item: PreviewItem) {
  if (!item.rotation || item.kind === 'drawing') return undefined
  const box = bounds(item)
  return `rotate(${item.rotation} ${box.x + box.width / 2} ${box.y + box.height / 2})`
}

function drawingPoints(item: PreviewItem) {
  return item.points?.map((point) => point.join(',')).join(' ') ?? ''
}

function shortText(item: PreviewItem, limit = 26) {
  const text = item.text?.trim() ?? ''
  return text.length > limit ? `${text.slice(0, limit - 1)}…` : text
}

async function loadGuestbookPreview() {
  try {
    const response = await fetch(`${BACKEND_URL}/guestbook/preview`)
    if (!response.ok) return
    const result = await response.json() as { items: PreviewItem[] }
    guestbookItems.value = result.items
  } catch {
    // The invitation and paper texture still make a complete card offline.
  }
}

onMounted(() => {
  if (!live.instagramImages.length) void live.fetchInstagram()
  void loadGuestbookPreview()
})
</script>

<template>
  <section class="py-10" aria-label="Around here lately">
    <div class="grid gap-5 lg:grid-cols-2">
      <RouterLink
        :to="{ name: 'social' }"
        class="photo-pile group relative block"
        aria-label="See recent photos on the social page"
      >
        <div
          v-for="(photo, index) in pileTiles"
          :key="photo?.key ?? `photo-placeholder-${index}`"
          class="pile-photo absolute aspect-square overflow-hidden rounded-lg bg-paper-sunk ring-1 ring-rule"
        >
          <img
            v-if="photo"
            :src="photo.url"
            :alt="photo.caption?.slice(0, 80) ?? 'Recent Instagram photo'"
            loading="lazy"
            decoding="async"
            class="size-full object-cover transition-transform duration-500 ease-out-quint group-hover:scale-105"
          />
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
          class="guestbook-mini absolute inset-0 size-full"
          :viewBox="guestbookViewBox"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <defs>
            <pattern id="home-guest-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 16 20 H 24 M 20 16 V 24" stroke="#cfc2ae" stroke-width="0.9" />
            </pattern>
          </defs>
          <rect :x="guestbookFrame.x" :y="guestbookFrame.y" :width="guestbookFrame.width" :height="guestbookFrame.height" fill="#f6f0e5" />
          <rect :x="guestbookFrame.x" :y="guestbookFrame.y" :width="guestbookFrame.width" :height="guestbookFrame.height" fill="url(#home-guest-grid)" />
          <g v-for="item in guestbookItems" :key="item.id" :transform="transform(item)">
            <polyline
              v-if="item.kind === 'drawing'"
              :points="drawingPoints(item)"
              fill="none"
              :stroke="item.color ?? '#8f3525'"
              :stroke-width="item.width ?? 4"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <g v-else-if="item.kind === 'sticky'">
              <rect :x="item.x" :y="item.y" :width="item.width ?? 180" :height="item.height ?? 150" rx="10" :fill="stickyColors[item.color ?? 'yellow'] ?? stickyColors.yellow" />
              <text :x="item.x + 16" :y="item.y + 33" :font-size="item.size ?? 18" fill="#432d20" font-family="var(--font-sans)">{{ shortText(item, 22) }}</text>
            </g>
            <text
              v-else-if="item.kind === 'text'"
              :x="item.x"
              :y="item.y + (item.size ?? 28)"
              :font-size="item.size ?? 28"
              :fill="item.color ?? '#572d24'"
              font-family="var(--font-serif)"
            >{{ shortText(item) }}</text>
            <text
              v-else-if="item.kind === 'emoji'"
              :x="item.x"
              :y="item.y"
              :font-size="item.size ?? 48"
              text-anchor="middle"
              dominant-baseline="central"
            >{{ item.emoji }}</text>
            <g v-else-if="item.kind === 'image'">
              <rect :x="item.x - 6" :y="item.y - 6" :width="(item.width ?? 140) + 12" :height="(item.height ?? 120) + 12" rx="6" fill="#fffdf7" stroke="#d8ccbb" />
              <rect :x="item.x" :y="item.y" :width="item.width ?? 140" :height="item.height ?? 120" rx="3" fill="#e8ded0" />
            </g>
          </g>
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

.photo-pile { min-height: 15rem; }
.pile-photo {
  width: min(22%, 6.5rem);
  box-shadow: var(--shadow-2);
  transition: transform 500ms var(--ease-out-quint), box-shadow 300ms ease;
}
.pile-photo:nth-child(1) { z-index: 1; left: 9%; top: 24%; transform: rotate(-10deg); }
.pile-photo:nth-child(2) { z-index: 5; left: 29%; top: 3%; transform: rotate(7deg); }
.pile-photo:nth-child(3) { z-index: 3; left: 19%; top: 14%; transform: rotate(-4deg); }
.pile-photo:nth-child(4) { z-index: 7; left: 45%; top: 22%; transform: rotate(10deg); }
.pile-photo:nth-child(5) { z-index: 4; left: 38%; top: 1%; transform: rotate(-7deg); }
.pile-photo:nth-child(6) { z-index: 6; left: 57%; top: 9%; transform: rotate(5deg); }
.pile-photo:nth-child(7) { z-index: 2; left: 66%; top: 26%; transform: rotate(-8deg); }
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
  .photo-pile:hover .pile-photo { box-shadow: var(--shadow-3); }
  .photo-pile:hover .pile-photo:nth-child(1) { transform: translate(-5px, 4px) rotate(-11deg); }
  .photo-pile:hover .pile-photo:nth-child(2) { transform: translate(-2px, -5px) rotate(7deg); }
  .photo-pile:hover .pile-photo:nth-child(3) { transform: translateY(-6px) rotate(-1deg); }
  .photo-pile:hover .pile-photo:nth-child(4) { transform: translate(3px, -4px) rotate(12deg); }
  .photo-pile:hover .pile-photo:nth-child(5) { transform: translate(5px, 4px) rotate(-8deg); }
  .photo-pile:hover .pile-photo:nth-child(6) { transform: translate(3px, -5px) rotate(12deg); }
  .photo-pile:hover .pile-photo:nth-child(7) { transform: translate(6px, 3px) rotate(-9deg); }
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
