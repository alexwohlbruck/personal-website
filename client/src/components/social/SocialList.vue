<script setup lang="ts">
import { Motion } from 'motion-v'
import { ArrowUpRight } from '@lucide/vue'
import InlineIcon from '@/components/ui/InlineIcon.vue'
import { socials } from '@/data/site'
import { duration, ease, inView, step } from '@/lib/motion'
</script>

<template>
  <ul class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
    <Motion
      v-for="(social, index) in socials"
      :key="social.label"
      as="li"
      :initial="{ opacity: 0, x: -8, filter: 'blur(3px)' }"
      :while-in-view="{ opacity: 1, x: 0, filter: 'blur(0px)' }"
      :in-view-options="inView"
      :transition="{ duration: duration.base, ease, delay: step(index) }"
    >
      <component
        :is="social.to ? 'RouterLink' : 'a'"
        v-bind="
          social.to
            ? { to: { name: social.to } }
            : { href: social.href, target: '_blank', rel: 'noopener noreferrer' }
        "
        class="card group flex h-full items-center gap-3 p-4 transition-transform duration-300 ease-out-quint hover:-translate-y-0.5 hover:shadow-e2"
      >
        <span
          class="grid size-8 shrink-0 place-items-center rounded-lg bg-paper-sunk text-ink-2 transition-all duration-300 ease-out-quint group-hover:bg-accent-wash group-hover:text-accent"
          style="box-shadow: var(--tile-ring)"
        >
          <InlineIcon :name="social.icon" :size="14" />
        </span>

        <span class="min-w-0 flex-1">
          <span class="block text-sm font-medium transition-colors group-hover:text-accent">
            {{ social.label }}
          </span>
          <span class="block truncate text-xs text-ink-3">{{ social.handle }}</span>
        </span>

        <ArrowUpRight
          class="size-3.5 text-ink-3 transition-all duration-300 ease-out-quint group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent"
          aria-hidden="true"
        />
      </component>
    </Motion>
  </ul>
</template>
