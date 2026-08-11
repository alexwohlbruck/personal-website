/**
 * Motion tokens. Every animation in the app pulls its timing from here so the
 * whole site moves with one clock. Curve and durations follow the house style
 * from transitions.dev: a long-tailed ease-out that settles rather than stops.
 */
export const ease = [0.22, 1, 0.36, 1] as const
export const easeCss = 'cubic-bezier(0.22, 1, 0.36, 1)'

export const duration = {
  /** Hover states, icon swaps. */
  quick: 0.2,
  /** The default: entrances, expansions. */
  base: 0.5,
  /** Page-level moves and shared elements. */
  slow: 0.7,
} as const

export const stagger = 0.04

/** Rise + blur in. The signature entrance. */
export const rise = {
  initial: { opacity: 0, y: 12, filter: 'blur(3px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  transition: { duration: duration.base, ease },
}

/** Same, from the side. Used by list rows and margin notes. */
export const slide = {
  initial: { opacity: 0, x: -10, filter: 'blur(3px)' },
  animate: { opacity: 1, x: 0, filter: 'blur(0px)' },
  transition: { duration: duration.base, ease },
}

export const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: duration.quick, ease },
}

/** Delay for the nth item in a staggered group. */
export function step(index: number, base = 0) {
  return base + index * stagger
}

/** Viewport trigger shared by every scroll-revealed block. */
export const inView = { once: true, margin: '0px 0px -12% 0px' } as const
