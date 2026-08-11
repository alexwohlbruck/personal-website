/**
 * Reads every screenshot under src/assets/portfolio and records its intrinsic
 * dimensions. The app uses these to reserve layout space before an image loads
 * and to give PhotoSwipe the sizes it needs for its zoom animation.
 *
 * Run via `npm run images` (also runs as part of `npm run build`).
 */
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs'
import { join, dirname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { imageSize } from 'image-size'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const portfolioDir = join(root, 'src/assets/portfolio')
const outFile = join(root, 'src/data/image-sizes.generated.json')

/** @type {Record<string, [number, number]>} */
const manifest = {}

function walk(dir) {
  for (const entry of readdirSync(dir).sort()) {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) {
      walk(path)
      continue
    }
    if (!/\.(png|jpe?g|gif|webp|avif)$/i.test(entry)) continue

    const { width, height } = imageSize(readFileSync(path))
    if (!width || !height) {
      console.warn(`  ! could not read dimensions: ${entry}`)
      continue
    }
    // Key by "project/file.png" so lookups mirror the project data.
    manifest[relative(portfolioDir, path)] = [width, height]
  }
}

walk(portfolioDir)
writeFileSync(outFile, `${JSON.stringify(manifest, null, 2)}\n`)
console.log(`Wrote ${Object.keys(manifest).length} image sizes to ${relative(root, outFile)}`)
