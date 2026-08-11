import imageSizes from '@/data/image-sizes.generated.json'

/**
 * Vite resolves these globs at build time, so every screenshot and icon ends up
 * content-hashed in the output rather than referenced by a runtime path.
 */
const portfolioUrls = import.meta.glob('../assets/portfolio/**/*.{png,jpg,jpeg,gif,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

const assetUrls = import.meta.glob('../assets/{svg,img}/*.{svg,png,jpg,jpeg}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

/** WebP renditions written by scripts/generate-image-manifest.mjs. */
const derivedUrls = import.meta.glob('../assets/derived/**/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

/**
 * Only the single-colour icons get inlined as source. They need to inherit
 * `currentColor` to work in both themes. The brand marks stay as `<img>` URLs
 * so their gradients (and their file size) stay out of the JS bundle.
 */
const rawSvgs = import.meta.glob(
  '../assets/svg/{at,github,linkedin,instagram,spotify,musescore,strava,osm,twitter}.svg',
  { eager: true, query: '?raw', import: 'default' },
) as Record<string, string>

function keyBy(record: Record<string, string>, marker: string) {
  const out: Record<string, string> = {}
  for (const [path, value] of Object.entries(record)) {
    const key = path.split(marker)[1]
    if (key) out[key] = value
  }
  return out
}

const portfolio = keyBy(portfolioUrls, '/assets/portfolio/')
const derived = keyBy(derivedUrls, '/assets/derived/')
const assets = keyBy(assetUrls, '/assets/')
const svgSource = keyBy(rawSvgs, '/assets/svg/')

/** `assetUrl('svg/parchment.svg')`. Mirrors the paths stored in project data. */
export function assetUrl(path: string): string {
  return assets[path] ?? ''
}

/** `projectImage('parchment', 'main.png')` */
export function projectImage(project: string, file: string): string {
  return portfolio[`${project}/${file}`] ?? ''
}

interface ImageMeta {
  w: number
  h: number
  /** Widths of the generated WebP renditions. */
  srcset?: number[]
  /** 16px WebP as a data URI, for the blur-up. */
  lqip?: string
}

const meta = imageSizes as unknown as Record<string, ImageMeta>

/** Intrinsic size from the generated manifest, so layout can be reserved up front. */
export function projectImageSize(project: string, file: string): { width: number; height: number } {
  const entry = meta[`${project}/${file}`]
  return entry ? { width: entry.w, height: entry.h } : { width: 1600, height: 1000 }
}

export interface ImageSource {
  src: string
  srcset?: string
  width: number
  height: number
  lqip?: string
}

/**
 * Everything an `<img>` needs to avoid shipping a 2400px screenshot into an
 * 88px slot: the renditions as a srcset, the intrinsic size, and the blur-up.
 * `src` points at a middle rendition rather than the original, so a browser
 * that ignores srcset still gets something reasonable at either extreme. The
 * original stays reachable through `projectImage` for the lightbox.
 */
export function projectImageSet(project: string, file: string): ImageSource {
  const entry = meta[`${project}/${file}`]
  const original = projectImage(project, file)
  if (!entry) return { src: original, width: 1600, height: 1000 }

  const base = { width: entry.w, height: entry.h, lqip: entry.lqip }
  if (!entry.srcset?.length) return { src: original, ...base }

  const stem = file.slice(0, file.lastIndexOf('.'))
  const renditions = entry.srcset
    .map((w) => ({ w, url: derived[`${project}/${stem}-${w}.webp`] }))
    .filter((r): r is { w: number; url: string } => Boolean(r.url))

  if (!renditions.length) return { src: original, ...base }

  const srcset = [...renditions.map((r) => `${r.url} ${r.w}w`), `${original} ${entry.w}w`].join(', ')
  const fallback = renditions[Math.min(1, renditions.length - 1)]!
  return { src: fallback.url, srcset, ...base }
}

/**
 * The single-colour icons were exported from Illustrator with a `<style>` block
 * and `.st0` class names. Inlining several of those on one page would let their
 * rules collide, so strip the styling entirely and let the paths inherit
 * `currentColor` from the root, which is what makes them theme-aware.
 */
export function inlineIcon(name: string): string {
  const source = svgSource[`${name}.svg`]
  if (!source) return ''

  return source
    .replace(/<\?xml[\s\S]*?\?>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/\sclass="[^"]*"/g, '')
    .replace(/<svg\b[^>]*>/, (tag) =>
      tag
        .replace(/\s(?:id|style|width|height|x|y|fill)="[^"]*"/g, '')
        .replace(/<svg/, '<svg fill="currentColor" aria-hidden="true" focusable="false"'),
    )
    .trim()
}
