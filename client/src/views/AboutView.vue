<script setup lang="ts">
import { Motion } from 'motion-v'
import PageHeader from '@/components/layout/PageHeader.vue'
import SectionHeading from '@/components/ui/SectionHeading.vue'
import SkillsExplorer from '@/components/about/SkillsExplorer.vue'
import TimelineList from '@/components/about/TimelineList.vue'
import portrait from '@/assets/img/me.jpg'
import { site } from '@/data/site'
import { duration, ease, inView } from '@/lib/motion'
</script>

<template>
  <div class="pb-8">
    <PageHeader
      title="A bit about me"
      :lede="`${site.role} in ${site.location}. I care about interfaces where the motion, the spacing, and the words all agree with each other.`"
    />

    <!-- Bio ----------------------------------------------------------------->
    <section class="grid gap-10 border-t border-rule py-14 md:grid-cols-[14rem_1fr] md:gap-14">
      <Motion
        :initial="{ opacity: 0, y: 16, filter: 'blur(4px)' }"
        :while-in-view="{ opacity: 1, y: 0, filter: 'blur(0px)' }"
        :in-view-options="inView"
        :transition="{ duration: duration.base, ease }"
        class="relative w-40 md:w-full"
      >
        <img
          :src="portrait"
          alt="Alex Wohlbruck"
          class="aspect-square w-full rounded-2xl object-cover"
          style="box-shadow: var(--sheen), var(--tile-ring), var(--shadow-2)"
        />
      </Motion>

      <Motion
        :initial="{ opacity: 0, y: 16, filter: 'blur(4px)' }"
        :while-in-view="{ opacity: 1, y: 0, filter: 'blur(0px)' }"
        :in-view-options="inView"
        :transition="{ duration: duration.base, ease, delay: 0.08 }"
        class="max-w-2xl space-y-5"
      >
        <p class="prose-body text-lg">
          I started designing and building for the web in high school. Photoshop turned into HTML
          and I never went back. These days I write mostly TypeScript and mostly Vue, and I spend a
          suspicious amount of my free time on maps.
        </p>
        <p class="prose-body">
          I like the front end because the craft is visible. A hundred small decisions about type,
          motion, and hierarchy add up to something that either feels right or doesn't. So far
          I've shipped a labor management platform, a public API that outlived its own joke, and a
          navigation app built entirely on open data.
        </p>
        <p class="prose-body">
          Off the clock you'll find me on a bike, at a piano, editing OpenStreetMap, or arguing
          that the city should have built the train.
        </p>
      </Motion>
    </section>

    <!-- Skills ---------------------------------------------------------------->
    <section class="py-14">
      <SectionHeading
        title="What I work with"
        note="Pick anything to see how well I know it and where I've used it."
      />
      <SkillsExplorer />
    </section>

    <!-- Timeline -------------------------------------------------------------->
    <section class="py-14">
      <SectionHeading title="How I got here" />
      <TimelineList />
    </section>
  </div>
</template>
