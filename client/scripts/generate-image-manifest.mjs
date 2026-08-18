/**
 * Prepares every screenshot under src/assets/portfolio for the web.
 *
 * The originals are up to 2400px and several megabytes, which is right for the
 * lightbox and wildly wrong for an 88px thumbnail in a list. For each one this
 * writes a set of smaller WebP renditions and records their sizes, so the page
 * can hand the browser a srcset and let it pick.
 *
 * It also bakes a 16px WebP of each image into the manifest as a data URI.
 * That is the blur-up placeholder: it arrives with the JS, so there is
 * something in the frame from the first paint instead of a coloured hole.
 *
 * Renditions land in src/assets/derived and are generated, not committed.
 * Animated GIFs are passed over; re-encoding them costs more than it saves.
 *
 * Run via `npm run images` (also part of `npm run build`).
 */
import { readdirSync, readFileSync, writeFileSync, statSync, mkdirSync, existsSync } from 'node:fs'
import { join, dirname, relative, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const derivedDir = join(root, 'src/assets/derived')
const outFile = join(root, 'src/data/image-sizes.generated.json')

/**
 * Where images live, and the prefix their manifest keys get.
 *
 * Project screenshots are keyed bare (`parchment/main.png`) because that is
 * what the manifest has always stored. Post images are keyed under `posts/` so
 * a post slug can never collide with a project name.
 */
const SOURCES = [
  { dir: join(root, 'src/assets/portfolio'), prefix: '' },
  { dir: join(root, 'src/assets/posts'), prefix: 'posts/' },
]

/** Widths worth having: a list thumbnail, a card, and a gallery tile at 2x. */
const WIDTHS = [400, 800, 1400]
const PLACEHOLDER_WIDTH = 16

/** @type {Record<string, { w: number, h: number, lqip?: string, srcset?: number[] }>} */
const manifest = {}

function collect(dir, files = []) {
  for (const entry of readdirSync(dir).sort()) {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) collect(path, files)
    else if (/\.(png|jpe?g|gif|webp|avif)$/i.test(entry)) files.push(path)
  }
  return files
}

const files = SOURCES.flatMap(({ dir, prefix }) =>
  existsSync(dir) ? collect(dir).map((path) => ({ path, key: prefix + relative(dir, path) })) : [],
)
let written = 0

for (const { path, key } of files) {
  const buffer = readFileSync(path)
  const image = sharp(buffer)
  const { width, height } = await image.metadata()

  if (!width || !height) {
    console.warn(`  ! could not read dimensions: ${key}`)
    continue
  }

  const entry = { w: width, h: height }

  // Animated GIFs keep their original file and get no placeholder.
  if (extname(path).toLowerCase() !== '.gif') {
    const stem = key.slice(0, -extname(key).length)
    const outDir = join(derivedDir, dirname(key))
    if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true })

    const widths = WIDTHS.filter((w) => w < width)
    for (const w of widths) {
      const target = join(derivedDir, `${stem}-${w}.webp`)
      if (!existsSync(target)) {
        await sharp(buffer).resize({ width: w }).webp({ quality: 78 }).toFile(target)
        written++
      }
    }
    if (widths.length) entry.srcset = widths

    const lqip = await sharp(buffer)
      .resize({ width: PLACEHOLDER_WIDTH })
      .webp({ quality: 40 })
      .toBuffer()
    entry.lqip = `data:image/webp;base64,${lqip.toString('base64')}`
  }

  manifest[key] = entry
}

writeFileSync(outFile, `${JSON.stringify(manifest, null, 2)}\n`)

const bytes = Buffer.byteLength(JSON.stringify(manifest))
console.log(
  `${files.length} images, ${written} new renditions, manifest ${(bytes / 1024).toFixed(1)} kB`,
)
