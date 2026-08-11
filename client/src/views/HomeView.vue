<script setup lang="ts">
import { Motion } from 'motion-v'
import { ArrowRight } from '@lucide/vue'
import AppButton from '@/components/ui/AppButton.vue'
import SectionHeading from '@/components/ui/SectionHeading.vue'
import ProjectCard from '@/components/project/ProjectCard.vue'
import RotatingWord from '@/components/home/RotatingWord.vue'
import IndexCard from '@/components/home/IndexCard.vue'
import { projects } from '@/data/projects'
import { site } from '@/data/site'
import { duration, ease, inView, step } from '@/lib/motion'

const featured = projects.slice(0, 3)

const enter = (delay: number) => ({
  initial: { opacity: 0, y: 14, filter: 'blur(4px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  transition: { duration: duration.base, ease, delay },
})
</script>

<template>
  <div>
    <!-- Hero ---------------------------------------------------------------->
    <section class="grid items-end gap-12 pb-16 pt-32 md:pt-40 lg:grid-cols-[1.6fr_1fr] lg:gap-16">
      <div>
        <Motion as="h1" v-bind="enter(0)" class="display">Alex<br />Wohlbruck</Motion>

        <Motion as="div" v-bind="enter(0.08)" class="mt-8 h-px w-full bg-rule" />

        <Motion as="p" v-bind="enter(0.12)" class="prose-body mt-8 max-w-xl text-lg md:text-xl">
          {{ site.statement }}
        </Motion>

        <Motion as="div" v-bind="enter(0.18)" class="mt-9 flex flex-wrap items-center gap-3">
          <AppButton variant="accent" :to="{ name: 'projects' }" class="nudge">
            See the work
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

    <!-- Selected work ------------------------------------------------------->
    <section class="py-16">
      <SectionHeading
        title="Things I've made"
        note="Ten years of side projects, client work, and one cat facts API that refuses to die."
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

      <div class="mt-8 flex justify-center">
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
      <span class="contours pointer-events-none absolute inset-0 opacity-70" aria-hidden="true" />
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
