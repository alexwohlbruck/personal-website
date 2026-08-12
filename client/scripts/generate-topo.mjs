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

/**
 * Two sheets of terrain. The wide one runs behind the hero; the close one is
 * zoomed in with fewer lines, for panels where it sits behind centred text.
 * Different seeds so they read as two places, not one image used twice.
 */
const VARIANTS = [
  { file: 'topo.svg', width: 1600, height: 900, cols: 100, rows: 58, levels: 20, seed: 20260811, octaves: [3, 6, 12, 24] },
  { file: 'topo-close.svg', width: 1400, height: 600, cols: 76, rows: 34, levels: 13, seed: 88231, octaves: [2, 4, 8] },
]

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
function heightField(cols, rows, rand, octaves) {
  const field = new Float64Array(cols * rows)
  let amplitude = 1
  let total = 0

  for (const cells of octaves) {
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

/**
 * Chain segments into whole contours.
 *
 * Marching squares emits each crossing independently and in no useful order,
 * and a segment's two endpoints carry no inherent direction, so matching only
 * heads to tails leaves a ring split wherever a segment happens to be stored
 * backwards. This walks outward from both ends of a chain and will join to
 * either endpoint of a candidate, which is what closes the loops.
 */
function chain(segments) {
  const key = (p) => `${Math.round(p[0] * 1e4)},${Math.round(p[1] * 1e4)}`
  const ends = new Map()

  segments.forEach((seg, i) => {
    for (const end of [0, 1]) {
      const k = key(seg[end])
      if (!ends.has(k)) ends.set(k, [])
      ends.get(k).push({ i, end })
    }
  })

  const used = new Array(segments.length).fill(false)
  const lines = []

  const grow = (line, atTail) => {
    while (true) {
      const tip = atTail ? line[line.length - 1] : line[0]
      const next = (ends.get(key(tip)) ?? []).find((c) => !used[c.i])
      if (!next) break
      used[next.i] = true
      // Join to whichever end of the candidate is not the one we matched.
      const far = segments[next.i][1 - next.end]
      if (atTail) line.push(far)
      else line.unshift(far)
      if (line.length > 20000) break
    }
  }

  for (let i = 0; i < segments.length; i++) {
    if (used[i]) continue
    used[i] = true
    const line = [segments[i][0], segments[i][1]]
    grow(line, true)
    grow(line, false)
    lines.push({ points: line, closed: key(line[0]) === key(line[line.length - 1]) })
  }
  return lines
}

/** Drop points that sit on the line between their neighbours. */
function simplify(points, epsilon) {
  if (points.length < 3) return points
  const out = [points[0]]

  for (let i = 1; i < points.length - 1; i++) {
    const [ax, ay] = out[out.length - 1]
    const [bx, by] = points[i]
    const [cx, cy] = points[i + 1]
    const dx = cx - ax
    const dy = cy - ay
    const len = Math.hypot(dx, dy)
    const deviation = len === 0 ? 0 : Math.abs((bx - ax) * dy - (by - ay) * dx) / len
    if (deviation > epsilon) out.push(points[i])
  }

  out.push(points[points.length - 1])
  return out
}

/**
 * A polyline through midpoints, with the original vertices as quadratic control
 * points. Every joint is tangent-continuous, so the lattice corners that made
 * the contours look polygonal round away, at two coordinates per point.
 */
function smoothPath(points, closed, scaleX, scaleY) {
  const r = (v) => Math.round(v)
  const px = (p) => [p[0] * scaleX, p[1] * scaleY]
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]

  if (closed) {
    const ring = points.slice(0, -1).map(px)
    if (ring.length < 3) return null
    const start = mid(ring[ring.length - 1], ring[0])
    let d = `M${r(start[0])} ${r(start[1])}`
    for (let i = 0; i < ring.length; i++) {
      const cur = ring[i]
      const m = mid(cur, ring[(i + 1) % ring.length])
      d += `Q${r(cur[0])} ${r(cur[1])} ${r(m[0])} ${r(m[1])}`
    }
    return `${d}Z`
  }

  const line = points.map(px)
  if (line.length < 3) return null
  let d = `M${r(line[0][0])} ${r(line[0][1])}`
  for (let i = 1; i < line.length - 1; i++) {
    const m = mid(line[i], line[i + 1])
    d += `Q${r(line[i][0])} ${r(line[i][1])} ${r(m[0])} ${r(m[1])}`
  }
  const last = line[line.length - 1]
  return `${d}L${r(last[0])} ${r(last[1])}`
}

for (const variant of VARIANTS) {
  const { file, width, height, cols, rows, levels, seed, octaves } = variant
  const rand = mulberry32(seed)
  const field = heightField(cols, rows, rand, octaves)
  const scaleX = width / (cols - 1)
  const scaleY = height / (rows - 1)

  const paths = []
  let ringCount = 0
  let openCount = 0

  for (let i = 1; i < levels; i++) {
    // Nudge off exact sample values, where a cell is ambiguous and the trace
    // can split a ring in two.
    const level = i / levels + 1e-6

    const d = chain(trace(field, cols, rows, level))
      .filter(({ points, closed }) => {
        // A ring a fraction of a cell across is a numerical speck, not a summit.
        if (!closed) return true
        const xs = points.map((pt) => pt[0])
        const ys = points.map((pt) => pt[1])
        return Math.max(...xs) - Math.min(...xs) > 0.5 || Math.max(...ys) - Math.min(...ys) > 0.5
      })
      .map(({ points, closed }) => {
        const thinned = simplify(points, 0.06)
        const path = smoothPath(thinned, closed, scaleX, scaleY)
        if (path) closed ? ringCount++ : openCount++
        return path
      })
      .filter(Boolean)
      .join('')

    if (!d) continue

    // Every fifth line is an index contour, drawn heavier, as on a real map.
    const index = i % 5 === 0
    paths.push(`<path d="${d}" stroke-width="${index ? 2.2 : 1.1}" opacity="${index ? 1 : 0.62}"/>`)
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" fill="none" stroke="#000" stroke-linecap="round" stroke-linejoin="round">
${paths.join('\n')}
</svg>
`

  const out = join(dirname(fileURLToPath(import.meta.url)), '../src/assets/', file)
  writeFileSync(out, svg)
  console.log(
    `${file}: ${paths.length} levels, ${ringCount} rings, ${openCount} open, ${(svg.length / 1024).toFixed(1)} kB`,
  )
}
