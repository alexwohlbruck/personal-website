<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useWindowScroll } from '@vueuse/core'
import { Motion, LayoutGroup } from 'motion-v'
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
  VisuallyHidden,
} from 'reka-ui'
import { Menu, Volume2, VolumeX, X } from '@lucide/vue'
import ThemeToggle from './ThemeToggle.vue'
import { ease } from '@/lib/motion'
import { site } from '@/data/site'
import { useLiveStore } from '@/stores/live'

const nav = [
  { name: 'projects', label: 'Projects' },
  { name: 'about', label: 'About' },
  { name: 'social', label: 'Social' },
  { name: 'contact', label: 'Contact' },
]

const route = useRoute()
const { y } = useWindowScroll()
const menuOpen = ref(false)
const live = useLiveStore()
const playing = computed(() => Boolean(live.spotify?.is_playing && live.spotify.item))
const track = computed(() => live.spotify?.item)
const artwork = computed(() => {
  const images = track.value?.album.images ?? []
  return images[images.length - 2]?.url ?? images[0]?.url
})

onMounted(() => void live.fetchSpotify())

watch(() => route.fullPath, () => (menuOpen.value = false))

function isActive(name: string) {
  // Detail pages keep their parent lit.
  return route.name === name || (name === 'projects' && route.name === 'project')
}

function togglePlayback() {
  live.toggleSpotifyAudio(live.spotify?.progress_ms ?? 0)
}
</script>

<template>
  <header
    class="fixed inset-x-0 top-0 z-40 transition-[background-color,box-shadow,backdrop-filter] duration-300 ease-out-quint"
    :class="
      y > 8
        ? 'border-b border-rule bg-paper/80 shadow-e1 backdrop-blur-xl'
        : 'border-b border-transparent'
    "
  >
    <div class="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 md:px-8">
      <RouterLink
        :to="{ name: 'home' }"
        class="group flex items-center gap-2.5"
        :aria-label="`${site.name}, home`"
      >
        <span
          class="grid size-7 place-items-center rounded-md bg-ink font-serif text-sm leading-none text-paper transition-transform duration-300 ease-out-quint group-hover:-rotate-6"
          style="box-shadow: var(--shadow-1)"
          aria-hidden="true"
        >
          A
        </span>
        <span class="title hidden text-[0.95rem] sm:block">{{ site.name }}</span>
      </RouterLink>

      <div class="flex items-center gap-1.5">
        <LayoutGroup>
          <nav class="mr-1 hidden items-center md:flex">
            <RouterLink
              v-for="item in nav"
              :key="item.name"
              :to="{ name: item.name }"
              class="label relative px-3 py-2 transition-colors duration-200"
              :class="isActive(item.name) ? 'text-ink' : 'text-ink-3 hover:text-ink'"
            >
              {{ item.label }}
              <Motion
                v-if="isActive(item.name)"
                layout-id="nav-underline"
                class="absolute inset-x-3 -bottom-px h-px bg-accent"
                :transition="{ duration: 0.35, ease }"
              />
            </RouterLink>
          </nav>
        </LayoutGroup>

        <button
          v-if="playing && track"
          type="button"
          class="group relative flex h-9 items-center overflow-hidden text-left transition-[width,padding,gap,border-color,background-color,box-shadow] duration-300 ease-out-quint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          :class="
            live.spotifyAudioPlaying
              ? 'w-9 justify-center rounded-md border border-transparent bg-transparent p-0 shadow-none sm:w-56 sm:justify-start sm:gap-2 sm:rounded-lg sm:border-rule sm:bg-paper-sunk/60 sm:py-1 sm:pl-1 sm:pr-2 sm:shadow-sm sm:hover:border-accent'
              : 'w-9 justify-center rounded-lg border border-rule bg-paper-sunk/60 p-0 shadow-sm hover:border-accent'
          "
          :aria-label="live.spotifyAudioPlaying ? `Mute ${track.name}` : `Unmute ${track.name}`"
          :aria-pressed="live.spotifyAudioPlaying"
          @click="togglePlayback"
        >
          <span
            class="shrink-0 overflow-hidden transition-[width,opacity,transform] duration-200 ease-out-quint"
            :class="
              live.spotifyAudioPlaying
                ? 'w-9 translate-x-0 opacity-100 delay-75 sm:w-7'
                : 'w-0 -translate-x-1 opacity-0'
            "
            aria-hidden="true"
          >
            <img
              v-if="artwork"
              :src="artwork"
              alt=""
              class="size-9 rounded-md object-cover shadow-sm sm:size-7 sm:rounded-[4px]"
            />
            <span v-else class="block size-9 rounded-md bg-paper sm:size-7 sm:rounded-[4px]" />
          </span>
          <span
            class="hidden min-w-0 transition-[width,opacity,transform] duration-200 ease-out-quint sm:block"
            :class="
              live.spotifyAudioPlaying
                ? 'flex-1 translate-x-0 opacity-100 delay-100'
                : 'pointer-events-none w-0 flex-none translate-x-1 opacity-0'
            "
          >
            <span class="block truncate text-xs font-medium">{{ track.name }}</span>
            <span class="block truncate text-[0.65rem] text-ink-3">{{ track.artists[0]?.name }}</span>
          </span>
          <Transition name="playback-icon" mode="out-in">
            <Volume2
              v-if="live.spotifyAudioPlaying"
              key="unmuted"
              class="absolute inset-0 z-10 m-auto size-3.5 shrink-0 text-paper drop-shadow-[0_1px_2px_rgba(0,0,0,0.72)] sm:static sm:m-0 sm:text-accent sm:drop-shadow-none"
            />
            <VolumeX
              v-else
              key="muted"
              class="absolute inset-0 z-10 m-auto size-3.5 shrink-0 text-ink-3 group-hover:text-accent sm:static sm:m-0"
            />
          </Transition>
        </button>

        <ThemeToggle />

        <DialogRoot v-model:open="menuOpen">
          <DialogTrigger as-child>
            <button type="button" class="btn btn-icon md:hidden" aria-label="Open menu">
              <Menu class="size-4" />
            </button>
          </DialogTrigger>

          <DialogPortal>
            <DialogOverlay
              class="fixed inset-0 z-50 bg-paper/70 backdrop-blur-md data-[state=closed]:animate-[fade-out_150ms_ease] data-[state=open]:animate-[fade-in_200ms_ease]"
            />
            <DialogContent
              class="fixed inset-x-3 top-3 z-50 origin-top rounded-2xl p-2 data-[state=closed]:animate-[sheet-out_180ms_ease] data-[state=open]:animate-[sheet-in_320ms_cubic-bezier(0.22,1,0.36,1)]"
              style="
                background-image: linear-gradient(to bottom, var(--surface), var(--surface-2));
                box-shadow: var(--sheen), var(--tile-ring), var(--shadow-3);
              "
            >
              <VisuallyHidden>
                <DialogTitle>Menu</DialogTitle>
                <DialogDescription>Site navigation</DialogDescription>
              </VisuallyHidden>

              <div class="flex items-center justify-between px-3 py-2">
                <span class="label text-ink-3">Menu</span>
                <DialogClose class="btn btn-icon btn-ghost" aria-label="Close menu">
                  <X class="size-4" />
                </DialogClose>
              </div>

              <nav class="flex flex-col">
                <RouterLink
                  v-for="item in nav"
                  :key="item.name"
                  :to="{ name: item.name }"
                  class="flex items-baseline justify-between border-t border-rule px-3 py-3.5"
                  :class="isActive(item.name) ? 'text-accent' : 'text-ink'"
                >
                  <span class="title text-2xl">{{ item.label }}</span>
                </RouterLink>
              </nav>
            </DialogContent>
          </DialogPortal>
        </DialogRoot>
      </div>
    </div>
  </header>
</template>

<style scoped>
.playback-icon-enter-active,
.playback-icon-leave-active {
  transition:
    opacity 160ms ease-out,
    transform 200ms cubic-bezier(0.22, 1, 0.36, 1),
    filter 160ms ease-out;
}

.playback-icon-enter-from,
.playback-icon-leave-to {
  opacity: 0;
  filter: blur(2px);
  transform: scale(0.72);
}

@media (prefers-reduced-motion: reduce) {
  .playback-icon-enter-active,
  .playback-icon-leave-active {
    transition: none;
  }
}
</style>
