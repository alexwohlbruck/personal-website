<script setup lang="ts">
import { computed, ref } from 'vue'
import { Motion } from 'motion-v'
import { usePreferredReducedMotion } from '@vueuse/core'
import { ArrowRight } from '@lucide/vue'
import TopoField from '@/components/home/TopoField.vue'
import WashSplash from '@/components/home/WashSplash.vue'
import AppButton from '@/components/ui/AppButton.vue'
import SectionHeading from '@/components/ui/SectionHeading.vue'
import ProjectCard from '@/components/project/ProjectCard.vue'
import ProjectMini from '@/components/project/ProjectMini.vue'
import RotatingWord from '@/components/home/RotatingWord.vue'
import IndexCard from '@/components/home/IndexCard.vue'
import LivePreviews from '@/components/home/LivePreviews.vue'
import { featuredProjects, moreProjects, projects } from '@/data/projects'
import { site } from '@/data/site'
import { duration, ease, inView, step } from '@/lib/motion'

const featured = featuredProjects
const alsoRan = moreProjects(4)

const enter = (delay: number) => ({
  initial: { opacity: 0, y: 14, filter: 'blur(4px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  transition: { duration: duration.base, ease, delay },
})

/**
 * The pools of light behind the hero lean towards the cursor. A transform and a
 * long ease do the smoothing, so the pointer handler is only ever arithmetic.
 */
const reduced = usePreferredReducedMotion()
const drift = ref({ x: 0, y: 0 })
const washStyle = computed(() => ({
  transform: `translate3d(${drift.value.x.toFixed(1)}px, ${drift.value.y.toFixed(1)}px, 0)`,
}))

function leanWash(event: PointerEvent) {
  if (reduced.value === 'reduce') return
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  drift.value = {
    x: ((event.clientX - rect.left) / rect.width - 0.5) * 22,
    y: ((event.clientY - rect.top) / rect.height - 0.5) * 14,
  }
}
</script>

<template>
  <div>
    <!-- Hero ---------------------------------------------------------------->
    <section
      class="hero-brush relative grid select-none items-end gap-12 pb-16 pt-32 md:pt-40 lg:grid-cols-[1.6fr_1fr] lg:gap-16"
      @pointermove="leanWash"
      @pointerleave="drift = { x: 0, y: 0 }"
    >
      <TopoField
        class="pointer-events-none absolute inset-y-0 left-1/2 -z-20 w-screen -translate-x-1/2"
      />
      <span
        class="hero-wash wash-drift pointer-events-none absolute -inset-x-40 -inset-y-32 -z-10"
        :style="washStyle"
        aria-hidden="true"
      />
      <WashSplash class="-z-10" />
      <div>
        <Motion as="h1" v-bind="enter(0)" class="display">Alex<br />Wohlbruck</Motion>

        <Motion as="p" v-bind="enter(0.1)" class="prose-body mt-7 max-w-xl text-lg md:text-xl">
          {{ site.statement }}
        </Motion>

        <Motion as="div" v-bind="enter(0.18)" class="mt-9 flex flex-wrap items-center gap-3">
          <AppButton variant="accent" :to="{ name: 'projects' }" class="nudge">
            See my work
            <ArrowRight class="size-4" />
          </AppButton>
          <AppButton :to="{ name: 'contact' }">Get in touch</AppButton>
        </Motion>

        <Motion as="p" v-bind="enter(0.26)" class="mt-10 font-serif text-xl">
          <RotatingWord :words="site.alsoA" />
        </Motion>
      </div>

      <Motion v-bind="enter(0.16)">
        <IndexCard />
      </Motion>
    </section>

    <LivePreviews />

    <!-- Selected work ------------------------------------------------------->
    <section class="py-16">
      <SectionHeading
        title="Things I've made"
        note="Ten years of side projects, experimentation, and one cat facts API that refuses to die."
      />

      <div class="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        <Motion
          v-for="(project, index) in featured"
          :key="project.name"
          :initial="{ opacity: 0, y: 18, filter: 'blur(4px)' }"
          :while-in-view="{ opacity: 1, y: 0, filter: 'blur(0px)' }"
          :in-view-options="inView"
          :transition="{ duration: duration.base, ease, delay: step(index) }"
        >
          <ProjectCard :project="project" />
        </Motion>
      </div>

      <!-- The rest, at a glance. Not curated, just what came next. -->
      <div class="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Motion
          v-for="(project, index) in alsoRan"
          :key="project.name"
          :initial="{ opacity: 0, y: 14, filter: 'blur(4px)' }"
          :while-in-view="{ opacity: 1, y: 0, filter: 'blur(0px)' }"
          :in-view-options="inView"
          :transition="{ duration: duration.base, ease, delay: step(index) }"
        >
          <ProjectMini :project="project" />
        </Motion>
      </div>

      <div class="mt-10 flex justify-center">
        <AppButton :to="{ name: 'projects' }" variant="ghost" class="nudge">
          See all {{ projects.length }} projects
          <ArrowRight class="size-4" />
        </AppButton>
      </div>
    </section>

    <!-- Closing note -------------------------------------------------------->
    <Motion
      as="section"
      :initial="{ opacity: 0, y: 18 }"
      :while-in-view="{ opacity: 1, y: 0 }"
      :in-view-options="inView"
      :transition="{ duration: duration.base, ease }"
      class="relative overflow-hidden rounded-2xl px-6 py-14 text-center md:px-12"
      style="
        background-image: linear-gradient(to bottom, var(--surface), var(--surface-2));
        box-shadow: var(--sheen), var(--tile-ring), var(--shadow-2);
      "
    >
      <span class="topo-close pointer-events-none absolute inset-0" aria-hidden="true" />
      <div class="relative">
        <h2 class="title mx-auto max-w-2xl text-4xl md:text-5xl">
          Got something worth building?
        </h2>
        <p class="prose-body mx-auto mt-4 max-w-md">
          I like talking about maps, side projects, and front-end work that needs real care.
        </p>
        <div class="mt-8 flex flex-wrap justify-center gap-3">
          <AppButton variant="accent" :to="{ name: 'contact' }">Send a message</AppButton>
          <AppButton :to="{ name: 'about' }">More about me</AppButton>
        </div>
      </div>
    </Motion>
  </div>
</template>

<style scoped>
/*
 * The hero is a surface you paint on, so it carries a brush instead of an arrow
 * and does not hand you a text selection when you drag across it. The ring is
 * drawn at the ink of each theme; a data URI cannot read a custom property, so
 * the two colours are the tokens' own sRGB values written out. Controls inside
 * the section set their own cursor and keep it.
 */
.hero-brush {
  cursor:
    url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26"><circle cx="13" cy="13" r="8" fill="none" stroke="%23321e19" stroke-width="1.25" opacity="0.55"/><circle cx="13" cy="13" r="2" fill="%23321e19" opacity="0.45"/></svg>')
      13 13,
    crosshair;
}

[data-theme='dark'] .hero-brush {
  cursor:
    url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26"><circle cx="13" cy="13" r="8" fill="none" stroke="%23ede1d5" stroke-width="1.25" opacity="0.5"/><circle cx="13" cy="13" r="2" fill="%23ede1d5" opacity="0.4"/></svg>')
      13 13,
    crosshair;
}

.wash-drift {
  transition: transform 2s var(--ease-out-quint);
  will-change: transform;
}

@media (prefers-reduced-motion: reduce) {
  .wash-drift {
    transform: none !important;
    transition: none !important;
  }

  /* Nothing to paint with, so don't offer a brush. */
  .hero-brush {
    cursor: auto;
  }
}
</style>
