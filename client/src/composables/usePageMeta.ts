import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import { useHead } from '@unhead/vue'
import { useRoute } from 'vue-router'
import { site } from '@/data/site'

interface PageMeta {
  /** Omit on the home page, where the site name is the whole title. */
  title?: MaybeRefOrGetter<string | undefined>
  description?: MaybeRefOrGetter<string | undefined>
  /** `article` for a blog post, `website` for everything else. */
  type?: MaybeRefOrGetter<'website' | 'article'>
  /** ISO date, for `article:published_time`. */
  published?: MaybeRefOrGetter<string | undefined>
}

/**
 * Per-page title, description and Open Graph tags.
 *
 * These are written by unhead rather than by hand so the prerender pass bakes
 * them into each generated file. That is the whole point of the exercise: the
 * crawlers that unfurl a shared link do not run JavaScript, so a tag that only
 * ever appears after hydration may as well not exist.
 *
 * A view calling this overrides the route-level default set in `App.vue`.
 */
export function usePageMeta(meta: PageMeta = {}) {
  const route = useRoute()

  const title = computed(() => {
    const own = toValue(meta.title)
    return own ? `${own} · ${site.name}` : `${site.name} · ${site.role}`
  })

  const description = computed(() => toValue(meta.description) ?? site.statement)
  const url = computed(() => `${site.url}${route.path}`)

  useHead({
    title,
    link: [{ rel: 'canonical', href: url }],
    meta: [
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:url', content: url },
      { property: 'og:type', content: computed(() => toValue(meta.type) ?? 'website') },
      {
        property: 'article:published_time',
        content: computed(() => toValue(meta.published)),
      },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
    ],
  })
}
