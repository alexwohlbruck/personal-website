import type { App, Component } from 'vue'

/**
 * The widgets a markdown file may use by name. Registered globally rather than
 * imported per file: compiled markdown has no import list of its own unless the
 * author writes a `<script setup>` block, and asking for one at the top of every
 * write-up would defeat the point of writing in markdown.
 *
 * Anything dropped in `components/content/` becomes available under its
 * filename, so `Callout.vue` is `<Callout>`.
 */
const widgets = import.meta.glob('../components/content/*.vue', {
  eager: true,
  import: 'default',
}) as Record<string, Component>

export function registerContentComponents(app: App) {
  for (const [path, component] of Object.entries(widgets)) {
    const name = path.split('/').pop()?.replace(/\.vue$/, '')
    if (name) app.component(name, component)
  }
}
