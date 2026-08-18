<script setup lang="ts">
import { computed, ref } from 'vue'
import { AnimatePresence, Motion } from 'motion-v'
import { ArrowUpRight } from '@lucide/vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import { posts, postDate, postTagLabel, postTags } from '@/data/posts'
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
          <RouterLink
            :to="{ name: 'post', params: { slug: post.slug } }"
            class="group flex flex-col gap-2 border-b border-rule py-7 md:flex-row md:items-baseline md:gap-8"
          >
            <time
              :datetime="post.date.toISOString().slice(0, 10)"
              class="label shrink-0 text-ink-3 md:w-32 md:pt-1"
            >
              {{ postDate(post.date) }}
            </time>

            <div class="min-w-0 flex-1">
              <!-- Entries in a run say so here rather than being grouped, so
                   the index stays one list in date order however it is filtered. -->
              <p v-if="post.series" class="label mb-1.5 text-accent">
                {{ post.series }}
                <template v-if="post.part"> · Part {{ post.part }}</template>
              </p>
              <h2 class="title flex items-start gap-2 text-2xl transition-colors group-hover:text-accent">
                <span class="min-w-0">{{ post.title }}</span>
                <!-- Drafts are only ever rendered by a dev build. -->
                <span v-if="post.draft" class="chip mt-1 shrink-0">Draft</span>
                <ArrowUpRight
                  class="mt-1.5 size-4 shrink-0 text-ink-3 transition-transform duration-300 ease-out-quint group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </h2>
              <p v-if="post.summary" class="mt-2 max-w-2xl text-sm text-ink-3">
                {{ post.summary }}
              </p>
            </div>
          </RouterLink>
        </Motion>
      </AnimatePresence>
    </ol>

    <p v-else class="border-y border-rule py-16 text-center text-sm text-ink-3">
      Nothing here yet. Come back soon.
    </p>
  </div>
</template>
