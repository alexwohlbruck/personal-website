<script setup lang="ts">
import { computed, ref } from 'vue'
import { Motion } from 'motion-v'
import { useMediaQuery } from '@vueuse/core'
import { Expand } from '@lucide/vue'
import ImageViewer, { type ViewerImage } from '@/components/ui/ImageViewer.vue'
import ProgressiveImage from '@/components/ui/ProgressiveImage.vue'
import { projectImage, projectImageSet } from '@/lib/assets'
import { duration, ease, inView, step } from '@/lib/motion'
import type { Project } from '@/data/types'

const props = defineProps<{ project: Project }>()

/** "bike-parking-mobile.png" → "Bike parking mobile" */
function caption(file: string) {
  const stem = file.replace(/\.[a-z0-9]+$/i, '').replace(/[-_]/g, ' ')
  return stem.charAt(0).toUpperCase() + stem.slice(1)
}

const opened = ref<number | null>(null)

/** Renditions for the grid: intrinsic size, srcset and the blur-up. */
const thumbs = computed(() =>
  props.project.images.map((file) => projectImageSet(props.project.name, file)),
)

const viewerImages = computed<ViewerImage[]>(() =>
  props.project.images.map((file, index) => ({
    key: file,
    // Full resolution here on purpose: this is the one place it is warranted.
    url: projectImage(props.project.name, file),
    caption: `${props.project.title}: ${caption(file)}`,
    // The same 16px preview the grid uses, so the frame is never empty while
    // the original decodes.
    placeholder: thumbs.value[index]?.lqip,
  })),
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
  const buckets: number[][] = Array.from({ length: columnCount.value }, () => [])
  const heights = new Array(columnCount.value).fill(0)

  thumbs.value.forEach((image, index) => {
    let shortest = 0
    for (let i = 1; i < heights.length; i++) {
      if (heights[i]! < heights[shortest]!) shortest = i
    }
    buckets[shortest]!.push(index)
    heights[shortest] += image.height / image.width
  })

  return buckets
})
</script>

<template>
  <div class="flex items-start gap-4">
    <div v-for="(column, columnIndex) in columns" :key="columnIndex" class="flex-1 space-y-4">
      <Motion
        v-for="index in column"
        :key="project.images[index]"
        as="button"
        type="button"
        :initial="{ opacity: 0, y: 14, filter: 'blur(4px)' }"
        :while-in-view="{ opacity: 1, y: 0, filter: 'blur(0px)' }"
        :in-view-options="inView"
        :transition="{ duration: duration.base, ease, delay: step(columnIndex) }"
        :aria-label="`Open ${caption(project.images[index]!)}`"
        class="group relative block w-full overflow-hidden rounded-xl ring-1 ring-rule transition-shadow duration-300 ease-out-quint hover:shadow-e3"
        :style="{ backgroundColor: project.color }"
        @click="opened = index"
      >
        <ProgressiveImage
          :image="thumbs[index]!"
          :alt="`${project.title}: ${caption(project.images[index]!)}`"
          ratio
          sizes="(min-width: 1024px) 22rem, (min-width: 640px) 45vw, 92vw"
          class="w-full transition-transform duration-500 ease-out-quint group-hover:scale-[1.015]"
          img-class="w-full"
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

    <ImageViewer
      :images="viewerImages"
      :index="opened"
      :label="`${project.title} screenshot`"
      @close="opened = null"
      @seek="opened = $event"
    />
  </div>
</template>
