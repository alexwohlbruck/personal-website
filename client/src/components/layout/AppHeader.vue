<script setup lang="ts">
import { ref, watch } from 'vue'
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
import { Menu, X } from '@lucide/vue'
import ThemeToggle from './ThemeToggle.vue'
import { ease } from '@/lib/motion'
import { site } from '@/data/site'

const nav = [
  { name: 'projects', label: 'Projects' },
  { name: 'about', label: 'About' },
  { name: 'social', label: 'Social' },
  { name: 'contact', label: 'Contact' },
]

const route = useRoute()
const { y } = useWindowScroll()
const menuOpen = ref(false)

watch(() => route.fullPath, () => (menuOpen.value = false))

function isActive(name: string) {
  // Detail pages keep their parent lit.
  return route.name === name || (name === 'projects' && route.name === 'project')
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
