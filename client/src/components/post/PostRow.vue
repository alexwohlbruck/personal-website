<script setup lang="ts">
import { ArrowUpRight } from '@lucide/vue'
import { postDate, type Post } from '@/data/posts'

withDefaults(
  defineProps<{
    post: Post
    /** Tighter row, for lists that sit inside another page's section. */
    compact?: boolean
    /** Heading level, so each list stays inside its page's outline. */
    heading?: string
    /** Off where the surrounding page already names the run. */
    showSeries?: boolean
  }>(),
  { compact: false, heading: 'h2', showSeries: true },
)
</script>

<template>
  <RouterLink
    :to="{ name: 'post', params: { slug: post.slug } }"
    class="group flex flex-col border-b border-rule md:flex-row md:items-baseline md:gap-8"
    :class="compact ? 'gap-1 py-5' : 'gap-2 py-7'"
  >
    <time
      :datetime="post.date.toISOString().slice(0, 10)"
      class="label shrink-0 text-ink-3 md:w-32 md:pt-1"
    >
      {{ postDate(post.date) }}
    </time>

    <div class="min-w-0 flex-1">
      <!-- Entries in a run say so here rather than being grouped, so a list
           stays in date order however it is filtered. -->
      <p v-if="showSeries && post.series" class="label mb-1.5 text-accent">
        {{ post.series }}
        <template v-if="post.part"> · Part {{ post.part }}</template>
      </p>

      <component
        :is="heading"
        class="title flex items-start gap-2 transition-colors group-hover:text-accent"
        :class="compact ? 'text-xl' : 'text-2xl'"
      >
        <span class="min-w-0">{{ post.title }}</span>
        <!-- Drafts are only ever rendered by a dev build. -->
        <span v-if="post.draft" class="chip mt-1 shrink-0">Draft</span>
        <ArrowUpRight
          class="size-4 shrink-0 text-ink-3 transition-transform duration-300 ease-out-quint group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          :class="compact ? 'mt-1' : 'mt-1.5'"
        />
      </component>

      <p
        v-if="post.summary"
        class="max-w-2xl text-sm text-ink-3"
        :class="compact ? 'mt-1.5' : 'mt-2'"
      >
        {{ post.summary }}
      </p>
    </div>
  </RouterLink>
</template>
