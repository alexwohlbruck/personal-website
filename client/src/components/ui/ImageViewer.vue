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
import { ease } from '@/lib/motion'

/**
 * One image, full size, with the rest of the set either side of it.
 *
 * This replaced PhotoSwipe. PhotoSwipe wants the dimensions of every image up
 * front, which is fine for project screenshots measured at build time and
 * impossible for Instagram, whose API reports none: the only way to learn them
 * would be to download every full size photo in order to open one. Sizing the
 * frame and letting the image fit inside needs no dimensions from anybody, so
 * both galleries can share this.
 */
export interface ViewerImage {
  key: string
  url: string
  caption?: string
  /** A blurred inline preview to hold the frame while the full image decodes. */
  placeholder?: string
  /** Position within a subgroup, e.g. which photo of an album this is. */
  position?: number
  total?: number
}

const props = defineProps<{
  images: ViewerImage[]
  index: number | null
  /** Announced to screen readers as the name of the set. */
  label?: string
}>()

const emit = defineEmits<{ close: []; seek: [index: number]; end: [] }>()

const open = computed({
  get: () => props.index !== null,
  set: (value) => {
    if (!value) emit('close')
  },
})

const current = computed(() => (props.index === null ? undefined : props.images[props.index]))
const caption = computed(() => current.value?.caption?.trim() ?? '')

const atStart = computed(() => props.index === 0)
const atEnd = computed(() => props.index !== null && props.index >= props.images.length - 1)

function go(step: number) {
  if (props.index === null || !props.images.length) return
  const next = props.index + step
  if (next < 0) return
  // Past the last loaded image, ask for more rather than wrapping to the start.
  // Galleries with everything already loaded simply ignore this.
  if (next >= props.images.length) return emit('end')
  emit('seek', next)
}

/** Nearing the end of what is loaded, ask for the next page before it is needed. */
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

/**
 * The neighbours either side. Preloading one in each direction makes a page
 * turn instant without pulling a whole gallery into memory.
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
        pointer-events-none while closed. Both of these cover the whole screen
        and stay mounted until their exit animation ends, so a tab that never
        runs that animation would leave an invisible closed dialog on top of the
        page eating every click.
      -->
      <DialogOverlay
        class="fixed inset-0 z-50 bg-paper/80 backdrop-blur-md data-[state=closed]:pointer-events-none data-[state=closed]:animate-[fade-out_150ms_ease] data-[state=open]:animate-[fade-in_200ms_ease]"
      />
      <DialogContent
        class="fixed inset-0 z-50 flex flex-col p-3 outline-none data-[state=closed]:pointer-events-none data-[state=closed]:animate-[fade-out_150ms_ease] data-[state=open]:animate-[fade-in_200ms_ease] sm:p-6"
        @keydown="onKey"
      >
        <VisuallyHidden>
          <DialogTitle>{{ label ?? 'Image' }}</DialogTitle>
          <DialogDescription>{{ caption || label || 'A larger view' }}</DialogDescription>
        </VisuallyHidden>

        <div class="flex shrink-0 items-center justify-between gap-4 pb-3">
          <span class="tabular label text-ink-3">
            <template v-if="current?.total && current.total > 1">
              {{ current.position }} / {{ current.total }}
            </template>
            <template v-else-if="index !== null && images.length > 1">
              {{ index + 1 }} / {{ images.length }}
            </template>
          </span>

          <div class="flex items-center gap-2">
            <!-- Somewhere for a gallery to put its own link, e.g. the original post. -->
            <slot name="action" :image="current" />
            <button
              type="button"
              class="btn btn-icon btn-ghost"
              aria-label="Close"
              @click="emit('close')"
            >
              <X class="size-4" />
            </button>
          </div>
        </div>

        <div class="relative flex min-h-0 flex-1 items-center justify-center">
          <template v-if="current">
            <!-- Blurred stand-in behind the real image, where one is available. -->
            <img
              v-if="current.placeholder"
              :key="`${current.key}-placeholder`"
              :src="current.placeholder"
              alt=""
              aria-hidden="true"
              class="absolute max-h-full max-w-full rounded-xl object-contain blur-xl"
            />
            <Motion
              :key="current.key"
              as="img"
              :src="current.url"
              :alt="caption ? caption.slice(0, 120) : (label ?? 'Image')"
              decoding="async"
              :initial="{ opacity: 0, scale: 0.985 }"
              :animate="{ opacity: 1, scale: 1 }"
              :transition="{ duration: 0.28, ease }"
              class="relative max-h-full max-w-full rounded-xl object-contain"
              style="box-shadow: var(--shadow-3)"
            />
          </template>

          <img
            v-for="url in preload"
            :key="url"
            :src="url"
            alt=""
            aria-hidden="true"
            class="hidden"
          />

          <button
            type="button"
            class="btn btn-icon absolute left-0 top-1/2 -translate-y-1/2"
            aria-label="Previous image"
            :disabled="atStart"
            @click="go(-1)"
          >
            <ChevronLeft class="size-4" />
          </button>
          <button
            type="button"
            class="btn btn-icon absolute right-0 top-1/2 -translate-y-1/2"
            aria-label="Next image"
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
