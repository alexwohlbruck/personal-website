/**
 * The hero's contour map as data rather than a picture.
 *
 * scripts/generate-topo.mjs bakes the same terrain into src/assets/topo.svg by
 * tracing it with marching squares. That file is still what the page falls back
 * to. But a traced path can only be pushed around as a whole, and the hero
 * wants the terrain itself to move — so this rebuilds the height field the
 * generator started from, ready to be handed to a shader that contours it every
 * frame instead of once at build time.
 *
 * The constants, the seed and the order the random numbers are drawn in all
 * have to match the generator exactly, or the live map is a different place
 * from the static one.
 */

export const TOPO = {
  width: 1600,
  height: 900,
  /** The lattice the generator sampled on, and so the window it normalised over. */
  cols: 100,
  rows: 58,
  levels: 20,
  seed: 20260811,
  octaves: [3, 6, 12, 24],
} as const

export interface TopoField {
  /**
   * Every octave's lattice of random values, stacked into one square texture:
   * `band` wide, one `band`-tall block per octave, top-left corner used and the
   * rest left at zero. Small enough that the padding costs nothing and the
   * shader can find any corner with a single texelFetch.
   */
  lattice: Float32Array
  band: number
  octaves: number
  /** Normalisation window of the summed octaves, over the generator's grid. */
  min: number
  max: number
  /** Sum of the octave amplitudes, which the raw sum is divided by first. */
  total: number
}

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const smooth = (t: number) => t * t * t * (t * (t * 6 - 15) + 10)

/** One octave: eased bilinear interpolation of the lattice, at any point. */
function sample(grid: Float32Array, cells: number, u: number, v: number) {
  const gw = cells + 1
  const fx = u * cells
  const fy = v * cells
  const x0 = Math.min(Math.floor(fx), cells - 1)
  const y0 = Math.min(Math.floor(fy), cells - 1)
  const tx = smooth(fx - x0)
  const ty = smooth(fy - y0)

  const top = grid[y0 * gw + x0]! + (grid[y0 * gw + x0 + 1]! - grid[y0 * gw + x0]!) * tx
  const a = grid[(y0 + 1) * gw + x0]!
  const bottom = a + (grid[(y0 + 1) * gw + x0 + 1]! - a) * tx
  return top + (bottom - top) * ty
}

export function buildTopoField(): TopoField {
  const { seed, octaves, cols, rows } = TOPO
  const rand = mulberry32(seed)

  // Drawn octave by octave, coarsest first, exactly as the generator draws them.
  const grids = octaves.map((cells) => Float32Array.from({ length: (cells + 1) ** 2 }, rand))

  const band = Math.max(...octaves) + 1
  const lattice = new Float32Array(band * band * octaves.length)
  grids.forEach((grid, o) => {
    const gw = octaves[o]! + 1
    for (let y = 0; y < gw; y++) {
      for (let x = 0; x < gw; x++) lattice[(o * band + y) * band + x] = grid[y * gw + x]!
    }
  })

  let total = 0
  for (let o = 0, amp = 1; o < octaves.length; o++, amp *= 0.5) total += amp

  // The generator rescaled the field to 0..1 using the extremes it happened to
  // see on its own sample grid, and the contour levels are spaced in that
  // rescaled range. Finding the same two numbers is what puts the lines in the
  // same places.
  let min = Infinity
  let max = -Infinity
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      let sum = 0
      let amp = 1
      for (let o = 0; o < octaves.length; o++) {
        sum += sample(grids[o]!, octaves[o]!, x / (cols - 1), y / (rows - 1)) * amp
        amp *= 0.5
      }
      sum /= total
      if (sum < min) min = sum
      if (sum > max) max = sum
    }
  }

  return { lattice, band, octaves: octaves.length, min, max, total }
}
