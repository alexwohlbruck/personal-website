<script setup lang="ts">
import { computed, ref } from 'vue'
import { Motion } from 'motion-v'
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

const { open } = useLightbox(gallery, items)
</script>

<template>
  <div ref="gallery" class="columns-1 gap-4 sm:columns-2 lg:columns-3 [&>*]:mb-4">
    <Motion
      v-for="(item, index) in items"
      :key="item.src"
      as="button"
      type="button"
      :data-pswp-index="index"
      :initial="{ opacity: 0, y: 14, filter: 'blur(4px)' }"
      :while-in-view="{ opacity: 1, y: 0, filter: 'blur(0px)' }"
      :in-view-options="inView"
      :transition="{ duration: duration.base, ease, delay: step(index % 3) }"
      :aria-label="`Open ${item.alt}`"
      class="group relative block w-full break-inside-avoid overflow-hidden rounded-xl ring-1 ring-rule transition-shadow duration-300 ease-out-quint hover:shadow-e3"
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
        style="
          background: linear-gradient(to top, oklch(0% 0 0 / 0.55), transparent 45%);
        "
      >
        <span class="truncate text-xs" style="color: oklch(98% 0 0)">{{
          caption(project.images[index]!)
        }}</span>
        <Expand class="size-4 shrink-0" style="color: oklch(98% 0 0)" />
      </span>
    </Motion>
  </div>
</template>
