<script setup lang="ts">
import { computed, ref } from 'vue'
import { Motion } from 'motion-v'
import { useMediaQuery } from '@vueuse/core'
import { Expand } from '@lucide/vue'
import { useLightbox, type LightboxItem } from '@/composables/useLightbox'
import { projectImage, projectImageSize } from '@/lib/assets'
import { duration, ease, inView, step } from '@/lib/motion'
import type { Project } from '@/data/types'

const props = defineProps<{ project: Project }>()

/** "bike-parking-mobile.png" → "Bike parking mobile" */
function caption(file: string) {
  const stem = file.replace(/\.[a-z0-9]+$/i, '').replace(/[-_]/g, ' ')
  return stem.charAt(0).toUpperCase() + stem.slice(1)
}

const gallery = ref<HTMLElement | null>(null)

const items = computed<LightboxItem[]>(() =>
  props.project.images.map((file) => {
    const { width, height } = projectImageSize(props.project.name, file)
    return {
      src: projectImage(props.project.name, file),
      width,
      height,
      alt: `${props.project.title}: ${caption(file)}`,
    }
  }),
)

const wide = useMediaQuery('(min-width: 1024px)')
const medium = useMediaQuery('(min-width: 640px)')
const columnCount = computed(() => (wide.value ? 3 : medium.value ? 2 : 1))

/**
 * Masonry, laid out by hand.
 *
 * CSS columns fill top to bottom before moving right, so image 2 landed under
 * image 1 instead of beside it. Native masonry (`grid-template-rows: masonry`,
 * `item-flow`) is still not in any stable browser, so the columns are built
 * here instead: walk the images in order and drop each one into whichever
 * column is currently shortest. Every column is the same width, so an image's
 * relative height is just its aspect ratio, which the generated size manifest
 * already gives us. No measuring, no layout thrash, no shift on load.
 */
const columns = computed(() => {
  const buckets: { index: number; item: LightboxItem }[][] = Array.from(
    { length: columnCount.value },
    () => [],
  )
  const heights = new Array(columnCount.value).fill(0)

  items.value.forEach((item, index) => {
    let shortest = 0
    for (let i = 1; i < heights.length; i++) {
      if (heights[i]! < heights[shortest]!) shortest = i
    }
    buckets[shortest]!.push({ index, item })
    heights[shortest] += item.height / item.width
  })

  return buckets
})

const { open } = useLightbox(gallery, items)
</script>

<template>
  <div ref="gallery" class="flex items-start gap-4">
    <div v-for="(column, columnIndex) in columns" :key="columnIndex" class="flex-1 space-y-4">
      <Motion
        v-for="{ index, item } in column"
        :key="item.src"
        as="button"
        type="button"
        :data-pswp-index="index"
        :initial="{ opacity: 0, y: 14, filter: 'blur(4px)' }"
        :while-in-view="{ opacity: 1, y: 0, filter: 'blur(0px)' }"
        :in-view-options="inView"
        :transition="{ duration: duration.base, ease, delay: step(columnIndex) }"
        :aria-label="`Open ${item.alt}`"
        class="group relative block w-full overflow-hidden rounded-xl ring-1 ring-rule transition-shadow duration-300 ease-out-quint hover:shadow-e3"
        :style="{ backgroundColor: project.color }"
        @click="open(index)"
      >
        <img
          :src="item.src"
          :width="item.width"
          :height="item.height"
          :alt="item.alt"
          loading="lazy"
          decoding="async"
          class="w-full transition-transform duration-500 ease-out-quint group-hover:scale-[1.015]"
        />

        <span
          class="pointer-events-none absolute inset-0 flex items-end justify-between gap-2 p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style="background: linear-gradient(to top, oklch(0% 0 0 / 0.55), transparent 45%)"
        >
          <span class="truncate text-xs" style="color: oklch(98% 0 0)">
            {{ caption(project.images[index]!) }}
          </span>
          <Expand class="size-4 shrink-0" style="color: oklch(98% 0 0)" />
        </span>
      </Motion>
    </div>
  </div>
</template>
