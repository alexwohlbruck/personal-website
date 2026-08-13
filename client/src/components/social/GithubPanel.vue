<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { ArrowUpRight, GitCommitHorizontal } from '@lucide/vue'
import { Motion } from 'motion-v'
import SectionHeading from '@/components/ui/SectionHeading.vue'
import InlineIcon from '@/components/ui/InlineIcon.vue'
import ContributionCard from '@/components/social/ContributionCard.vue'
import { useLiveStore } from '@/stores/live'
import { links } from '@/data/site'
import { relativeTime } from '@/lib/format'
import { duration, ease, inView, step } from '@/lib/motion'

/**
 * The other half of what I spend evenings on: a year of commits, what they
 * were written in, and the last few pushes.
 *
 * Everything here is public data. The server reads it with a token when it has
 * one and from public endpoints when it does not, so this only has to handle
 * having the panel or not having it.
 */
const live = useLiveStore()

onMounted(() => void live.fetchGithub())

const stats = computed(() => live.github)
const loading = computed(() => live.githubStatus === 'loading' || live.githubStatus === 'idle')

const number = new Intl.NumberFormat('en-US')

const memberYear = computed(() =>
  stats.value?.memberSince ? new Date(stats.value.memberSince).getFullYear() : null,
)

const largestLanguage = computed(() =>
  Math.max(...(stats.value?.languages.map((language) => language.count) ?? [1])),
)
</script>

<template>
  <section class="py-10">
    <SectionHeading
      title="Committed to the bit"
      note="A year of pushes, and what they were written in."
    />

    <div v-if="loading" class="space-y-6">
      <div class="card h-72 animate-pulse bg-paper-sunk" />
      <div class="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div class="card h-56 animate-pulse bg-paper-sunk" />
        <div class="card h-56 animate-pulse bg-paper-sunk" />
      </div>
    </div>


    <div v-else-if="stats" class="space-y-6">
      <ContributionCard
        :calendar="stats.calendar"
        label="Contribution graph"
        :note="`Pushing code since ${memberYear}`"
        unit="contributions in the last year"
        pattern="binary"
      >
        <template #action>
          <a
            :href="stats.profile"
            target="_blank"
            rel="noopener noreferrer"
            class="grid size-10 shrink-0 place-items-center rounded-lg bg-accent-wash text-accent transition-transform duration-300 ease-out-quint hover:-translate-y-0.5"
            aria-label="Open Alex's GitHub profile"
          >
            <InlineIcon name="github" :size="20" />
          </a>
        </template>
      </ContributionCard>

      <div class="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div class="card flex flex-col p-6 sm:p-7">
          <p class="label text-ink-3">Written in</p>

          <ul v-if="stats.languages.length" class="mt-4 space-y-3">
            <Motion
              v-for="(language, index) in stats.languages"
              :key="language.name"
              as="li"
              :initial="{ opacity: 0, x: -6 }"
              :while-in-view="{ opacity: 1, x: 0 }"
              :in-view-options="inView"
              :transition="{ duration: duration.base, ease, delay: step(index) }"
            >
              <div class="mb-1 flex items-baseline justify-between gap-3 text-sm">
                <span class="truncate font-medium">{{ language.name }}</span>
                <span class="tabular shrink-0 text-xs text-ink-3">
                  {{ language.count }} repo{{ language.count === 1 ? '' : 's' }}
                </span>
              </div>
              <div class="h-1 overflow-hidden rounded-full bg-paper-sunk">
                <Motion
                  as="div"
                  class="h-full rounded-full bg-accent"
                  :initial="{ width: '0%' }"
                  :while-in-view="{ width: `${Math.max(6, (language.count / largestLanguage) * 100)}%` }"
                  :in-view-options="inView"
                  :transition="{ duration: duration.slow, ease, delay: step(index, 0.1) }"
                  :style="{ opacity: index === 0 ? 1 : 0.55 }"
                />
              </div>
            </Motion>
          </ul>

          <dl class="mt-auto grid grid-cols-3 gap-4 border-t border-rule pt-6">
            <div>
              <dt class="label text-ink-3">Repos</dt>
              <dd class="title tabular mt-1.5 text-3xl">{{ number.format(stats.repos) }}</dd>
            </div>
            <div>
              <dt class="label text-ink-3">Stars</dt>
              <dd class="title tabular mt-1.5 text-3xl">{{ number.format(stats.stars) }}</dd>
            </div>
            <div>
              <dt class="label text-ink-3">Followers</dt>
              <dd class="title tabular mt-1.5 text-3xl">{{ number.format(stats.followers) }}</dd>
            </div>
          </dl>
        </div>

        <div class="card flex flex-col p-6 sm:p-7">
          <div class="mb-2 flex items-baseline justify-between gap-4">
            <p class="label text-ink-3">Recent pushes</p>
            <a
              :href="links.github"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-1 text-xs text-ink-3 transition-colors hover:text-accent"
            >
              All activity
              <ArrowUpRight class="size-3.5" aria-hidden="true" />
            </a>
          </div>

          <ul v-if="stats.recent.length">
            <li v-for="push in stats.recent" :key="push.id" class="border-b border-rule last:border-0">
              <a
                :href="push.url"
                target="_blank"
                rel="noopener noreferrer"
                class="group grid grid-cols-[1fr_auto] gap-4 py-3"
              >
                <span class="min-w-0">
                  <span class="block truncate text-sm font-medium transition-colors group-hover:text-accent">
                    {{ push.message }}
                  </span>
                  <span class="mt-1 flex items-center gap-1.5 text-xs text-ink-3">
                    <GitCommitHorizontal class="size-3.5 shrink-0" aria-hidden="true" />
                    <span class="truncate">{{ push.repo }}</span>
                    <span aria-hidden="true">·</span>
                    <span class="shrink-0">{{ relativeTime(push.createdAt) }}</span>
                  </span>
                </span>
                <span v-if="push.commits" class="tabular self-center text-xs text-ink-3">
                  {{ number.format(push.commits) }} commit{{ push.commits === 1 ? '' : 's' }}
                </span>
              </a>
            </li>
          </ul>

          <p v-else class="py-3 text-sm text-ink-3">Nothing pushed publicly in the last while.</p>
        </div>
      </div>
    </div>

    <div v-else class="card p-6 text-sm text-ink-3">
      GitHub stats aren't loading right now. The code is all on
      <a :href="links.github" target="_blank" rel="noopener noreferrer" class="link">GitHub</a>.
    </div>
  </section>
</template>
