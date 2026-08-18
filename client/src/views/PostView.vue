<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Motion } from 'motion-v'
import { ArrowLeft, ArrowRight } from '@lucide/vue'
import RichText from '@/components/ui/RichText.vue'
import NotFoundView from './NotFoundView.vue'
import {
  adjacentPosts,
  findPost,
  postDate,
  postTagLabel,
  seriesPosition,
  tagProject,
} from '@/data/posts'
import { duration, ease, inView } from '@/lib/motion'
import { usePageMeta } from '@/composables/usePageMeta'

const route = useRoute()

const post = computed(() => findPost(String(route.params.slug)))
const siblings = computed(() => adjacentPosts(String(route.params.slug)))
const position = computed(() => (post.value ? seriesPosition(post.value) : undefined))

usePageMeta({
  title: computed(() => post.value?.title),
  description: computed(() => post.value?.summary),
  type: 'article',
  published: computed(() => post.value?.date.toISOString()),
})

const enter = (delay: number) => ({
  initial: { opacity: 0, y: 12, filter: 'blur(3px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  transition: { duration: duration.base, ease, delay },
})
</script>

<template>
  <NotFoundView v-if="!post" />

  <article v-else class="pb-8">
    <div class="pt-24 md:pt-28">
      <RouterLink
        :to="{ name: 'blog' }"
        class="group inline-flex items-center gap-2 text-sm text-ink-3 transition-colors hover:text-accent"
      >
        <ArrowLeft
          class="size-3.5 transition-transform duration-300 ease-out-quint group-hover:-translate-x-0.5"
        />
        All writing
      </RouterLink>
    </div>

    <!-- Masthead ------------------------------------------------------------->
    <header class="border-b border-rule pb-8 pt-8 md:pb-10">
      <Motion v-if="position" v-bind="enter(0)" class="mb-3 flex items-center gap-2">
        <span class="label text-accent">{{ position.series }}</span>
        <span class="text-rule-strong" aria-hidden="true">·</span>
        <span class="label text-ink-3">Part {{ position.part }} of {{ position.total }}</span>
      </Motion>

      <Motion v-bind="enter(position ? 0.04 : 0)" class="max-w-3xl">
        <h1 class="title text-4xl md:text-5xl">{{ post.title }}</h1>
      </Motion>

      <Motion v-bind="enter(0.06)" class="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2">
        <time :datetime="post.date.toISOString().slice(0, 10)" class="label text-ink-3">
          {{ postDate(post.date) }}
        </time>
        <span v-if="post.tags.length" class="text-rule-strong" aria-hidden="true">·</span>
        <ul v-if="post.tags.length" class="flex flex-wrap gap-1.5">
          <li v-for="tag in post.tags" :key="tag">
            <!-- A tag naming a project links to it; the rest are plain labels. -->
            <RouterLink
              v-if="tagProject(tag)"
              :to="{ name: 'project', params: { name: tag } }"
              class="chip chip-active transition-colors hover:text-accent-hover"
            >
              {{ postTagLabel(tag) }}
            </RouterLink>
            <span v-else class="chip">{{ tag }}</span>
          </li>
        </ul>
      </Motion>
    </header>

    <!-- Series contents ------------------------------------------------------
         Above the prose rather than below it: a reader arriving at part three
         wants the map of the run before the text, not after it. -->
    <Motion
      v-if="position && position.total > 1"
      as="section"
      v-bind="enter(0.1)"
      class="max-w-2xl pt-8"
    >
      <h2 class="label text-ink-3">In this series</h2>
      <ol class="mt-4">
        <li v-for="(entry, index) in position.entries" :key="entry.slug">
          <!-- The current post stays in the list, unlinked, so the reader can
               see where they are rather than losing their place. -->
          <span
            v-if="entry.slug === post.slug"
            class="flex gap-3 border-b border-rule py-3"
            aria-current="true"
          >
            <span class="tabular shrink-0 text-sm text-accent">{{ index + 1 }}</span>
            <span class="min-w-0 flex-1">
              <span class="flex items-baseline gap-3">
                <span class="min-w-0 flex-1 text-ink">{{ entry.title }}</span>
                <span class="label shrink-0 text-ink-3">You are here</span>
              </span>
              <span v-if="entry.summary" class="mt-1 block text-sm text-ink-3">
                {{ entry.summary }}
              </span>
            </span>
          </span>
          <RouterLink
            v-else
            :to="{ name: 'post', params: { slug: entry.slug } }"
            class="group flex gap-3 border-b border-rule py-3"
          >
            <span class="tabular shrink-0 text-sm text-ink-3">{{ index + 1 }}</span>
            <span class="min-w-0 flex-1">
              <span class="block transition-colors group-hover:text-accent">
                {{ entry.title }}
              </span>
              <span v-if="entry.summary" class="mt-1 block text-sm text-ink-3">
                {{ entry.summary }}
              </span>
            </span>
          </RouterLink>
        </li>
      </ol>
    </Motion>

    <!-- Body ----------------------------------------------------------------->
    <Motion v-bind="enter(0.12)" class="max-w-2xl py-10 md:py-14">
      <RichText :label="`${post.title} image`">
        <component :is="post.body" />
      </RichText>
    </Motion>

    <!-- Prev / next ---------------------------------------------------------->
    <Motion
      v-if="siblings.previous || siblings.next"
      as="nav"
      :initial="{ opacity: 0, y: 16 }"
      :while-in-view="{ opacity: 1, y: 0 }"
      :in-view-options="inView"
      :transition="{ duration: duration.base, ease }"
      class="grid gap-3 border-t border-rule pt-8 sm:grid-cols-2"
    >
      <RouterLink
        v-if="siblings.previous"
        :to="{ name: 'post', params: { slug: siblings.previous.slug } }"
        class="card group flex items-center gap-4 p-4 transition-shadow duration-300 hover:shadow-e2"
      >
        <ArrowLeft
          class="size-4 shrink-0 text-ink-3 transition-transform duration-300 ease-out-quint group-hover:-translate-x-1"
        />
        <span class="min-w-0">
          <span class="block text-sm text-ink-3">Previous</span>
          <span class="title block truncate text-lg">{{ siblings.previous.title }}</span>
        </span>
      </RouterLink>

      <RouterLink
        v-if="siblings.next"
        :to="{ name: 'post', params: { slug: siblings.next.slug } }"
        class="card group flex items-center gap-4 p-4 text-right transition-shadow duration-300 hover:shadow-e2 sm:col-start-2 sm:flex-row-reverse"
      >
        <ArrowRight
          class="size-4 shrink-0 text-ink-3 transition-transform duration-300 ease-out-quint group-hover:translate-x-1"
        />
        <span class="min-w-0 flex-1 text-left sm:text-right">
          <span class="block text-sm text-ink-3">Next</span>
          <span class="title block truncate text-lg">{{ siblings.next.title }}</span>
        </span>
      </RouterLink>
    </Motion>
  </article>
</template>
