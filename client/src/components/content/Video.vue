<script setup lang="ts">
import { computed } from 'vue'
import { postVideo } from '@/lib/assets'

/**
 * A short clip dropped into a post, from `assets/posts/<post>/`.
 *
 * It waits for a click rather than autoplaying, and only fetches enough up
 * front to show the first frame, so a couple of phone videos don't cost a
 * reader megabytes before they've scrolled to them.
 */
const props = withDefaults(
  defineProps<{
    post: string
    file: string
    title: string
    caption?: string
    /** `width / height`, as a CSS aspect ratio. */
    ratio?: string
  }>(),
  { ratio: '16 / 9' },
)

/** `#t` makes Safari paint the first frame instead of a black box. */
const src = computed(() => `${postVideo(props.post, props.file)}#t=0.1`)

/** Portrait clips are bounded by height, the same as a tall `Figure`. */
const MAX_TALL_HEIGHT = 620

const frameWidth = computed(() => {
  const [width, height] = props.ratio.split('/').map(Number)
  if (!width || !height || height <= width) return undefined
  return Math.round(MAX_TALL_HEIGHT * (width / height))
})
</script>

<template>
  <figure>
    <div class="card overflow-hidden" :style="frameWidth ? { maxWidth: `${frameWidth}px` } : undefined">
      <video
        :src="src"
        :title="title"
        :style="{ aspectRatio: ratio }"
        class="block w-full bg-black"
        controls
        playsinline
        preload="metadata"
      />
    </div>

    <figcaption v-if="caption" class="mt-3 text-sm text-ink-3">{{ caption }}</figcaption>
  </figure>
</template>
