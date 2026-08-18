import { computed, ref, watch } from 'vue'
import { usePreferredDark } from '@vueuse/core'

export type ThemeSetting = 'system' | 'light' | 'dark'

const STORAGE_KEY = 'theme'

function stored(): ThemeSetting {
  // This module is pulled in by the header, so it loads on every route,
  // including under the prerender pass where there is no storage to read.
  if (import.meta.env.SSR) return 'system'
  const value = localStorage.getItem(STORAGE_KEY)
  return value === 'light' || value === 'dark' ? value : 'system'
}

// Module scope: one source of truth shared by every consumer.
const setting = ref<ThemeSetting>(stored())
const prefersDark = usePreferredDark()

const resolved = computed<'light' | 'dark'>(() =>
  setting.value === 'system' ? (prefersDark.value ? 'dark' : 'light') : setting.value,
)

if (!import.meta.env.SSR) {
  watch(
    resolved,
    (theme) => {
      document.documentElement.dataset.theme = theme
    },
    { immediate: true },
  )

  watch(setting, (value) => {
    if (value === 'system') localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, value)
  })
}

/**
 * Follows the OS by default; the toggle pins a preference until the user cycles
 * back round to `system`.
 */
export function useTheme() {
  function cycle() {
    const order: ThemeSetting[] = ['system', 'light', 'dark']
    setting.value = order[(order.indexOf(setting.value) + 1) % order.length]!
  }

  return { setting, resolved, cycle }
}
