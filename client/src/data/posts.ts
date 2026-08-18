import type { Component } from 'vue'
import { findProject } from './projects'

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
  // Newest first. Entries published on the same day fall back to their part
  // number, so a series posted in one go still reads from the beginning rather
  // than in whatever order the filenames happen to sort.
  .sort((a, b) => b.date.getTime() - a.date.getTime() || (a.part ?? 0) - (b.part ?? 0))

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

/**
 * The project a tag names, if it names one.
 *
 * A tag matching a project's slug is treated as a reference to that project
 * rather than as a free-text label, so `barrelman` on a post and the Barrelman
 * project are the same thing to the site.
 */
export function tagProject(tag: string) {
  return findProject(tag)
}

/** Projects show their real title. Everything else shows the tag as written. */
export function postTagLabel(tag: string): string {
  return tagProject(tag)?.title ?? tag
}

/**
 * Posts that reference a project, in reading order.
 *
 * Parts first, so a devlog reads from the beginning on the project page. A post
 * with no part falls back to its date.
 */
export function postsForProject(project: string): Post[] {
  return posts
    .filter((post) => post.tags.includes(project))
    .sort((a, b) => (a.part ?? 0) - (b.part ?? 0) || a.date.getTime() - b.date.getTime())
}

/** One row of a project's writing list: a whole series, or a single post. */
export type ProjectWriting =
  | { kind: 'series'; key: string; series: string; entries: Post[]; start: Post; updated: Date }
  | { kind: 'post'; key: string; post: Post; updated: Date }

/**
 * What a project page lists under "Writing".
 *
 * A series collapses to one row. Five devlog entries on a project page push
 * everything else off the screen and say the same thing five times, so the run
 * is named once and the reader opens it at part one. Standalone posts stay as
 * they are.
 *
 * Newest activity first, so an updated series rises back to the top.
 */
export function writingForProject(project: string): ProjectWriting[] {
  const rows: ProjectWriting[] = []
  const seen = new Map<string, Extract<ProjectWriting, { kind: 'series' }>>()

  for (const post of postsForProject(project)) {
    if (!post.series) {
      rows.push({ kind: 'post', key: post.slug, post, updated: post.date })
      continue
    }

    const existing = seen.get(post.series)
    if (existing) {
      existing.entries.push(post)
      if (post.date > existing.updated) existing.updated = post.date
      continue
    }

    // `postsForProject` is already in reading order, so the first one seen is
    // the entry point into the run.
    const row = {
      kind: 'series' as const,
      key: `series:${post.series}`,
      series: post.series,
      entries: [post],
      start: post,
      updated: post.date,
    }
    seen.set(post.series, row)
    rows.push(row)
  }

  return rows
    .map((row) =>
      // One entry is not a run. If only a single part of a series mentions this
      // project, name the entry rather than the series it happens to belong to.
      row.kind === 'series' && row.entries.length === 1
        ? { kind: 'post' as const, key: row.start.slug, post: row.start, updated: row.updated }
        : row,
    )
    .sort((a, b) => b.updated.getTime() - a.updated.getTime())
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
