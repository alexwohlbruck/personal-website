<script setup lang="ts">
/**
 * A live demo or a video, held in its own aspect ratio so the page does not
 * reflow when the frame finishes loading.
 */
withDefaults(
  defineProps<{
    src: string
    title: string
    /** `width / height`, as a CSS aspect ratio. */
    ratio?: string
  }>(),
  { ratio: '16 / 9' },
)
</script>

<template>
  <figure class="card overflow-hidden">
    <iframe
      :src="src"
      :title="title"
      :style="{ aspectRatio: ratio }"
      class="block w-full border-0"
      loading="lazy"
      allowfullscreen
    />
  </figure>
</template>
