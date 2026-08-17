/**
 * Writes dist/feed.xml and dist/sitemap.xml after the build.
 *
 * Both are derived from the same two sources the site itself reads: the post
 * frontmatter under src/content/posts and the project list in src/data. Nothing
 * here is committed, and nothing here is a second place to keep the content.
 *
 * The feed carries summaries rather than full posts. Rendering the markdown a
 * second time, outside Vite, would mean a second markdown pipeline that could
 * drift from the one that makes the pages.
 *
 * Run as part of `npm run build`.
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const postsDir = join(root, 'src/content/posts')
const distDir = join(root, 'dist')

const SITE = 'https://alex.wohlbruck.com'
const AUTHOR = 'Alex Wohlbruck'
const TITLE = `${AUTHOR} · Writing`
const DESCRIPTION = 'Notes on maps, the web, and whatever I have been taking apart lately.'

function escape(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Enough YAML for the frontmatter this site actually writes: flat scalars and
 * inline lists. A post needing more than that wants a real parser.
 */
function parseFrontmatter(source) {
  const block = source.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1]
  if (!block) return {}

  const data = {}
  for (const line of block.split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/)
    if (!match) continue
    const [, key] = match
    let value = match[2].trim().replace(/^['"]|['"]$/g, '')

    if (value.startsWith('[')) {
      data[key] = value
        .slice(1, -1)
        .split(',')
        .map((item) => item.trim().replace(/^['"]|['"]$/g, ''))
        .filter(Boolean)
    } else if (value === 'true' || value === 'false') {
      data[key] = value === 'true'
    } else {
      data[key] = value
    }
  }
  return data
}

function readPosts() {
  if (!existsSync(postsDir)) return []

  return readdirSync(postsDir)
    .filter((file) => file.endsWith('.md'))
    .map((file) => {
      const matter = parseFrontmatter(readFileSync(join(postsDir, file), 'utf8'))
      return {
        slug: file.replace(/\.md$/, ''),
        title: matter.title ?? file,
        summary: matter.summary ?? '',
        // Noon rather than midnight, so the date cannot slip either way when a
        // reader's timezone shifts it.
        date: new Date(`${matter.date}T12:00:00Z`),
        draft: matter.draft === true,
      }
    })
    .filter((post) => !post.draft && !Number.isNaN(post.date.getTime()))
    .sort((a, b) => b.date - a.date)
}

function projectSlugs() {
  const source = readFileSync(join(root, 'src/data/projects.ts'), 'utf8')
  return [...source.matchAll(/^\s{4}name: '([a-z0-9-]+)',$/gm)].map((match) => match[1])
}

const posts = readPosts()

// RSS ------------------------------------------------------------------------

const updated = posts[0]?.date ?? new Date()

const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escape(TITLE)}</title>
    <link>${SITE}/blog</link>
    <description>${escape(DESCRIPTION)}</description>
    <language>en</language>
    <lastBuildDate>${updated.toUTCString()}</lastBuildDate>
    <atom:link href="${SITE}/feed.xml" rel="self" type="application/rss+xml"/>
${posts
  .map(
    (post) => `    <item>
      <title>${escape(post.title)}</title>
      <link>${SITE}/blog/${post.slug}</link>
      <guid isPermaLink="true">${SITE}/blog/${post.slug}</guid>
      <pubDate>${post.date.toUTCString()}</pubDate>
      <description>${escape(post.summary)}</description>
    </item>`,
  )
  .join('\n')}
  </channel>
</rss>
`

// Sitemap --------------------------------------------------------------------

const staticPaths = ['/', '/projects', '/blog', '/about', '/social', '/contact', '/guestbook']

const urls = [
  ...staticPaths,
  ...projectSlugs().map((slug) => `/projects/${slug}`),
  ...posts.map((post) => `/blog/${post.slug}`),
]

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((path) => `  <url><loc>${SITE}${path}</loc></url>`).join('\n')}
</urlset>
`

if (!existsSync(distDir)) {
  console.error('[feed] no dist/ — run this after the build')
  process.exit(1)
}

writeFileSync(join(distDir, 'feed.xml'), feed)
writeFileSync(join(distDir, 'sitemap.xml'), sitemap)

console.log(`[feed] ${posts.length} post(s) in feed.xml, ${urls.length} URLs in sitemap.xml`)
