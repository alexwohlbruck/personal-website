<script setup lang="ts">
import { computed, ref } from 'vue'
import { AnimatePresence, Motion } from 'motion-v'
import PageHeader from '@/components/layout/PageHeader.vue'
import ProjectRow from '@/components/project/ProjectRow.vue'
import { projects } from '@/data/projects'
import { tagLabel } from '@/data/skills'
import { duration, ease, step } from '@/lib/motion'

const active = ref<string | null>(null)

/**
 * Every tag that actually narrows the list. A tag on all ten projects filters
 * nothing, and one on a single project is a link to that project by another
 * name. Nothing is capped, so the chips always add up to the whole set.
 */
const filters = computed(() => {
  const counts = new Map<string, number>()
  for (const project of projects) {
    for (const tag of project.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1)
  }
  return [...counts.entries()]
    .filter(([, count]) => count >= 2 && count < projects.length)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([tag, count]) => ({ tag, count, label: tagLabel(tag) }))
})

const visible = computed(() =>
  active.value ? projects.filter((p) => p.tags.includes(active.value!)) : projects,
)

function toggle(tag: string) {
  active.value = active.value === tag ? null : tag
}
</script>

<template>
  <div class="pb-8">
    <PageHeader
      title="Everything I've built"
      :lede="`${projects.length} projects, newest first. Filter by skill, or open any one for screenshots and source.`"
    />

    <!-- Filter ------------------------------------------------------------->
    <div class="flex flex-wrap items-center gap-2 border-y border-rule py-4">
      <button type="button" class="chip" :class="!active && 'chip-active'" @click="active = null">
        All
        <span class="tabular opacity-60">{{ projects.length }}</span>
      </button>
      <button
        v-for="filter in filters"
        :key="filter.tag"
        type="button"
        class="chip"
        :class="active === filter.tag && 'chip-active'"
        :aria-pressed="active === filter.tag"
        @click="toggle(filter.tag)"
      >
        {{ filter.label }}
        <span class="tabular opacity-60">{{ filter.count }}</span>
      </button>
    </div>

    <!-- Index -------------------------------------------------------------->
    <ol class="mt-2">
      <AnimatePresence mode="popLayout">
        <Motion
          v-for="(project, index) in visible"
          :key="project.name"
          as="li"
          layout
          :initial="{ opacity: 0, y: 16, filter: 'blur(4px)' }"
          :animate="{ opacity: 1, y: 0, filter: 'blur(0px)' }"
          :exit="{ opacity: 0, filter: 'blur(4px)' }"
          :transition="{ duration: duration.base, ease, delay: step(Math.min(index, 8)) }"
        >
          <ProjectRow :project="project" :index="index" />
        </Motion>
      </AnimatePresence>
    </ol>

    <p class="mt-8 text-center text-sm text-ink-3">
      Showing {{ visible.length }} of {{ projects.length }}
      <template v-if="active">
        · <button type="button" class="link" @click="active = null">Clear filter</button>
      </template>
    </p>
  </div>
</template>
