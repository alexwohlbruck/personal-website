/// <reference types="vite-ssg" />
import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import markdown from 'unplugin-vue-markdown/vite'
import shiki from '@shikijs/markdown-it'
import tailwindcss from '@tailwindcss/vite'

const from = (path: string) => fileURLToPath(new URL(path, import.meta.url))

/**
 * The prerender pass needs the dynamic routes spelled out, and this file cannot
 * import the data modules to get them: those use `import.meta.glob`, which only
 * exists once Vite is running. So both lists are read off disk instead.
 */

/** Read from the project data rather than the content folder, so a project with
 *  no write-up yet still gets a page built. */
function projectSlugs(): string[] {
  const source = readFileSync(from('./src/data/projects.ts'), 'utf8')
  return [...source.matchAll(/^\s{4}name: '([a-z0-9-]+)',$/gm)].map((match) => match[1]!)
}

/** Drafts are filtered out of production at runtime, so they have no route to
 *  build and would only bake a "not found" page if we asked for one. */
function postSlugs(): string[] {
  let files: string[]
  try {
    files = readdirSync(from('./src/content/posts'))
  } catch {
    return []
  }
  return files
    .filter((file) => file.endsWith('.md'))
    .filter((file) => {
      const source = readFileSync(from(`./src/content/posts/${file}`), 'utf8')
      const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? ''
      return !/^draft:\s*true\s*$/m.test(frontmatter)
    })
    .map((file) => file.replace(/\.md$/, ''))
}

export default defineConfig({
  plugins: [
    // `.md` is compiled to a Vue SFC by the markdown plugin, so the Vue plugin
    // has to claim those files too.
    vue({ include: [/\.vue$/, /\.md$/] }),
    markdown({
      // The prose is a fragment; `RichText` supplies the one wrapper it needs.
      wrapperDiv: false,
      // Titles and meta come from the project record or the post frontmatter,
      // assembled in the view. Letting the plugin write its own head as well
      // would give two sources of truth for the same tags.
      headEnabled: false,
      markdownOptions: {
        // Widgets are Vue components in the source, so the raw HTML that
        // survives has been written deliberately.
        html: true,
        linkify: true,
        typographer: true,
      },
      async markdownSetup(md) {
        const highlight = await shiki({
          // Both themes are emitted as CSS variables on the same markup, so a
          // code block follows the theme toggle without a repaint or a second
          // copy of the highlighted HTML.
          themes: { light: 'vitesse-light', dark: 'vitesse-dark' },
          defaultColor: false,
          // Highlighting runs at build time; this list only bounds how many
          // grammars the build loads, never what ships to the browser.
          langs: [
            'bash',
            'css',
            'diff',
            'dotenv',
            'go',
            'html',
            'ini',
            'javascript',
            'json',
            'markdown',
            'python',
            'rust',
            'sql',
            'typescript',
            'vue',
            'yaml',
          ],
          // An unlisted language renders as plain text rather than failing the
          // build. Writing a post is not the moment to discover that a fence
          // tag is missing from a config file.
          //
          // Shiki resolves the plain-text pseudo-languages at runtime, but the
          // option's type only lists real grammars.
          // @ts-expect-error -- 'text' is accepted, just not declared
          fallbackLanguage: 'text',
        })

        // Shiki's plugin is typed against markdown-it. This plugin runs
        // markdown-exit, an API-compatible fork that ships its own types, so
        // the two describe the same object under different names.
        md.use(highlight as unknown as Parameters<typeof md.use>[0])

        /**
         * Open off-site links in a new tab, which is what `AppButton` already
         * does for an external `href`. Internal links are left alone: they are
         * routed client-side by `RichText`, and a new tab would reload the app.
         */
        const openLink =
          md.renderer.rules.link_open ??
          ((tokens, i, options, _env, self) => self.renderToken(tokens, i, options))

        md.renderer.rules.link_open = (tokens, i, options, env, self) => {
          const href = tokens[i]?.attrGet('href')
          if (href && /^https?:\/\//i.test(href)) {
            tokens[i]!.attrSet('target', '_blank')
            tokens[i]!.attrSet('rel', 'noopener noreferrer')
          }
          return openLink(tokens, i, options, env, self)
        }
      },
    }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 2000,
    allowedHosts: true,
  },
  ssgOptions: {
    // `/blog/x` becomes `blog/x/index.html`, so the pretty URL is the real path
    // rather than something the host has to rewrite into one.
    dirStyle: 'nested',
    formatting: 'minify',
    /**
     * The dynamic routes have to be expanded by hand, and two kinds of path are
     * deliberately left out.
     *
     * Redirects, because rendering one produces a full copy of its destination
     * at the old URL — which is the duplicate content the redirect exists to
     * avoid. They keep working at runtime.
     *
     * And `/guestbook`, because it statically imports `emoji-picker-element`,
     * which registers a custom element the moment it loads, and `lib/admin.ts`,
     * which reads localStorage at module scope. Neither survives Node. Since
     * every route component is lazily imported, leaving the path out means
     * those modules never load during the build; the page still works as a
     * normal client-rendered route, served by the `_redirects` fallback.
     */
    includedRoutes(paths, routes) {
      const redirects = new Set(
        routes.filter((route) => 'redirect' in route).map((route) => route.path),
      )
      const skipped = new Set(['/guestbook'])

      const fixed = paths.filter(
        (path) =>
          !path.includes(':') && !path.includes('*') && !redirects.has(path) && !skipped.has(path),
      )

      return [
        ...fixed,
        ...projectSlugs().map((slug) => `/projects/${slug}`),
        ...postSlugs().map((slug) => `/blog/${slug}`),
      ]
    },
  },
  build: {
    // Screenshots dominate the payload; keep JS chunks honest.
    chunkSizeWarningLimit: 700,
    // The brand marks are referenced from a shared module that every page
    // pulls in. Emitting them as files instead of data URIs keeps that module
    // small and lets the browser fetch each icon only when it renders one.
    assetsInlineLimit: (file) => (file.endsWith('.svg') ? false : undefined),
  },
})
