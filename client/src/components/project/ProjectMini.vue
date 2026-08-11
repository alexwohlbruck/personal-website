<script setup lang="ts">
import { computed } from 'vue'
import ProjectTile from './ProjectTile.vue'
import { projectImage } from '@/lib/assets'
import { projectCover } from '@/data/projects'
import { dateRange } from '@/lib/format'
import type { Project } from '@/data/types'

/** The quiet tier under the featured cards: a cover, a name, a year. */
const props = defineProps<{ project: Project }>()

const coverImage = computed(() => projectCover(props.project))
const cover = computed(() => projectImage(props.project.name, coverImage.value.file))
</script>

<template>
  <RouterLink
    :to="{ name: 'project', params: { name: project.name } }"
    class="card group flex h-full flex-col overflow-hidden transition-shadow duration-300 ease-out-quint hover:shadow-e2"
  >
    <div
      class="relative aspect-[16/10] overflow-hidden border-b border-rule"
      :style="{ backgroundColor: project.color }"
    >
      <img
        v-if="cover"
        :src="cover"
        :alt="`${project.title} preview`"
        loading="lazy"
        decoding="async"
        class="h-full w-full object-cover transition-transform duration-500 ease-out-quint group-hover:scale-[1.04]"
        :class="coverImage.position"
      />
      <!-- Without a screenshot the tile stands in, so the row stays even. -->
      <span v-else class="grid h-full w-full place-items-center">
        <ProjectTile :project="project" :size="32" />
      </span>
    </div>

    <div class="flex flex-1 flex-col justify-between gap-1 p-3">
      <h3 class="title truncate text-[0.9375rem] transition-colors group-hover:text-accent">
        {{ project.title }}
      </h3>
      <time class="label text-ink-3">{{ dateRange(project.start, project.end) }}</time>
    </div>
  </RouterLink>
</template>
