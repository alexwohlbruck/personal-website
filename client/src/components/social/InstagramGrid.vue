<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { Motion } from 'motion-v'
import { ChevronLeft, ChevronRight } from '@lucide/vue'
import AppButton from '@/components/ui/AppButton.vue'
import InlineIcon from '@/components/ui/InlineIcon.vue'
import { useLiveStore } from '@/stores/live'
import { links } from '@/data/site'
import { duration, ease, step } from '@/lib/motion'

const live = useLiveStore()

/** Two rows of five on a wide screen, two of three on a narrow one. */
const PER_PAGE = 10

const page = ref(0)

onMounted(() => void live.fetchInstagram())

const pageCount = computed(() => Math.max(1, Math.ceil(live.instagram.length / PER_PAGE)))
const posts = computed(() => live.instagram.slice(page.value * PER_PAGE, (page.value + 1) * PER_PAGE))

/** More to come if the server still has a cursor, or we have unshown photos. */
const canGoForward = computed(() => page.value < pageCount.value - 1 || !live.instagramDone)
const canGoBack = computed(() => page.value > 0)

async function forward() {
  if (!canGoForward.value) return

  // The last loaded page is the trigger to fetch the next one. Awaiting here
  // means the arrow stays put until there is something to show, rather than
  // flicking to an empty page and filling in behind it.
  if (page.value >= pageCount.value - 1) {
    await live.loadMoreInstagram()
    if (page.value >= Math.ceil(live.instagram.length / PER_PAGE) - 1) return
  }

  page.value += 1
}

function back() {
  if (canGoBack.value) page.value -= 1
}

/**
 * Fetch the page after the one being viewed, so the next click renders from
 * memory. Cheap: the server caches these and the browser has them for minutes.
 */
watch(page, (value) => {
  if (value >= pageCount.value - 2 && !live.instagramDone) void live.loadMoreInstagram()
})

const loading = computed(() => live.instagramStatus === 'loading')
</script>

<template>
  <div>
    <div class="mb-5 flex items-baseline justify-between gap-4">
      <p class="text-sm text-ink-3">What I've been pointing a camera at.</p>
      <a
        :href="links.instagram"
        target="_blank"
        rel="noopener noreferrer"
        class="flex shrink-0 items-center gap-1.5 text-xs text-ink-3 transition-colors hover:text-accent"
      >
        <InlineIcon name="instagram" :size="14" />
        Instagram
      </a>
    </div>

    <div v-if="loading && !live.instagram.length" class="grid grid-cols-3 gap-2 sm:grid-cols-5">
      <div v-for="i in PER_PAGE" :key="i" class="aspect-square animate-pulse rounded-lg bg-paper-sunk" />
    </div>

    <p v-else-if="!live.instagram.length" class="text-sm text-ink-3">
      Photos aren't loading right now. See them on
      <a :href="links.instagram" target="_blank" rel="noopener noreferrer" class="link">Instagram</a>.
    </p>

    <template v-else>
      <div class="grid grid-cols-3 gap-2 sm:grid-cols-5">
        <Motion
          v-for="(post, index) in posts"
          :key="post.id"
          as="a"
          :href="post.permalink"
          target="_blank"
          rel="noopener noreferrer"
          :initial="{ opacity: 0, scale: 0.94, filter: 'blur(4px)' }"
          :animate="{ opacity: 1, scale: 1, filter: 'blur(0px)' }"
          :transition="{ duration: duration.base, ease, delay: step(index) }"
          class="group relative aspect-square overflow-hidden rounded-lg ring-1 ring-rule transition-shadow duration-300 hover:z-10 hover:shadow-e3"
        >
          <img
            :src="post.media_url"
            :alt="post.caption?.slice(0, 80) ?? 'Instagram photo'"
            loading="lazy"
            decoding="async"
            class="h-full w-full object-cover transition-transform duration-500 ease-out-quint group-hover:scale-105"
          />
        </Motion>
      </div>

      <div class="mt-4 flex items-center justify-between gap-4">
        <p class="tabular text-xs text-ink-3">
          {{ page * PER_PAGE + 1 }}&ndash;{{ page * PER_PAGE + posts.length }}
          <span v-if="live.instagramDone"> of {{ live.instagram.length }}</span>
        </p>

        <div class="flex items-center gap-1.5">
          <AppButton
            variant="ghost"
            size="icon"
            :disabled="!canGoBack"
            aria-label="Previous photos"
            @click="back"
          >
            <ChevronLeft class="size-4" />
          </AppButton>
          <AppButton
            variant="ghost"
            size="icon"
            :disabled="!canGoForward || loading"
            aria-label="More photos"
            @click="forward"
          >
            <ChevronRight class="size-4" />
          </AppButton>
        </div>
      </div>
    </template>
  </div>
</template>
