<script setup lang="ts">
import { computed } from 'vue'
import { ArrowUpRight } from '@lucide/vue'
import TiltCard from '@/components/ui/TiltCard.vue'
import ProjectTile from './ProjectTile.vue'
import ProgressiveImage from '@/components/ui/ProgressiveImage.vue'
import { projectImageSet } from '@/lib/assets'
import { projectCover, projectSummary } from '@/data/projects'
import { dateRange } from '@/lib/format'
import type { Project } from '@/data/types'

const props = defineProps<{ project: Project }>()

const coverImage = computed(() => projectCover(props.project))
const summary = computed(() => projectSummary(props.project))
const cover = computed(() => projectImageSet(props.project.name, coverImage.value.file))
</script>

<template>
  <TiltCard :max="7" class="h-full">
    <RouterLink
      :to="{ name: 'project', params: { name: project.name } }"
      class="card group flex h-full flex-col overflow-hidden transition-shadow duration-300 ease-out-quint hover:shadow-e3"
    >
      <!-- Screenshot sits in a tinted well, cropped to the top so UI reads. -->
      <div
        class="relative aspect-[16/10] overflow-hidden border-b border-rule"
        :style="{ backgroundColor: project.color }"
      >
        <ProgressiveImage
          v-if="cover.src"
          :image="cover"
          :alt="`${project.title} preview`"
          sizes="(min-width: 1024px) 22rem, (min-width: 768px) 45vw, 92vw"
          class="h-full w-full transition-transform duration-500 ease-out-quint group-hover:scale-[1.03]"
          :img-class="`h-full w-full object-cover ${coverImage.position}`"
        />
        <span
          class="pointer-events-none absolute inset-0"
          style="background: linear-gradient(to bottom, oklch(100% 0 0 / 0.1), transparent 30%)"
        />
      </div>

      <div class="flex flex-1 items-start gap-4 p-5">
        <ProjectTile :project="project" :size="40" />
        <!-- Title on its own line: Exposure is wide enough that sharing a row
             with the date wrapped "Parchment Maps" onto two lines. -->
        <div class="min-w-0 flex-1">
          <h3 class="title text-xl">{{ project.title }}</h3>
          <time class="label mt-1.5 block text-ink-3">
            {{ dateRange(project.start, project.end) }}
          </time>
          <p class="mt-2.5 line-clamp-2 text-sm leading-relaxed text-ink-3">
            {{ summary }}
          </p>
        </div>
        <ArrowUpRight
          class="mt-1 size-4 shrink-0 text-ink-3 transition-all duration-300 ease-out-quint group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent"
        />
      </div>
    </RouterLink>
  </TiltCard>
</template>
