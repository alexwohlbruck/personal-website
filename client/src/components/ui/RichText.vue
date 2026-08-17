<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import ImageViewer, { type ViewerImage } from '@/components/ui/ImageViewer.vue'

/**
 * The one wrapper around compiled markdown. The plugin emits a fragment of bare
 * HTML, so everything inside is styled by element from the `.richtext` block in
 * `styles/main.css`.
 */

const props = withDefaults(
  defineProps<{
    /** Announced as the name of the image set. */
    label?: string
  }>(),
  { label: 'Image' },
)

const router = useRouter()

const root = ref<HTMLElement | null>(null)
const images = ref<ViewerImage[]>([])
const opened = ref<number | null>(null)

/**
 * The figures and images in this document, in the order they appear, so the
 * viewer's arrows walk the page rather than one image at a time.
 *
 * Read off the DOM rather than collected through a registry: markdown mixes
 * `Figure` components with bare `<img>` from `![]()` syntax, and only the
 * rendered document knows the order the two ended up in.
 */
const nodes: HTMLElement[] = []

function collect() {
  const el = root.value
  nodes.length = 0
  images.value = []
  if (!el) return

  for (const node of el.querySelectorAll<HTMLElement>('[data-lightbox], img')) {
    const framed = node.dataset.lightbox !== undefined
    // A `Figure`'s own `<img>` matches the selector too; it is already
    // represented by the figure that wraps it.
    if (!framed && node.closest('[data-lightbox]')) continue

    const img = framed ? node.querySelector('img') : (node as HTMLImageElement)
    // The full resolution original for a figure, since the page itself is
    // showing a rendition. A bare image has only the one file.
    const url = (framed ? node.dataset.full : undefined) ?? img?.currentSrc ?? img?.src
    if (!url) continue

    nodes.push(node)
    images.value.push({
      key: `${nodes.length - 1}`,
      url,
      caption: (framed ? node.dataset.caption : img?.alt) || undefined,
    })
  }
}

onMounted(collect)
// Navigating between two posts reuses this component, so the set is rebuilt
// once the new prose has rendered.
watch(
  () => root.value?.firstElementChild,
  () => void nextTick(collect),
)

function onClick(event: MouseEvent) {
  // Leave modified clicks alone: they mean "new tab", "download", "save".
  if (event.defaultPrevented || event.button !== 0) return
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

  const target = event.target as HTMLElement | null
  if (!target) return

  /**
   * A markdown link is a plain `<a>`, so an internal one would reload the whole
   * app. Catching it here means an author can write
   * `[Barrelman](/projects/barrelman)` and still get a client-side navigation,
   * without having to reach for a component to do the ordinary thing.
   */
  const anchor = target.closest('a')
  if (anchor) {
    const href = anchor.getAttribute('href')
    if (!href || anchor.target === '_blank' || anchor.hasAttribute('download')) return
    // Same-origin only, and not a bare fragment, which the browser handles better.
    if (!href.startsWith('/') || href.startsWith('//')) return

    event.preventDefault()
    void router.push(href)
    return
  }

  const node = target.closest<HTMLElement>('[data-lightbox]') ?? target.closest('img')
  if (!node) return

  const index = nodes.indexOf(node)
  if (index !== -1) opened.value = index
}
</script>

<template>
  <div ref="root" class="richtext" @click="onClick">
    <slot />
  </div>

  <ImageViewer
    :images="images"
    :index="opened"
    :label="label"
    @close="opened = null"
    @seek="opened = $event"
  />
</template>
