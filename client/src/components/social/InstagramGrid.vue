<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { Motion } from 'motion-v'
import { ChevronLeft, ChevronRight } from '@lucide/vue'
import AppButton from '@/components/ui/AppButton.vue'
import ImageViewer from '@/components/ui/ImageViewer.vue'
import InlineIcon from '@/components/ui/InlineIcon.vue'
import { useLiveStore } from '@/stores/live'
import { links } from '@/data/site'
import { duration, ease, step } from '@/lib/motion'
import type { InstagramImage } from '@/data/types'

const live = useLiveStore()

/** Three rows of five on a wide screen, five of three on a narrow one. */
const PER_PAGE = 15

const page = ref(0)
/** Index into the flat image list, or null when the viewer is closed. */
const opened = ref<number | null>(null)

onMounted(() => void live.fetchInstagram())

const images = computed(() => live.instagramImages)
const pageCount = computed(() => Math.max(1, Math.ceil(images.value.length / PER_PAGE)))
const shown = computed(() =>
  images.value.slice(page.value * PER_PAGE, (page.value + 1) * PER_PAGE),
)

const canGoForward = computed(() => page.value < pageCount.value - 1 || !live.instagramDone)
const canGoBack = computed(() => page.value > 0)

async function forward() {
  if (!canGoForward.value) return

  // On the last page, fetch before turning, so the arrow does not flick to an
  // empty grid and fill in behind it.
  if (page.value >= pageCount.value - 1) {
    await live.loadMoreInstagram()
    if (page.value >= Math.ceil(images.value.length / PER_PAGE) - 1) return
  }

  page.value += 1
}

function back() {
  if (canGoBack.value) page.value -= 1
}

/** Fetch the page after the one being read, so the next click is instant. */
watch(page, (value) => {
  if (value >= pageCount.value - 2 && !live.instagramDone) void live.loadMoreInstagram()
})

const loading = computed(() => live.instagramStatus === 'loading')
const first = computed(() => page.value * PER_PAGE)
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

    <div v-if="loading && !images.length" class="grid grid-cols-3 gap-2 sm:grid-cols-5">
      <div
        v-for="i in PER_PAGE"
        :key="i"
        class="aspect-square animate-pulse rounded-lg bg-paper-sunk"
      />
    </div>

    <p v-else-if="!images.length" class="text-sm text-ink-3">
      Photos aren't loading right now. See them on
      <a :href="links.instagram" target="_blank" rel="noopener noreferrer" class="link">Instagram</a>.
    </p>

    <template v-else>
      <div class="grid grid-cols-3 gap-2 sm:grid-cols-5">
        <Motion
          v-for="(image, index) in shown"
          :key="image.key"
          as="button"
          type="button"
          :initial="{ opacity: 0, scale: 0.94, filter: 'blur(4px)' }"
          :animate="{ opacity: 1, scale: 1, filter: 'blur(0px)' }"
          :transition="{ duration: duration.base, ease, delay: step(index) }"
          class="group relative aspect-square overflow-hidden rounded-lg ring-1 ring-rule transition-shadow duration-300 hover:z-10 hover:shadow-e3"
          aria-label="Open photo"
          @click="opened = first + index"
        >
          <img
            :src="image.url"
            :alt="image.caption?.slice(0, 80) ?? 'Instagram photo'"
            loading="lazy"
            decoding="async"
            class="h-full w-full object-cover transition-transform duration-500 ease-out-quint group-hover:scale-105"
          />
        </Motion>
      </div>

      <div class="mt-4 flex items-center justify-between gap-4">
        <p class="tabular text-xs text-ink-3">
          {{ first + 1 }}&ndash;{{ first + shown.length }}
          <span v-if="live.instagramDone"> of {{ images.length }}</span>
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

    <ImageViewer
      :images="images"
      :index="opened"
      label="Instagram photo"
      @close="opened = null"
      @seek="opened = $event"
      @end="live.loadMoreInstagram()"
    >
      <template #action="{ image }">
        <a
          v-if="image"
          :href="(image as InstagramImage).permalink"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center gap-1.5 text-xs text-ink-3 transition-colors hover:text-accent"
        >
          <InlineIcon name="instagram" :size="14" />
          Open on Instagram
        </a>
      </template>
    </ImageViewer>
  </div>
</template>
