import type { Component } from 'vue'

export interface Post {
  /** From the filename, so the URL is chosen by naming the file. */
  slug: string
  title: string
  date: Date
  /** One line for the index, the meta description and the feed. */
  summary: string
  tags: string[]
  /** Name of the run this post belongs to, e.g. "Parchment devlog". */
  series?: string
  /** Position within the series. Ordering falls back to the date without it. */
  part?: number
  /** Kept out of production builds, but visible while running locally. */
  draft: boolean
  /** The prose, compiled to a component. */
  body: Component
}

/**
 * The compiler turns each frontmatter key into its own named export rather than
 * bundling them into one object, so the module *is* the frontmatter, with the
 * body alongside it under `default`.
 */
interface PostModule extends Record<string, unknown> {
  default: Component
}

/**
 * Same arrangement as the project write-ups: markdown compiled to components at
 * build time, loaded eagerly. The index needs every post's frontmatter anyway,
 * so a lazy glob would only defer the bodies while still resolving the rest.
 */
const modules = import.meta.glob('../content/posts/*.md', { eager: true }) as Record<
  string,
  PostModule
>

function toDate(value: unknown, slug: string): Date {
  if (value instanceof Date) return value

  // YAML resolves a bare `2026-08-17` to a Date, which the compiler then writes
  // out as an ISO string at UTC midnight. Read the calendar date back off the
  // front and rebuild it locally: passing the ISO string to `new Date` would
  // land on the previous evening in any western timezone and date a post a day
  // early. Both that form and a quoted `'2026-08-17'` are handled here.
  if (typeof value === 'string') {
    const parts = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (parts) return new Date(Number(parts[1]), Number(parts[2]) - 1, Number(parts[3]))
  }

  console.warn(`[posts] ${slug} has no usable \`date\` in its frontmatter`)
  return new Date(0)
}

function toPost(path: string, matter: PostModule): Post {
  const slug = path.split('/').pop()!.replace(/\.md$/, '')

  if (!matter.title) console.warn(`[posts] ${slug} has no \`title\` in its frontmatter`)

  return {
    slug,
    title: String(matter.title ?? slug),
    date: toDate(matter.date, slug),
    summary: String(matter.summary ?? ''),
    tags: Array.isArray(matter.tags) ? matter.tags.map(String) : [],
    series: matter.series ? String(matter.series) : undefined,
    part: typeof matter.part === 'number' ? matter.part : undefined,
    draft: matter.draft === true,
    body: matter.default,
  }
}

/** Newest first. Drafts are dropped from production builds only. */
export const posts: Post[] = Object.entries(modules)
  .map(([path, module]) => toPost(path, module))
  .filter((post) => import.meta.env.DEV || !post.draft)
  .sort((a, b) => b.date.getTime() - a.date.getTime())

export function findPost(slug: string): Post | undefined {
  return posts.find((post) => post.slug === slug)
}

/** Every post in a run, in reading order. Parts before dates, first part first. */
export function seriesPosts(series: string): Post[] {
  return posts
    .filter((post) => post.series === series)
    .sort((a, b) => (a.part ?? 0) - (b.part ?? 0) || a.date.getTime() - b.date.getTime())
}

/**
 * Where a post sits in its series, or undefined if it belongs to none.
 * `index` is zero-based; `part` is what the reader sees.
 */
export function seriesPosition(post: Post) {
  if (!post.series) return undefined
  const entries = seriesPosts(post.series)
  const index = entries.findIndex((entry) => entry.slug === post.slug)
  if (index === -1) return undefined
  return { series: post.series, entries, index, part: index + 1, total: entries.length }
}

/**
 * The previous and next post.
 *
 * Inside a series this walks the series in reading order and stops at both
 * ends, because a run of posts has a real first and last. Everywhere else it
 * walks the whole blog by date and wraps, so a footer never dead-ends.
 */
export function adjacentPosts(slug: string) {
  const post = findPost(slug)
  const position = post ? seriesPosition(post) : undefined

  if (position && position.total > 1) {
    return {
      previous: position.entries[position.index - 1],
      next: position.entries[position.index + 1],
    }
  }

  const index = posts.findIndex((entry) => entry.slug === slug)
  if (index === -1 || posts.length < 2) return { previous: undefined, next: undefined }
  return {
    previous: posts[(index - 1 + posts.length) % posts.length],
    next: posts[(index + 1) % posts.length],
  }
}

/** Every tag in use, most-used first. */
export function postTags(): string[] {
  const counts = new Map<string, number>()
  for (const post of posts) {
    for (const tag of post.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1)
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([tag]) => tag)
}

/** "17 August 2026" — long form, for a dateline. */
export function postDate(date: Date): string {
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
}
