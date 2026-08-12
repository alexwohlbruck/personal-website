<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { ImageSource } from '@/lib/assets'

const props = withDefaults(
  defineProps<{
    image: ImageSource
    alt: string
    /** Tells the browser the slot width so it can pick a rendition. */
    sizes?: string
    /** Classes for the `<img>` itself, e.g. object-fit and cropping. */
    imgClass?: string
    /** Reserve space from the image's own proportions. Off when the frame crops. */
    ratio?: boolean
    eager?: boolean
  }>(),
  { ratio: false, eager: false },
)

const el = ref<HTMLImageElement | null>(null)
const loaded = ref(false)

onMounted(() => {
  // A cached image can finish before Vue attaches the listener, in which case
  // the load event never arrives and the placeholder would sit there forever.
  if (el.value?.complete && el.value.naturalWidth > 0) loaded.value = true
})
</script>

<template>
  <span
    class="relative block overflow-hidden"
    :style="ratio ? { aspectRatio: `${image.width} / ${image.height}` } : undefined"
  >
    <!--
      The blur-up. A 16px WebP inlined in the manifest, scaled up and blurred,
      so the frame holds a rough impression of the picture from the first paint
      instead of an empty box. It is removed once the real image is decoded.
    -->
    <span
      v-if="image.lqip && !loaded"
      aria-hidden="true"
      class="absolute inset-0 scale-110 bg-cover bg-center blur-xl"
      :style="{ backgroundImage: `url(${image.lqip})` }"
    />

    <img
      ref="el"
      :src="image.src"
      :srcset="image.srcset"
      :sizes="image.srcset ? sizes : undefined"
      :width="image.width"
      :height="image.height"
      :alt="alt"
      :loading="eager ? 'eager' : 'lazy'"
      decoding="async"
      class="relative transition-opacity duration-500 ease-out-quint motion-reduce:transition-none"
      :class="[imgClass, loaded ? 'opacity-100' : 'opacity-0']"
      @load="loaded = true"
    />
  </span>
</template>
