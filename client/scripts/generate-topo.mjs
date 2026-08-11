/**
 * Draws a topographic contour map and writes it to src/assets/topo.svg.
 *
 * Concentric CSS gradients look like a target, not terrain. Real contours are
 * the level sets of a height field, so this builds one out of value noise and
 * traces it with marching squares. Nested, irregular, closing in on peaks and
 * basins, the way a survey map actually looks.
 *
 * Output is a mask: opaque strokes on transparency, so the page paints them in
 * whatever colour the theme wants. Deterministic, so it only needs running
 * again if the constants change.
 *
 *   node scripts/generate-topo.mjs
 */
import { writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const WIDTH = 1600
const HEIGHT = 900
/** Field resolution. Higher is smoother terrain and a bigger file. */
const COLS = 100
const ROWS = 58
/** Number of contour lines between the lowest and highest ground. */
const LEVELS = 20
const SEED = 20260811

function mulberry32(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const smooth = (t) => t * t * t * (t * (t * 6 - 15) + 10)
const lerp = (a, b, t) => a + (b - a) * t

/** One octave of value noise: random values on a coarse lattice, eased between. */
function octave(cols, rows, cells, rand) {
  const gw = cells + 1
  const grid = Array.from({ length: gw * gw }, rand)
  const out = new Float64Array(cols * rows)

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const fx = (x / (cols - 1)) * cells
      const fy = (y / (rows - 1)) * cells
      const x0 = Math.min(Math.floor(fx), cells - 1)
      const y0 = Math.min(Math.floor(fy), cells - 1)
      const tx = smooth(fx - x0)
      const ty = smooth(fy - y0)

      const top = lerp(grid[y0 * gw + x0], grid[y0 * gw + x0 + 1], tx)
      const bottom = lerp(grid[(y0 + 1) * gw + x0], grid[(y0 + 1) * gw + x0 + 1], tx)
      out[y * cols + x] = lerp(top, bottom, ty)
    }
  }
  return out
}

/** Stacked octaves, each finer and quieter than the last. */
function heightField(cols, rows, rand) {
  const field = new Float64Array(cols * rows)
  let amplitude = 1
  let total = 0

  for (const cells of [3, 6, 12, 24]) {
    const layer = octave(cols, rows, cells, rand)
    for (let i = 0; i < field.length; i++) field[i] += layer[i] * amplitude
    total += amplitude
    amplitude *= 0.5
  }

  let min = Infinity
  let max = -Infinity
  for (let i = 0; i < field.length; i++) {
    field[i] /= total
    if (field[i] < min) min = field[i]
    if (field[i] > max) max = field[i]
  }
  for (let i = 0; i < field.length; i++) field[i] = (field[i] - min) / (max - min)
  return field
}

/**
 * Marching squares. Each cell's four corners are above or below the level; the
 * resulting 4-bit case says which edges the contour crosses. Crossings are
 * placed by linear interpolation so the line lands between samples rather than
 * on the lattice, which is what keeps it from looking like pixel art.
 */
function trace(field, cols, rows, level) {
  const at = (x, y) => field[y * cols + x]
  const segments = []

  for (let y = 0; y < rows - 1; y++) {
    for (let x = 0; x < cols - 1; x++) {
      const tl = at(x, y)
      const tr = at(x + 1, y)
      const br = at(x + 1, y + 1)
      const bl = at(x, y + 1)

      const code =
        (tl > level ? 8 : 0) | (tr > level ? 4 : 0) | (br > level ? 2 : 0) | (bl > level ? 1 : 0)
      if (code === 0 || code === 15) continue

      const cross = (a, b) => (level - a) / (b - a)
      const top = () => [x + cross(tl, tr), y]
      const right = () => [x + 1, y + cross(tr, br)]
      const bottom = () => [x + cross(bl, br), y + 1]
      const left = () => [x, y + cross(tl, bl)]

      switch (code) {
        case 1:
        case 14:
          segments.push([left(), bottom()])
          break
        case 2:
        case 13:
          segments.push([bottom(), right()])
          break
        case 3:
        case 12:
          segments.push([left(), right()])
          break
        case 4:
        case 11:
          segments.push([top(), right()])
          break
        case 6:
        case 9:
          segments.push([top(), bottom()])
          break
        case 7:
        case 8:
          segments.push([left(), top()])
          break
        // Saddles: two crossings in one cell. Split them the same way every
        // time so neighbouring cells still chain up.
        case 5:
          segments.push([left(), top()], [bottom(), right()])
          break
        case 10:
          segments.push([top(), right()], [left(), bottom()])
          break
      }
    }
  }
  return segments
}

/** Chain segments end to end so the output is a few polylines, not thousands. */
function chain(segments) {
  const key = (p) => `${p[0].toFixed(4)},${p[1].toFixed(4)}`
  const starts = new Map()

  for (const seg of segments) {
    const k = key(seg[0])
    if (!starts.has(k)) starts.set(k, [])
    starts.get(k).push(seg)
  }

  const used = new Set()
  const lines = []

  for (const seg of segments) {
    if (used.has(seg)) continue
    used.add(seg)

    const line = [seg[0], seg[1]]
    let tail = seg[1]

    while (true) {
      const next = (starts.get(key(tail)) ?? []).find((candidate) => !used.has(candidate))
      if (!next) break
      used.add(next)
      line.push(next[1])
      tail = next[1]
      if (line.length > 4000) break
    }
    lines.push(line)
  }
  return lines
}

const rand = mulberry32(SEED)
const field = heightField(COLS, ROWS, rand)
const scaleX = WIDTH / (COLS - 1)
const scaleY = HEIGHT / (ROWS - 1)

const paths = []
let pointCount = 0

for (let i = 1; i < LEVELS; i++) {
  const level = i / LEVELS
  const lines = chain(trace(field, COLS, ROWS, level))
    // Two-point stubs are marching-squares noise, not landform.
    .filter((line) => line.length > 3)

  if (!lines.length) continue

  const d = lines
    .map((line) => {
      pointCount += line.length
      const points = line.map(([x, y]) => `${Math.round(x * scaleX)} ${Math.round(y * scaleY)}`)
      return `M${points.join('L')}`
    })
    .join('')

  // Every fifth line is an index contour, drawn heavier, as on a real map.
  const index = i % 5 === 0
  paths.push(
    `<path d="${d}" stroke-width="${index ? 2.2 : 1.1}" opacity="${index ? 1 : 0.62}"/>`,
  )
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" fill="none" stroke="#000" stroke-linecap="round" stroke-linejoin="round">
${paths.join('\n')}
</svg>
`

const out = join(dirname(fileURLToPath(import.meta.url)), '../src/assets/topo.svg')
writeFileSync(out, svg)
console.log(
  `Wrote ${paths.length} contour levels, ${pointCount} points, ${(svg.length / 1024).toFixed(1)} kB`,
)
