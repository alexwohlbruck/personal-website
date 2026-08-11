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

/** Intrinsic size from the generated manifest, so layout can be reserved up front. */
export function projectImageSize(project: string, file: string): { width: number; height: number } {
  const size = (imageSizes as unknown as Record<string, [number, number]>)[`${project}/${file}`]
  return size ? { width: size[0], height: size[1] } : { width: 1600, height: 1000 }
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
