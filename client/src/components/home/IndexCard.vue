<script setup lang="ts">
import { computed, ref } from 'vue'
import { useIntervalFn } from '@vueuse/core'
import { MapPin } from '@lucide/vue'
import NowPlaying from '@/components/social/NowPlaying.vue'
import { site } from '@/data/site'
import { duration } from '@/lib/format'

/**
 * The spec sheet: where I am, what I'm doing, what's on. Small, factual, and
 * the only thing on the home page that changes by itself.
 */
const now = ref(new Date())
useIntervalFn(() => (now.value = new Date()), 30_000)

const localTime = computed(() =>
  new Intl.DateTimeFormat('en-US', {
    timeZone: site.timezone,
    hour: 'numeric',
    minute: '2-digit',
  }).format(now.value),
)

const tenure = computed(() => duration(site.currently.since))
</script>

<template>
  <aside class="card overflow-hidden">
    <dl class="divide-y divide-rule">
      <div class="flex items-baseline justify-between gap-4 px-5 py-4">
        <dt class="text-sm text-ink-3">Based</dt>
        <dd class="flex items-center gap-1.5 text-sm">
          <MapPin class="size-3.5 text-ink-3" />
          {{ site.location }}
          <span class="tabular text-ink-3">· {{ localTime }}</span>
        </dd>
      </div>

      <div class="flex items-baseline justify-between gap-4 px-5 py-4">
        <dt class="shrink-0 text-sm text-ink-3">Currently</dt>
        <dd class="text-right text-sm">
          {{ site.currently.title }}
          <span class="block text-ink-3">{{ site.currently.company }} · {{ tenure }}</span>
        </dd>
      </div>

      <div class="px-5 py-4">
        <NowPlaying compact />
      </div>
    </dl>
  </aside>
</template>
