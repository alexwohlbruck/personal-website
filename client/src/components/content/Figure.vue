<script setup lang="ts">
import { computed } from 'vue'
import { Expand } from '@lucide/vue'
import ProgressiveImage from '@/components/ui/ProgressiveImage.vue'
import { postImage, postImageSet, projectImage, projectImageSet } from '@/lib/assets'

/**
 * A screenshot dropped into the middle of a write-up.
 *
 * Takes a `project` or `post` plus a filename rather than a URL, so a figure
 * gets the generated WebP renditions and the blur-up for free and there is
 * still only one place a screenshot is named.
 *
 * Clicking one opens the lightbox. `RichText` owns the viewer and finds these
 * by their `data-lightbox` attribute, so every figure in a document belongs to
 * the same set and the arrows walk the page.
 */
const props = withDefaults(
  defineProps<{
    /** Slug from `data/projects.ts`; the file lives in `assets/portfolio/<project>/`. */
    project?: string
    /** Post slug; the file lives in `assets/posts/<post>/`. */
    post?: string
    file: string
    alt: string
    caption?: string
    /** Let the image run past the prose column, as the gallery does. */
    wide?: boolean
  }>(),
  { wide: false },
)

const image = computed(() =>
  props.post ? postImageSet(props.post, props.file) : projectImageSet(props.project ?? '', props.file),
)

/** Full resolution, for the lightbox. The page itself only ever shows a rendition. */
const original = computed(() =>
  props.post ? postImage(props.post, props.file) : projectImage(props.project ?? '', props.file),
)
</script>

<template>
  <figure :class="wide ? 'md:-mx-12 lg:-mx-20' : undefined">
    <button
      type="button"
      data-lightbox
      :data-full="original"
      :data-caption="caption || alt"
      :aria-label="`Open ${alt} full size`"
      class="card group relative block w-full cursor-zoom-in overflow-hidden transition-shadow duration-300 ease-out-quint hover:shadow-e3"
    >
      <ProgressiveImage
        :image="image"
        :alt="alt"
        ratio
        sizes="(min-width: 768px) 42rem, 100vw"
        class="w-full transition-transform duration-500 ease-out-quint group-hover:scale-[1.01]"
        img-class="w-full"
      />

      <span
        class="pointer-events-none absolute inset-0 flex items-end justify-end p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style="background: linear-gradient(to top, oklch(0% 0 0 / 0.4), transparent 35%)"
      >
        <Expand class="size-4" style="color: oklch(98% 0 0)" />
      </span>
    </button>

    <figcaption v-if="caption" class="mt-3 text-sm text-ink-3">{{ caption }}</figcaption>
  </figure>
</template>
