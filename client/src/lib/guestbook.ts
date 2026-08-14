/**
 * What a mark on the guestbook is, and how to measure and draw one.
 *
 * Everything here is shared by the canvas and by the card on the home page.
 * They used to each have their own answer: the card drew strokes as straight
 * segments, notes as plain rounded rectangles, and text as one truncated line
 * in a font nobody chose, which meant the preview of the board was a drawing
 * of a different board. Anything that decides how a mark looks belongs here so
 * that there is only one answer to change.
 */

export type Point = [number, number]
export type Font =
  | 'system' | 'geist' | 'exposure' | 'humanist' | 'rounded' | 'serif'
  | 'book' | 'mono' | 'cursive' | 'casual' | 'handwritten' | 'display'
export type StickyColor = 'yellow' | 'pink' | 'blue' | 'green' | 'orange' | 'lavender'

export interface BaseItem {
  id: string
  x: number
  y: number
  rotation: number
  location?: { country: string; city: string | null } | null
  owned?: boolean
  draft?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface DrawingItem extends BaseItem {
  kind: 'drawing'
  points: Point[]
  color: string
  width: number
}

export interface TextItem extends BaseItem {
  kind: 'text'
  text: string
  font: Font
  color: string
  size: number
  bold: boolean
  italic: boolean
  width: number
  height: number
}

export interface StickyItem extends BaseItem {
  kind: 'sticky'
  text: string
  color: StickyColor
  textColor: string
  font: Font
  size: number
  bold: boolean
  italic: boolean
  width: number
  height: number
}

export interface EmojiItem extends BaseItem {
  kind: 'emoji'
  emoji: string
  size: number
}

export interface ImageItem extends BaseItem {
  kind: 'image'
  /** Absent on a mark that arrived over the live stream, which omits uploads. */
  src?: string
  /** A postage stamp of the same picture, for previews that cannot carry src. */
  thumb?: string
  width: number
  height: number
  alt: string
}

export type GuestbookItem = DrawingItem | TextItem | StickyItem | EmojiItem | ImageItem
export type Bounds = { x: number; y: number; width: number; height: number }

export const fontOptions: { value: Font; label: string; family: string }[] = [
  { value: 'system', label: 'Sans', family: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif" },
  { value: 'geist', label: 'Geist', family: "'Geist Variable', ui-sans-serif, system-ui, sans-serif" },
  { value: 'exposure', label: 'Exposure', family: "'Exposure', ui-serif, Georgia, serif" },
  { value: 'humanist', label: 'Humanist', family: "'Trebuchet MS', 'Lucida Grande', 'Lucida Sans Unicode', Arial, sans-serif" },
  { value: 'rounded', label: 'Rounded', family: "ui-rounded, 'Arial Rounded MT Bold', 'Trebuchet MS', sans-serif" },
  { value: 'serif', label: 'Serif', family: "Georgia, 'Times New Roman', Times, serif" },
  { value: 'book', label: 'Book', family: "'Palatino Linotype', 'Book Antiqua', Palatino, Georgia, serif" },
  { value: 'mono', label: 'Mono', family: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace" },
  { value: 'cursive', label: 'Cursive', family: 'cursive' },
  { value: 'casual', label: 'Casual', family: "'Comic Sans MS', 'Chalkboard SE', 'Comic Sans', cursive" },
  { value: 'handwritten', label: 'Hand', family: "'Caveat Variable', cursive" },
  { value: 'display', label: 'Display', family: "'Fraunces Variable', Georgia, serif" },
]

export const fontFamilies = Object.fromEntries(
  fontOptions.map((font) => [font.value, font.family]),
) as Record<Font, string>

export const stickyFill: Record<StickyColor, string> = {
  yellow: '#f4dd83',
  pink: '#efb5b7',
  blue: '#acd8df',
  green: '#b9d6aa',
  orange: '#f3bd85',
  lavender: '#cbbbe5',
}

const fontLoaders: Partial<Record<Font, () => Promise<unknown>>> = {
  handwritten: () => import('@fontsource-variable/caveat/wght.css'),
  display: () => import('@fontsource-variable/fraunces/wght.css'),
}
const loadingFonts = new Set<Font>()
const fontListeners = new Set<(font: Font) => void>()

/** Told when a webfont finishes arriving, so text can be re-measured. */
export function onGuestbookFontLoaded(listener: (font: Font) => void) {
  fontListeners.add(listener)
  return () => fontListeners.delete(listener)
}

export function ensureFontLoaded(font: Font) {
  const load = fontLoaders[font]
  if (!load || loadingFonts.has(font)) return
  loadingFonts.add(font)
  void load()
    .then(() => document.fonts.ready)
    .then(() => fontListeners.forEach((listener) => listener(font)))
    .catch(() => loadingFonts.delete(font))
}

/** The stack for a font, fetching it first if it is one we host. */
export function fontFamily(font: Font) {
  ensureFontLoaded(font)
  return fontFamilies[font] ?? fontFamilies.system
}

export function textStyle(item: TextItem) {
  return {
    color: item.color,
    fontFamily: fontFamily(item.font),
    fontSize: `${item.size}px`,
    fontWeight: item.bold ? '700' : '400',
    fontStyle: item.italic ? 'italic' : 'normal',
  }
}

export function stickyTextStyle(item: StickyItem) {
  return {
    color: item.textColor,
    fontFamily: fontFamily(item.font),
    fontSize: `${item.size}px`,
    fontWeight: item.bold ? '700' : '500',
    fontStyle: item.italic ? 'italic' : 'normal',
  }
}

export function itemBounds(item: GuestbookItem): Bounds {
  if (item.kind === 'drawing') {
    const xs = item.points.map((point) => point[0])
    const ys = item.points.map((point) => point[1])
    const x = Math.min(...xs)
    const y = Math.min(...ys)
    return { x, y, width: Math.max(8, Math.max(...xs) - x), height: Math.max(8, Math.max(...ys) - y) }
  }
  if (item.kind === 'emoji') {
    return { x: item.x - item.size / 2, y: item.y - item.size / 2, width: item.size, height: item.size }
  }
  return { x: item.x, y: item.y, width: item.width, height: item.height }
}

export function itemCenter(item: GuestbookItem): Point {
  const bounds = itemBounds(item)
  return [bounds.x + bounds.width / 2, bounds.y + bounds.height / 2]
}

export function itemTransform(item: GuestbookItem) {
  if (item.kind === 'drawing' || !item.rotation) return undefined
  const [x, y] = itemCenter(item)
  return `rotate(${item.rotation} ${x} ${y})`
}

/** A stroke, smoothed through its points rather than joined corner to corner. */
export function drawingPath(points: Point[]) {
  if (points.length < 2) return ''
  let path = `M ${points[0][0]} ${points[0][1]}`
  for (let index = 1; index < points.length - 1; index += 1) {
    const point = points[index]
    const next = points[index + 1]
    path += ` Q ${point[0]} ${point[1]} ${(point[0] + next[0]) / 2} ${(point[1] + next[1]) / 2}`
  }
  const last = points[points.length - 1]
  return `${path} L ${last[0]} ${last[1]}`
}

/**
 * The same stroke, built once.
 *
 * Panning re-renders the whole board, and rebuilding a few hundred path
 * strings per frame is most of what that costs. The points array is only
 * replaced when the stroke actually changes, so its identity is the cache key
 * and a drag recomputes only what is being dragged.
 */
const pathCache = new WeakMap<Point[], string>()

export function cachedDrawingPath(points: Point[]) {
  let path = pathCache.get(points)
  if (path === undefined) {
    path = drawingPath(points)
    pathCache.set(points, path)
  }
  return path
}

/** A note, with the slightly uneven edges of something cut by hand. */
export function stickyPath(item: StickyItem) {
  const { x, y, width, height } = item
  return [
    `M ${x + 8} ${y + 2}`,
    `Q ${x + width * 0.28} ${y - 2} ${x + width * 0.52} ${y + 1}`,
    `Q ${x + width * 0.76} ${y + 4} ${x + width - 9} ${y + 1}`,
    `Q ${x + width + 2} ${y + 12} ${x + width - 1} ${y + height * 0.42}`,
    `Q ${x + width + 3} ${y + height * 0.72} ${x + width - 5} ${y + height - 8}`,
    `Q ${x + width * 0.76} ${y + height + 3} ${x + width * 0.51} ${y + height - 1}`,
    `Q ${x + width * 0.22} ${y + height - 4} ${x + 7} ${y + height}`,
    `Q ${x - 2} ${y + height * 0.72} ${x + 1} ${y + height * 0.45}`,
    `Q ${x - 3} ${y + 16} ${x + 8} ${y + 2} Z`,
  ].join(' ')
}

export function stickyFoldPath(item: StickyItem) {
  const { x, y, width } = item
  return `M ${x + width - 38} ${y + 2} Q ${x + width - 19} ${y + 7} ${x + width - 2} ${y + 35} L ${x + width - 1} ${y + 2} Q ${x + width - 18} ${y - 1} ${x + width - 38} ${y + 2} Z`
}

export function stickyCreasePath(item: StickyItem) {
  return `M ${item.x + item.width - 38} ${item.y + 2} Q ${item.x + item.width - 13} ${item.y + 12} ${item.x + item.width - 2} ${item.y + 35}`
}

/** Fill in what an older mark, or one from the wire, does not carry. */
export function normalizeItem(item: GuestbookItem): GuestbookItem {
  item.rotation ??= 0
  if (item.kind === 'text') {
    if (!(item.font in fontFamilies)) item.font = 'system'
    item.width ??= Math.max(160, Math.min(500, item.text.length * item.size * 0.62))
    item.height ??= Math.max(56, item.size * 1.45)
  } else if (item.kind === 'sticky') {
    if (!(item.font in fontFamilies)) item.font = 'system'
    item.textColor ??= '#432d20'
    item.size ??= 18
    item.bold = Boolean(item.bold)
    item.italic = Boolean(item.italic)
    item.width ??= 180
    item.height ??= 150
  }
  item.owned = Boolean(item.owned)
  return item
}
