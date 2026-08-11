<script setup lang="ts">
import { ArrowUp } from '@lucide/vue'
import InlineIcon from '@/components/ui/InlineIcon.vue'
import { links, site, socials } from '@/data/site'
import { projects } from '@/data/projects'

const nav = [
  { name: 'projects', label: 'Projects' },
  { name: 'about', label: 'About' },
  { name: 'social', label: 'Social' },
  { name: 'contact', label: 'Contact' },
]

const recent = projects.slice(0, 4)
const elsewhere = socials.filter((social) => social.href)
const year = new Date().getFullYear()

function toTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <footer class="mt-24 border-t border-rule">
    <div class="mx-auto max-w-6xl px-5 py-14 md:px-8">
      <div class="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
        <div class="max-w-xs">
          <RouterLink :to="{ name: 'home' }" class="flex items-center gap-2.5">
            <span
              class="grid size-7 place-items-center rounded-md bg-ink font-serif text-sm leading-none text-paper"
              style="box-shadow: var(--shadow-1)"
              aria-hidden="true"
            >
              A
            </span>
            <span class="title text-lg">{{ site.name }}</span>
          </RouterLink>

          <p class="mt-4 text-sm leading-relaxed text-ink-3">
            {{ site.role }} in {{ site.location }}. Currently at
            {{ site.currently.company }}. Most of my own time goes to maps.
          </p>

          <RouterLink
            :to="{ name: 'contact' }"
            class="mt-5 flex w-fit items-center gap-2 text-sm text-ink-2 transition-colors hover:text-accent"
          >
            <span class="relative flex size-2" aria-hidden="true">
              <span
                class="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-60"
              />
              <span class="relative inline-flex size-2 rounded-full bg-accent" />
            </span>
            Say hello
          </RouterLink>
        </div>

        <nav class="flex flex-col gap-2.5">
          <p class="mb-1 text-sm font-medium">Pages</p>
          <RouterLink
            v-for="item in nav"
            :key="item.name"
            :to="{ name: item.name }"
            class="w-fit text-sm text-ink-3 transition-colors hover:text-accent"
          >
            {{ item.label }}
          </RouterLink>
        </nav>

        <nav class="flex flex-col gap-2.5">
          <p class="mb-1 text-sm font-medium">Recent work</p>
          <RouterLink
            v-for="project in recent"
            :key="project.name"
            :to="{ name: 'project', params: { name: project.name } }"
            class="w-fit text-sm text-ink-3 transition-colors hover:text-accent"
          >
            {{ project.title }}
          </RouterLink>
        </nav>

        <div class="flex flex-col gap-2.5">
          <p class="mb-1 text-sm font-medium">Elsewhere</p>
          <a
            v-for="social in elsewhere"
            :key="social.label"
            :href="social.href"
            target="_blank"
            rel="noopener noreferrer"
            class="flex w-fit items-center gap-2 text-sm text-ink-3 transition-colors hover:text-accent"
          >
            <InlineIcon :name="social.icon" :size="14" />
            {{ social.label }}
          </a>
        </div>
      </div>

      <div class="mt-12 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-rule pt-6">
        <p class="text-sm text-ink-3">
          Made with <span class="mx-0.5 inline-block" role="img" aria-label="love">❤️</span> by
          <a
            :href="links.github"
            target="_blank"
            rel="noopener noreferrer"
            class="text-ink-2 transition-colors hover:text-accent"
            >Alex Wohlbruck</a
          >
        </p>

        <div class="flex items-center gap-5">
          <a
            href="https://github.com/alexwohlbruck/personal-website"
            target="_blank"
            rel="noopener noreferrer"
            class="text-sm text-ink-3 transition-colors hover:text-accent"
          >
            Source
          </a>
          <span class="tabular text-sm text-ink-3">© {{ year }}</span>
          <button type="button" class="btn btn-sm btn-ghost group" @click="toTop">
            Back to top
            <ArrowUp
              class="size-3.5 transition-transform duration-300 ease-out-quint group-hover:-translate-y-0.5"
            />
          </button>
        </div>
      </div>
    </div>
  </footer>
</template>
