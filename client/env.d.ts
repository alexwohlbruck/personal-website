/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BACKEND_URL?: string
  readonly VITE_JUKEBOX_URL?: string
  readonly VITE_GA_MEASUREMENT_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

/**
 * Prose, compiled to a Vue component by unplugin-vue-markdown.
 *
 * Each frontmatter key also becomes its own named export, which cannot be
 * declared ahead of time because it differs per file. `src/data/posts.ts` reads
 * them off the module namespace and narrows them there.
 */
declare module '*.md' {
  import type { DefineComponent } from 'vue'

  const component: DefineComponent<Record<string, never>, Record<string, never>, unknown>
  export default component
}
