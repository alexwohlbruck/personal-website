<script setup lang="ts">
import { computed, ref } from 'vue'
import { Motion } from 'motion-v'
import { ArrowUpRight } from '@lucide/vue'
import ProficiencyMeter from '@/components/ui/ProficiencyMeter.vue'
import ProjectTile from '@/components/project/ProjectTile.vue'
import { skills, skillGroupLabels } from '@/data/skills'
import { projects } from '@/data/projects'
import { duration, ease } from '@/lib/motion'
import type { Skill } from '@/data/types'

const groups = (Object.keys(skills) as (keyof typeof skills)[]).map((key) => ({
  key,
  label: skillGroupLabels[key],
  items: skills[key],
}))

const selected = ref<Skill>(skills.languages[0]!)

const related = computed(() => projects.filter((p) => p.tags.includes(selected.value.tag)))
</script>

<template>
  <div class="grid gap-10 lg:grid-cols-[1fr_20rem] lg:gap-14">
    <div class="grid gap-8 sm:grid-cols-3">
      <div v-for="group in groups" :key="group.key">
        <h3 class="mb-4 border-b border-rule pb-3 text-sm font-medium text-ink-2">{{ group.label }}</h3>
        <ul class="space-y-0.5">
          <li v-for="skill in group.items" :key="skill.tag">
            <button
              type="button"
              class="group flex w-full items-center gap-2 rounded-md py-1.5 pl-2 pr-1 text-left text-sm transition-colors duration-200"
              :class="
                selected.tag === skill.tag
                  ? 'bg-accent-wash text-accent'
                  : 'text-ink-2 hover:bg-paper-sunk hover:text-ink'
              "
              :aria-pressed="selected.tag === skill.tag"
              @click="selected = skill"
            >
              <span
                class="size-1 shrink-0 rounded-full transition-colors"
                :class="selected.tag === skill.tag ? 'bg-accent' : 'bg-rule-strong'"
              />
              {{ skill.name }}
            </button>
          </li>
        </ul>
      </div>
    </div>

    <!-- Detail panel: follows you down the page on wide screens. -->
    <div class="lg:sticky lg:top-24 lg:self-start">
      <Motion
        :key="selected.tag"
        :initial="{ opacity: 0, y: 8, filter: 'blur(3px)' }"
        :animate="{ opacity: 1, y: 0, filter: 'blur(0px)' }"
        :transition="{ duration: duration.base, ease }"
        class="card p-5"
      >
        <div class="flex items-start justify-between gap-4">
          <h3 class="title text-2xl">{{ selected.name }}</h3>
          <div class="pt-1.5">
            <ProficiencyMeter :key="selected.tag" :value="selected.proficiency" />
          </div>
        </div>

        <p v-if="selected.description" class="mt-4 text-sm leading-relaxed text-ink-2">
          {{ selected.description }}
        </p>

        <div v-if="related.length" class="mt-5 border-t border-rule pt-4">
          <p class="mb-3 text-sm text-ink-3">Used in {{ related.length }} projects</p>
          <ul class="space-y-1">
            <li v-for="project in related" :key="project.name">
              <RouterLink
                :to="{ name: 'project', params: { name: project.name } }"
                class="group flex items-center gap-3 rounded-md p-1.5 transition-colors hover:bg-paper-sunk"
              >
                <ProjectTile :project="project" :size="28" />
                <span class="flex-1 truncate text-sm">{{ project.title }}</span>
                <ArrowUpRight
                  class="size-3.5 text-ink-3 transition-all duration-300 ease-out-quint group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent"
                />
              </RouterLink>
            </li>
          </ul>
        </div>
      </Motion>
    </div>
  </div>
</template>
