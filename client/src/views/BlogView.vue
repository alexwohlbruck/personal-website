<script setup lang="ts">
import { computed, ref } from 'vue'
import { AnimatePresence, Motion } from 'motion-v'
import PageHeader from '@/components/layout/PageHeader.vue'
import PostRow from '@/components/post/PostRow.vue'
import { posts, postTagLabel, postTags } from '@/data/posts'
import { duration, ease, step } from '@/lib/motion'

const active = ref<string | null>(null)

const tags = computed(() => postTags())

const visible = computed(() =>
  active.value ? posts.filter((post) => post.tags.includes(active.value!)) : posts,
)

function toggle(tag: string) {
  active.value = active.value === tag ? null : tag
}
</script>

<template>
  <div class="pb-8">
    <PageHeader
      title="Writing"
      lede="Notes on maps, the web, and whatever I have been taking apart lately."
    />

    <!-- Filter --------------------------------------------------------------->
    <div v-if="tags.length" class="flex flex-wrap items-center gap-2 border-y border-rule py-4">
      <button type="button" class="chip" :class="!active && 'chip-active'" @click="active = null">
        All
        <span class="tabular opacity-60">{{ posts.length }}</span>
      </button>
      <button
        v-for="tag in tags"
        :key="tag"
        type="button"
        class="chip"
        :class="active === tag && 'chip-active'"
        :aria-pressed="active === tag"
        @click="toggle(tag)"
      >
        {{ postTagLabel(tag) }}
      </button>
    </div>

    <!-- Index ---------------------------------------------------------------->
    <ol v-if="visible.length" class="mt-2">
      <AnimatePresence mode="popLayout">
        <Motion
          v-for="(post, index) in visible"
          :key="post.slug"
          as="li"
          layout
          :initial="{ opacity: 0, y: 16, filter: 'blur(4px)' }"
          :animate="{ opacity: 1, y: 0, filter: 'blur(0px)' }"
          :exit="{ opacity: 0, filter: 'blur(4px)' }"
          :transition="{ duration: duration.base, ease, delay: step(Math.min(index, 8)) }"
        >
          <PostRow :post="post" />
        </Motion>
      </AnimatePresence>
    </ol>

    <p v-else class="border-y border-rule py-16 text-center text-sm text-ink-3">
      Nothing here yet. Come back soon.
    </p>
  </div>
</template>
