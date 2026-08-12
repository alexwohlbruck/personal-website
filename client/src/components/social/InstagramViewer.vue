<script setup lang="ts">
import { computed, watch } from 'vue'
import {
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  VisuallyHidden,
} from 'reka-ui'
import { ChevronLeft, ChevronRight, X } from '@lucide/vue'
import { Motion } from 'motion-v'
import InlineIcon from '@/components/ui/InlineIcon.vue'
import { ease } from '@/lib/motion'
import type { InstagramImage } from '@/data/types'

/**
 * One photo, full size, with the rest of the roll either side of it.
 *
 * Deliberately not PhotoSwipe, which the project screenshots use. That wants
 * the dimensions of every image up front, and Instagram's API does not report
 * them, so the only way to learn them would be to download every full size
 * photo just to open one. Sizing the frame and letting the image fit inside it
 * needs no dimensions at all.
 */
const props = defineProps<{ images: InstagramImage[]; index: number | null }>()
const emit = defineEmits<{ close: []; seek: [index: number]; end: [] }>()

const open = computed({
  get: () => props.index !== null,
  set: (value) => {
    if (!value) emit('close')
  },
})

const current = computed(() =>
  props.index === null ? undefined : props.images[props.index],
)
const caption = computed(() => current.value?.caption?.trim() ?? '')

function go(stepBy: number) {
  if (props.index === null || !props.images.length) return
  const next = props.index + stepBy
  if (next < 0) return
  // Past the last loaded photo, ask for more rather than wrapping round to the
  // start. There is usually another page behind it.
  if (next >= props.images.length) return emit('end')
  emit('seek', next)
}

/** Nearing the end of what is loaded, fetch the next page before it is needed. */
watch(
  () => props.index,
  (value) => {
    if (value !== null && value >= props.images.length - 3) emit('end')
  },
)

function onKey(event: KeyboardEvent) {
  if (event.key === 'ArrowRight') go(1)
  if (event.key === 'ArrowLeft') go(-1)
}

const atStart = computed(() => props.index === 0)
const atEnd = computed(() => props.index !== null && props.index >= props.images.length - 1)

/**
 * The current photo and its immediate neighbours. Preloading one either side
 * makes a page turn instant without pulling the whole roll into memory.
 */
const preload = computed(() => {
  if (props.index === null) return []
  return [props.index - 1, props.index + 1]
    .map((i) => props.images[i]?.url)
    .filter((url): url is string => Boolean(url))
})
</script>

<template>
  <DialogRoot v-model:open="open">
    <DialogPortal>
      <!--
        pointer-events-none while closed. Both of these cover the whole screen,
        and they stay mounted until their exit animation ends. If that animation
        never finishes, which is what a backgrounded tab does, an invisible
        closed dialog would sit on top of the page swallowing every click.
      -->
      <DialogOverlay
        class="fixed inset-0 z-50 bg-paper/80 backdrop-blur-md data-[state=closed]:pointer-events-none data-[state=closed]:animate-[fade-out_150ms_ease] data-[state=open]:animate-[fade-in_200ms_ease]"
      />
      <DialogContent
        class="fixed inset-0 z-50 flex flex-col p-3 outline-none data-[state=closed]:pointer-events-none data-[state=closed]:animate-[fade-out_150ms_ease] data-[state=open]:animate-[fade-in_200ms_ease] sm:p-6"
        @keydown="onKey"
      >
        <VisuallyHidden>
          <DialogTitle>Photo</DialogTitle>
          <DialogDescription>{{ caption || 'A photo from Instagram' }}</DialogDescription>
        </VisuallyHidden>

        <div class="flex shrink-0 items-center justify-between gap-4 pb-3">
          <!-- Which photo of its post this is, when the post has more than one. -->
          <span v-if="current && current.total > 1" class="tabular label text-ink-3">
            {{ current.position }} / {{ current.total }}
          </span>
          <span v-else />

          <div class="flex items-center gap-2">
            <a
              v-if="current"
              :href="current.permalink"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-1.5 text-xs text-ink-3 transition-colors hover:text-accent"
            >
              <InlineIcon name="instagram" :size="14" />
              Open on Instagram
            </a>
            <button type="button" class="btn btn-icon btn-ghost" aria-label="Close" @click="emit('close')">
              <X class="size-4" />
            </button>
          </div>
        </div>

        <div class="relative flex min-h-0 flex-1 items-center justify-center">
          <Motion
            v-if="current"
            :key="current.key"
            as="img"
            :src="current.url"
            :alt="caption ? caption.slice(0, 120) : 'Instagram photo'"
            decoding="async"
            :initial="{ opacity: 0, scale: 0.985 }"
            :animate="{ opacity: 1, scale: 1 }"
            :transition="{ duration: 0.28, ease }"
            class="max-h-full max-w-full rounded-xl object-contain"
            style="box-shadow: var(--shadow-3)"
          />

          <img v-for="url in preload" :key="url" :src="url" alt="" aria-hidden="true" class="hidden" />

          <button
            type="button"
            class="btn btn-icon absolute left-0 top-1/2 -translate-y-1/2"
            aria-label="Previous photo"
            :disabled="atStart"
            @click="go(-1)"
          >
            <ChevronLeft class="size-4" />
          </button>
          <button
            type="button"
            class="btn btn-icon absolute right-0 top-1/2 -translate-y-1/2"
            aria-label="Next photo"
            :disabled="atEnd"
            @click="go(1)"
          >
            <ChevronRight class="size-4" />
          </button>
        </div>

        <div class="shrink-0 pt-3">
          <p v-if="caption" class="mx-auto max-w-2xl text-center text-sm text-ink-2">
            {{ caption }}
          </p>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
