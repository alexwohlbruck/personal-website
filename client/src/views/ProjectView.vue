<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Motion } from 'motion-v'
import { ArrowLeft, ArrowRight, BookOpen, ExternalLink } from '@lucide/vue'
import AppButton from '@/components/ui/AppButton.vue'
import InlineIcon from '@/components/ui/InlineIcon.vue'
import ProjectTile from '@/components/project/ProjectTile.vue'
import ProjectGallery from '@/components/project/ProjectGallery.vue'
import RichText from '@/components/ui/RichText.vue'
import NotFoundView from './NotFoundView.vue'
import { adjacentProjects, findProject, projectBody } from '@/data/projects'
import { findPost } from '@/data/posts'
import { tagLabel } from '@/data/skills'
import { dateRange, duration as humanDuration } from '@/lib/format'
import { duration, ease, inView } from '@/lib/motion'
import { usePageMeta } from '@/composables/usePageMeta'

const route = useRoute()

const project = computed(() => findProject(String(route.params.name)))

usePageMeta({
  title: computed(() => project.value?.title),
  description: computed(() => project.value?.summary),
})
const body = computed(() => projectBody(String(route.params.name)))
const siblings = computed(() => adjacentProjects(String(route.params.name)))

/**
 * Resolved rather than trusted: a project can name a post that is still a
 * draft, and `findPost` leaves those out of production builds. Looking it up
 * means the button disappears with the post instead of linking nowhere.
 */
const post = computed(() => (project.value?.post ? findPost(project.value.post) : undefined))

const spec = computed(() => {
  const current = project.value
  if (!current) return []
  return [
    { term: 'Timeline', value: dateRange(current.start, current.end) },
    // Projects with no recorded end date have no knowable duration. Counting
    // from the start to today would claim they ran for years.
    ...(current.end ? [{ term: 'Duration', value: humanDuration(current.start, current.end) }] : []),
    { term: 'Screens', value: `${current.images.length}` },
  ]
})

const enter = (delay: number) => ({
  initial: { opacity: 0, y: 12, filter: 'blur(3px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  transition: { duration: duration.base, ease, delay },
})
</script>

<template>
  <NotFoundView v-if="!project" />

  <article v-else class="pb-8">
    <!-- A wash of the project's own colour, just enough to set the room. -->
    <div
      class="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[32rem]"
      :style="{
        background: `radial-gradient(70% 55% at 50% 0%, color-mix(in oklab, ${project.color} 18%, transparent), transparent 70%)`,
      }"
      aria-hidden="true"
    />

    <div class="pt-24 md:pt-28">
      <RouterLink
        :to="{ name: 'projects' }"
        class="group inline-flex items-center gap-2 text-sm text-ink-3 transition-colors hover:text-accent"
      >
        <ArrowLeft
          class="size-3.5 transition-transform duration-300 ease-out-quint group-hover:-translate-x-0.5"
        />
        All projects
      </RouterLink>
    </div>

    <!-- Masthead ------------------------------------------------------------>
    <header class="border-b border-rule pb-10 pt-8 md:pb-14">
      <!-- Keep the tile aligned to the title's first line rather than the
           full masthead when a project name wraps. -->
      <Motion v-bind="enter(0)" class="flex items-start gap-5 md:gap-6">
        <ProjectTile :project="project" :size="64" class="md:!size-[76px]" />
        <div class="min-w-0 flex-1">
          <h1 class="title text-4xl md:text-6xl">{{ project.title }}</h1>
        </div>
      </Motion>

      <Motion v-bind="enter(0.08)" class="mt-8 max-w-2xl">
        <RichText v-if="body" :label="`${project.title} image`">
          <component :is="body" />
        </RichText>
        <p v-else class="prose-body">{{ project.summary }}</p>
      </Motion>

      <Motion
        v-if="project.url || project.github || post"
        v-bind="enter(0.14)"
        class="mt-8 flex flex-wrap gap-3"
      >
        <AppButton v-if="project.url" variant="accent" :href="project.url">
          Visit site
          <ExternalLink class="size-4" />
        </AppButton>
        <AppButton v-if="project.github" :href="project.github">
          <InlineIcon name="github" :size="15" />
          Source
        </AppButton>
        <!-- Only rendered once the post exists and is published, so a draft
             never leaves a dead button on the page. -->
        <AppButton v-if="post" :to="{ name: 'post', params: { slug: post.slug } }">
          <BookOpen class="size-4" />
          Read the post
        </AppButton>
      </Motion>
    </header>

    <!-- Spec sheet ---------------------------------------------------------->
    <Motion
      as="dl"
      v-bind="enter(0.18)"
      class="grid divide-rule border-b border-rule md:divide-x"
      :style="{ gridTemplateColumns: `repeat(${spec.length}, minmax(0, 1fr))` }"
    >
      <div v-for="item in spec" :key="item.term" class="px-1 py-5 md:px-5 md:first:pl-0">
        <dt class="text-sm text-ink-3">{{ item.term }}</dt>
        <dd class="tabular mt-2 text-sm">{{ item.value }}</dd>
      </div>
    </Motion>

    <Motion as="ul" v-bind="enter(0.22)" class="flex flex-wrap gap-1.5 border-b border-rule py-6">
      <li v-for="tag in project.tags" :key="tag" class="chip">{{ tagLabel(tag) }}</li>
    </Motion>

    <!-- Gallery -------------------------------------------------------------->
    <section v-if="project.images.length" class="py-12">
      <div class="mb-6 flex items-baseline justify-between gap-4 border-b border-rule pb-4">
        <h2 class="title text-2xl">Screens</h2>
        <p class="text-sm text-ink-3">Click any image to open it full size</p>
      </div>

      <ProjectGallery :project="project" />
    </section>

    <!-- Prev / next ---------------------------------------------------------->
    <Motion
      as="nav"
      :initial="{ opacity: 0, y: 16 }"
      :while-in-view="{ opacity: 1, y: 0 }"
      :in-view-options="inView"
      :transition="{ duration: duration.base, ease }"
      class="grid gap-3 border-t border-rule pt-8 sm:grid-cols-2"
    >
      <RouterLink
        v-if="siblings.previous"
        :to="{ name: 'project', params: { name: siblings.previous.name } }"
        class="card group flex items-center gap-4 p-4 transition-shadow duration-300 hover:shadow-e2"
      >
        <ArrowLeft
          class="size-4 shrink-0 text-ink-3 transition-transform duration-300 ease-out-quint group-hover:-translate-x-1"
        />
        <ProjectTile :project="siblings.previous" :size="40" />
        <span class="min-w-0">
          <span class="block text-sm text-ink-3">Previous</span>
          <span class="title block truncate text-lg">{{ siblings.previous.title }}</span>
        </span>
      </RouterLink>

      <RouterLink
        v-if="siblings.next"
        :to="{ name: 'project', params: { name: siblings.next.name } }"
        class="card group flex items-center gap-4 p-4 text-right transition-shadow duration-300 hover:shadow-e2 sm:flex-row-reverse"
      >
        <ArrowRight
          class="size-4 shrink-0 text-ink-3 transition-transform duration-300 ease-out-quint group-hover:translate-x-1"
        />
        <ProjectTile :project="siblings.next" :size="40" />
        <span class="min-w-0 flex-1 text-left sm:text-right">
          <span class="block text-sm text-ink-3">Next</span>
          <span class="title block truncate text-lg">{{ siblings.next.title }}</span>
        </span>
      </RouterLink>
    </Motion>
  </article>
</template>
