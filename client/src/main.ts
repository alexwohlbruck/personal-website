import { ViteSSG } from 'vite-ssg'
import { createPinia } from 'pinia'

import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '@/styles/main.css'

import App from './App.vue'
import { routes, scrollBehavior } from './router'
import { registerContentComponents } from '@/lib/content'
import { initAnalytics, trackPageView } from '@/lib/analytics'

/**
 * ViteSSG rather than createApp: the build renders each route to a static file
 * and the same factory then hydrates it in the browser. It owns the router, so
 * it takes the route table instead of a ready-made one.
 */
export const createApp = ViteSSG(App, { routes, scrollBehavior }, ({ app, router }) => {
  app.use(createPinia())
  // Markdown has no import list of its own, so its widgets are resolved by name.
  registerContentComponents(app)

  // `import.meta.env.SSR` is a compile-time constant, so none of this reaches
  // the prerender pass — where there is no document to give a title to.
  if (!import.meta.env.SSR) {
    // Before the first navigation, so gtag is queued and ready for its page view.
    initAnalytics()

    // unhead writes the title during the same tick, so read it on the next one.
    // Fires on the initial navigation too, which is why gtag's own page view is
    // switched off in initAnalytics.
    router.afterEach(() => {
      requestAnimationFrame(() => trackPageView(document.title))
    })
  }
})
