<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { Motion } from 'motion-v'
import InlineIcon from '@/components/ui/InlineIcon.vue'
import { useLiveStore } from '@/stores/live'
import { links } from '@/data/site'
import { duration, ease, inView, step } from '@/lib/motion'

const live = useLiveStore()
onMounted(() => void live.fetchInstagram())

const posts = computed(() => live.instagram.slice(0, 10))
</script>

<template>
  <div>
    <div class="mb-5 flex items-baseline justify-between gap-4">
      <p class="text-sm text-ink-3">What I've been pointing a camera at.</p>
      <a
        :href="links.instagram"
        target="_blank"
        rel="noopener noreferrer"
        class="flex shrink-0 items-center gap-1.5 text-xs text-ink-3 transition-colors hover:text-accent"
      >
        <InlineIcon name="instagram" :size="14" />
        Instagram
      </a>
    </div>

    <div v-if="live.instagramStatus === 'loading'" class="grid grid-cols-3 gap-2 sm:grid-cols-5">
      <div v-for="i in 5" :key="i" class="aspect-square animate-pulse rounded-lg bg-paper-sunk" />
    </div>

    <p v-else-if="!posts.length" class="text-sm text-ink-3">
      Photos aren't loading right now. See them on
      <a :href="links.instagram" target="_blank" rel="noopener noreferrer" class="link"
        >Instagram</a
      >.
    </p>

    <div v-else class="grid grid-cols-3 gap-2 sm:grid-cols-5">
      <Motion
        v-for="(post, index) in posts"
        :key="post.id ?? index"
        as="a"
        :href="post.permalink"
        target="_blank"
        rel="noopener noreferrer"
        :initial="{ opacity: 0, scale: 0.94, filter: 'blur(4px)' }"
        :while-in-view="{ opacity: 1, scale: 1, filter: 'blur(0px)' }"
        :in-view-options="inView"
        :transition="{ duration: duration.base, ease, delay: step(index) }"
        class="group relative aspect-square overflow-hidden rounded-lg ring-1 ring-rule transition-shadow duration-300 hover:z-10 hover:shadow-e3"
      >
        <img
          :src="post.media_url"
          :alt="post.caption?.slice(0, 80) ?? 'Instagram photo'"
          loading="lazy"
          decoding="async"
          class="h-full w-full object-cover transition-transform duration-500 ease-out-quint group-hover:scale-105"
        />
      </Motion>
    </div>
  </div>
</template>
