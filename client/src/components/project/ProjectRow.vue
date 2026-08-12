<script setup lang="ts">
import { computed } from 'vue'
import { ArrowUpRight } from '@lucide/vue'
import ProjectTile from './ProjectTile.vue'
import ProgressiveImage from '@/components/ui/ProgressiveImage.vue'
import { projectImageSet } from '@/lib/assets'
import { dateRange } from '@/lib/format'
import { distinctiveTags, tagFrequency } from '@/data/skills'
import { projectCover, projects, projectSummary } from '@/data/projects'
import type { Project } from '@/data/types'

const props = defineProps<{ project: Project }>()

const frequency = tagFrequency(projects.map((p) => p.tags))

const coverImage = computed(() => projectCover(props.project))
const cover = computed(() => projectImageSet(props.project.name, coverImage.value.file))
const topTags = computed(() => distinctiveTags(props.project.tags, frequency))
const period = computed(() => dateRange(props.project.start, props.project.end))
const summary = computed(() => projectSummary(props.project))
</script>

<template>
  <RouterLink
    :to="{ name: 'project', params: { name: project.name } }"
    class="group relative flex items-start gap-4 border-b border-rule py-5 md:grid md:grid-cols-[auto_1fr_auto_10.5rem] md:items-center md:gap-6 md:py-6"
  >
    <!-- Hover wash bleeds past the text column so the row reads as one target. -->
    <span
      class="pointer-events-none absolute -inset-x-4 inset-y-0 -z-10 rounded-lg bg-accent-wash opacity-0 transition-opacity duration-200 group-hover:opacity-100"
    />

    <span class="shrink-0 transition-transform duration-300 ease-out-quint group-hover:-translate-y-0.5">
      <ProjectTile :project="project" :size="48" />
    </span>

    <div class="min-w-0 flex-1">
      <div class="md:hidden">
        <time class="label whitespace-nowrap text-ink-3 md:hidden">{{ period }}</time>
      </div>
      <h3 class="title text-2xl md:text-[1.75rem]">{{ project.title }}</h3>
      <p class="mt-2 line-clamp-2 text-sm text-ink-3 md:line-clamp-1">{{ summary }}</p>
      <ul class="mt-3 flex flex-wrap gap-1.5 md:hidden">
        <li v-for="tag in topTags" :key="tag" class="chip">{{ tag }}</li>
      </ul>
    </div>

    <!-- Cover peek: quiet at rest, wakes up under the cursor. -->
    <span
      v-if="cover.src"
      class="relative hidden h-[3.25rem] w-[5.5rem] overflow-hidden rounded-md ring-1 ring-rule transition-all duration-300 ease-out-quint group-hover:-translate-y-0.5 group-hover:shadow-e2 lg:block"
    >
      <ProgressiveImage
        :image="cover"
        alt=""
        sizes="88px"
        class="h-full w-full opacity-70 saturate-[0.6] transition-all duration-300 ease-out-quint group-hover:scale-[1.04] group-hover:opacity-100 group-hover:saturate-100"
        :img-class="`h-full w-full object-cover ${coverImage.position}`"
      />
    </span>

    <!-- Fixed width keeps the thumbnails in a straight column down the list. -->
    <div class="hidden items-center justify-end gap-6 md:flex">
      <time class="label whitespace-nowrap text-ink-3">{{ period }}</time>
      <ArrowUpRight
        class="size-4 shrink-0 text-ink-3 transition-all duration-300 ease-out-quint group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent"
      />
    </div>
  </RouterLink>
</template>
