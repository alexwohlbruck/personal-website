<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import Picker from 'emoji-picker-element/picker'
import emojiDataUrl from 'emoji-picker-element-data/en/emojibase/data.json?url'
import {
  Bold,
  Eraser,
  Hand,
  ImagePlus,
  Italic,
  Minus,
  MousePointer2,
  Pencil,
  Plus,
  Redo2,
  Smile,
  StickyNote,
  Type,
  Undo2,
  X,
} from '@lucide/vue'
import { BACKEND_URL } from '@/data/site'

type Point = [number, number]
type Tool = 'pan' | 'select' | 'erase' | 'pen' | 'text' | 'sticky' | 'emoji' | 'image'
type Font = 'system' | 'geist' | 'exposure' | 'humanist' | 'rounded' | 'serif' | 'book' | 'mono' | 'cursive' | 'casual' | 'handwritten' | 'display'
type StickyColor = 'yellow' | 'pink' | 'blue' | 'green' | 'orange' | 'lavender'

interface BaseItem {
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

interface DrawingItem extends BaseItem {
  kind: 'drawing'
  points: Point[]
  color: string
  width: number
}

interface TextItem extends BaseItem {
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

interface StickyItem extends BaseItem {
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

interface EmojiItem extends BaseItem {
  kind: 'emoji'
  emoji: string
  size: number
}

interface ImageItem extends BaseItem {
  kind: 'image'
  src: string
  width: number
  height: number
  alt: string
}

type GuestbookItem = DrawingItem | TextItem | StickyItem | EmojiItem | ImageItem
class ApiError extends Error {
  constructor(message: string, readonly status: number, readonly retryAfter?: number) {
    super(message)
  }
}
type Command =
  | { type: 'create'; item: GuestbookItem }
  | { type: 'update'; before: GuestbookItem; after: GuestbookItem }
  | { type: 'delete'; item: GuestbookItem }

type Bounds = { x: number; y: number; width: number; height: number }
type CanvasTooltip = {
  x: number
  y: number
  width: number
  height: number
  radius: number
  centerX: number
  locationY: number
  dateY: number
  accentY: number
  tail: string
  location: string
  date: string
}
type Interaction =
  | { mode: 'pan'; pointer: number; startX: number; startY: number; cameraX: number; cameraY: number }
  | { mode: 'pinch'; pointers: [number, number]; startDistance: number; startZoom: number; focal: Point }
  | { mode: 'draw'; pointer: number }
  | { mode: 'erase'; pointer: number; removed: GuestbookItem[] }
  | { mode: 'move'; pointer: number; start: Point; before: GuestbookItem }
  | { mode: 'resize'; pointer: number; start: Point; before: GuestbookItem }
  | { mode: 'rotate'; pointer: number; startAngle: number; before: GuestbookItem }

const endpoint = `${BACKEND_URL}/guestbook`
const sessionKey = 'guestbook-client-id'
const existingClientId = sessionStorage.getItem(sessionKey)
const clientId = existingClientId ?? crypto.randomUUID()
if (!existingClientId) sessionStorage.setItem(sessionKey, clientId)

const canvas = ref<SVGSVGElement>()
const shell = ref<HTMLElement>()
const emojiPickerHost = ref<HTMLElement>()
const imageInput = ref<HTMLInputElement>()
const items = ref<GuestbookItem[]>([])
const loading = ref(true)
const saving = ref(false)
const message = ref('')
const rateLimitWarning = ref('')
const visitorCount = ref<number>()
const tool = ref<Tool>('pan')
const selectedId = ref<string>()
const emojiPickerOpen = ref(false)
const selectedEmoji = ref('👋')
const camera = ref({ x: 0, y: 0, zoom: 1 })
const viewport = ref({ width: 1000, height: 650 })
const activePoints = ref<Point[]>([])
const penColor = ref('#8f3525')
const penWidth = ref(4)
const history = ref<Command[]>([])
const future = ref<Command[]>([])
let interaction: Interaction | undefined
let editBefore: GuestbookItem | undefined
let resizeObserver: ResizeObserver | undefined
let picker: Picker | undefined
let liveStream: EventSource | undefined
let shakeEnabled = false
let shakePermissionRequested = false
let lastShake = 0
let preserveEditorBlur = false
const touchPointers = new Map<number, Point>()
const visitorNumber = new Intl.NumberFormat()

const tools: { id: Tool; label: string; icon: typeof Hand }[] = [
  { id: 'pan', label: 'Drag', icon: Hand },
  { id: 'select', label: 'Select', icon: MousePointer2 },
  { id: 'erase', label: 'Erase', icon: Eraser },
  { id: 'pen', label: 'Draw', icon: Pencil },
  { id: 'text', label: 'Text', icon: Type },
  { id: 'sticky', label: 'Note', icon: StickyNote },
  { id: 'emoji', label: 'Emoji', icon: Smile },
  { id: 'image', label: 'Image', icon: ImagePlus },
]

const stickyFill: Record<StickyColor, string> = {
  yellow: '#f4dd83',
  pink: '#efb5b7',
  blue: '#acd8df',
  green: '#b9d6aa',
  orange: '#f3bd85',
  lavender: '#cbbbe5',
}

const fontOptions: { value: Font; label: string; family: string }[] = [
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

const fontFamilies = Object.fromEntries(fontOptions.map((font) => [font.value, font.family])) as Record<Font, string>
const fontLoaders: Partial<Record<Font, () => Promise<unknown>>> = {
  handwritten: () => import('@fontsource-variable/caveat/wght.css'),
  display: () => import('@fontsource-variable/fraunces/wght.css'),
}
const loadingFonts = new Set<Font>()

function ensureFontLoaded(font: Font) {
  const load = fontLoaders[font]
  if (!load || loadingFonts.has(font)) return
  loadingFonts.add(font)
  void load()
    .then(() => document.fonts.ready)
    .then(() => {
      for (const item of items.value) {
        if (item.kind === 'text' && item.font === font) fitTextBox(item)
      }
    })
    .catch(() => loadingFonts.delete(font))
}

const viewBox = computed(() => ({
  x: camera.value.x - viewport.value.width / camera.value.zoom / 2,
  y: camera.value.y - viewport.value.height / camera.value.zoom / 2,
  width: viewport.value.width / camera.value.zoom,
  height: viewport.value.height / camera.value.zoom,
}))
const viewBoxString = computed(
  () => `${viewBox.value.x} ${viewBox.value.y} ${viewBox.value.width} ${viewBox.value.height}`,
)
const selectedItem = computed(() => items.value.find((item) => item.id === selectedId.value))
const visitorLabel = computed(() => {
  if (visitorCount.value === undefined) return 'Visitors'
  const remainder = visitorCount.value % 100
  const suffix = remainder >= 11 && remainder <= 13
    ? 'th'
    : ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[visitorCount.value % 10] ?? 'th'
  return `You're the ${visitorNumber.format(visitorCount.value)}${suffix} guest`
})
const selectedBounds = computed(() => (selectedItem.value ? itemBounds(selectedItem.value) : undefined))
const canEditSelected = computed(() => Boolean(selectedItem.value?.owned || selectedItem.value?.draft))
const canTransformSelected = computed(
  () => canEditSelected.value && selectedItem.value?.kind !== 'drawing',
)
const secondaryTool = computed<'pen' | 'text' | 'sticky' | 'emoji' | null>(() => {
  if (tool.value === 'pen') return 'pen'
  if (tool.value === 'emoji' && emojiPickerOpen.value) return 'emoji'
  if (selectedItem.value?.kind === 'text' && canEditSelected.value) return 'text'
  if (selectedItem.value?.kind === 'sticky' && canEditSelected.value) return 'sticky'
  return null
})
const selectedTooltip = computed<CanvasTooltip | undefined>(() => {
  const item = selectedItem.value
  const bounds = selectedBounds.value
  if (!item || !bounds || item.owned || item.draft) return undefined
  const scale = 1 / camera.value.zoom
  const location = itemLocation(item)
  const date = itemPostedDate(item)
  const width = Math.min(252, Math.max(190, location.length * 6.4 + 38, date.length * 5.2 + 38)) * scale
  const height = 52 * scale
  const centerX = bounds.x + bounds.width / 2
  const y = bounds.y - (canTransformSelected.value ? 112 : 72) * scale
  return {
    x: centerX - width / 2,
    y,
    width,
    height,
    radius: 16 * scale,
    centerX,
    locationY: y + 23 * scale,
    dateY: y + 39 * scale,
    accentY: y + 7 * scale,
    tail: `M ${centerX - 7 * scale} ${y + height - scale} L ${centerX} ${y + height + 8 * scale} L ${centerX + 7 * scale} ${y + height - scale} Z`,
    location,
    date,
  }
})
const cursor = computed(() => {
  if (interaction?.mode === 'pan') return 'grabbing'
  if (tool.value === 'pan') return 'grab'
  if (tool.value === 'erase') return 'cell'
  if (tool.value === 'select') return 'default'
  return 'crosshair'
})

function cloneItem<T extends GuestbookItem>(item: T): T {
  // Canvas items are Vue proxies after they enter the reactive collection.
  // They contain JSON-only data, so a JSON round trip gives commands and API
  // payloads an unproxied snapshot that can be safely retained in history.
  return JSON.parse(JSON.stringify(item)) as T
}

function normalizeItem(item: GuestbookItem): GuestbookItem {
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

function payload(item: GuestbookItem) {
  const copy = cloneItem(item)
  delete copy.owned
  delete copy.draft
  delete copy.createdAt
  delete copy.updatedAt
  return copy
}

function worldPoint(event: PointerEvent | WheelEvent): Point {
  const rect = canvas.value!.getBoundingClientRect()
  return [
    camera.value.x + (event.clientX - rect.left - rect.width / 2) / camera.value.zoom,
    camera.value.y + (event.clientY - rect.top - rect.height / 2) / camera.value.zoom,
  ]
}

function capturePointer(event: PointerEvent) {
  try {
    canvas.value?.setPointerCapture(event.pointerId)
  } catch {
    // A synthetic click or interrupted mobile gesture can outlive its pointer.
    // The interaction still works; it just cannot retain capture off-canvas.
  }
}

function clientMidpoint(first: Point, second: Point): Point {
  return [(first[0] + second[0]) / 2, (first[1] + second[1]) / 2]
}

function clientDistance(first: Point, second: Point) {
  return Math.hypot(second[0] - first[0], second[1] - first[1])
}

function beginPinch() {
  const entries = [...touchPointers.entries()].slice(0, 2)
  if (entries.length < 2 || !canvas.value) return

  // A second finger turns the current gesture into navigation. Roll back a
  // partial transform and discard an unfinished stroke so pinching never
  // accidentally edits the canvas beneath it.
  if (interaction?.mode === 'move' || interaction?.mode === 'resize' || interaction?.mode === 'rotate') {
    replaceItem(interaction.before)
  } else if (interaction?.mode === 'erase' && interaction.removed.length) {
    void persistErasure(interaction.removed)
  }
  activePoints.value = []

  const first = entries[0][1]
  const second = entries[1][1]
  const midpoint = clientMidpoint(first, second)
  const rect = canvas.value.getBoundingClientRect()
  interaction = {
    mode: 'pinch',
    pointers: [entries[0][0], entries[1][0]],
    startDistance: Math.max(1, clientDistance(first, second)),
    startZoom: camera.value.zoom,
    focal: [
      camera.value.x + (midpoint[0] - rect.left - rect.width / 2) / camera.value.zoom,
      camera.value.y + (midpoint[1] - rect.top - rect.height / 2) / camera.value.zoom,
    ],
  }
}

function trackTouchPointer(event: PointerEvent) {
  if (event.pointerType !== 'touch') return
  touchPointers.set(event.pointerId, [event.clientX, event.clientY])
  capturePointer(event)
  if (touchPointers.size >= 2) {
    beginPinch()
    event.stopPropagation()
  }
}

function itemBounds(item: GuestbookItem): Bounds {
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

function itemCenter(item: GuestbookItem): Point {
  const bounds = itemBounds(item)
  return [bounds.x + bounds.width / 2, bounds.y + bounds.height / 2]
}

function itemTransform(item: GuestbookItem) {
  if (item.kind === 'drawing' || !item.rotation) return undefined
  const [x, y] = itemCenter(item)
  return `rotate(${item.rotation} ${x} ${y})`
}

function drawingCenter(item: DrawingItem): Point {
  const bounds = itemBounds(item)
  return [bounds.x + bounds.width / 2, bounds.y + bounds.height / 2]
}

function contentBounds() {
  const persisted = items.value.filter((item) => !item.draft)
  if (!persisted.length) return undefined
  const bounds = persisted.map(itemBounds)
  const left = Math.min(...bounds.map((item) => item.x))
  const top = Math.min(...bounds.map((item) => item.y))
  const right = Math.max(...bounds.map((item) => item.x + item.width))
  const bottom = Math.max(...bounds.map((item) => item.y + item.height))
  return { x: left, y: top, width: right - left, height: bottom - top }
}

function canvasRange() {
  const bounds = contentBounds()
  if (!bounds) return undefined
  const marginX = viewport.value.width * 0.75
  const marginY = viewport.value.height * 0.75
  return {
    left: bounds.x - marginX,
    right: bounds.x + bounds.width + marginX,
    top: bounds.y - marginY,
    bottom: bounds.y + bounds.height + marginY,
  }
}

function constrainCamera(next: { x: number; y: number; zoom: number }) {
  const range = canvasRange()
  if (!range) return next
  const halfWidth = viewport.value.width / next.zoom / 2
  const halfHeight = viewport.value.height / next.zoom / 2
  const minX = range.left + halfWidth
  const maxX = range.right - halfWidth
  const minY = range.top + halfHeight
  const maxY = range.bottom - halfHeight
  return {
    ...next,
    x: minX <= maxX ? Math.max(minX, Math.min(maxX, next.x)) : (range.left + range.right) / 2,
    y: minY <= maxY ? Math.max(minY, Math.min(maxY, next.y)) : (range.top + range.bottom) / 2,
  }
}

function pointWithinCanvasRange([x, y]: Point) {
  const range = canvasRange()
  return !range || (x >= range.left && x <= range.right && y >= range.top && y <= range.bottom)
}

function distanceToSegment(point: Point, start: Point, end: Point) {
  const dx = end[0] - start[0]
  const dy = end[1] - start[1]
  if (!dx && !dy) return Math.hypot(point[0] - start[0], point[1] - start[1])
  const t = Math.max(0, Math.min(1, ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / (dx * dx + dy * dy)))
  return Math.hypot(point[0] - (start[0] + t * dx), point[1] - (start[1] + t * dy))
}

function eraserHits(item: GuestbookItem, point: Point) {
  const radius = 14 / camera.value.zoom
  if (item.kind === 'drawing') {
    return item.points.slice(1).some((end, index) =>
      distanceToSegment(point, item.points[index], end) <= radius + item.width / 2,
    )
  }
  const bounds = itemBounds(item)
  return point[0] >= bounds.x - radius && point[0] <= bounds.x + bounds.width + radius
    && point[1] >= bounds.y - radius && point[1] <= bounds.y + bounds.height + radius
}

function eraseAt(point: Point) {
  if (interaction?.mode !== 'erase') return
  const removedIds = new Set(interaction.removed.map((item) => item.id))
  const hits = items.value.filter((item) =>
    (item.owned || item.draft) && !removedIds.has(item.id) && eraserHits(item, point),
  )
  if (!hits.length) return
  interaction.removed.push(...hits.map(cloneItem))
  const ids = new Set(hits.map((item) => item.id))
  items.value = items.value.filter((item) => !ids.has(item.id))
  if (selectedId.value && ids.has(selectedId.value)) {
    selectedId.value = undefined
    editBefore = undefined
  }
}

function drawingPath(points: Point[]) {
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

function fontFamily(font: Font) {
  ensureFontLoaded(font)
  return fontFamilies[font] ?? fontFamilies.system
}

function textStyle(item: TextItem) {
  return {
    color: item.color,
    fontFamily: fontFamily(item.font),
    fontSize: `${item.size}px`,
    fontWeight: item.bold ? '700' : '400',
    fontStyle: item.italic ? 'italic' : 'normal',
  }
}

function stickyTextStyle(item: StickyItem) {
  return {
    color: item.textColor,
    fontFamily: fontFamily(item.font),
    fontSize: `${item.size}px`,
    fontWeight: item.bold ? '700' : '500',
    fontStyle: item.italic ? 'italic' : 'normal',
  }
}

function fitTextBox(item: TextItem) {
  const context = document.createElement('canvas').getContext('2d')
  if (!context) return
  context.font = `${item.italic ? 'italic ' : ''}${item.bold ? '700 ' : '400 '}${item.size}px ${fontFamily(item.font)}`
  const lines = (item.text || 'Type here…').split('\n')
  const measuredWidth = Math.max(...lines.map((line) => context.measureText(line || ' ').width))
  item.width = Math.min(800, Math.max(80, Math.ceil(measuredWidth + 12)))
  item.height = Math.min(500, Math.max(30, Math.ceil(lines.length * item.size * 1.12 + 8)))
}

function stickyPath(item: StickyItem) {
  const { x, y, width: width, height: height } = item
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

function stickyFoldPath(item: StickyItem) {
  const { x, y, width } = item
  return `M ${x + width - 38} ${y + 2} Q ${x + width - 19} ${y + 7} ${x + width - 2} ${y + 35} L ${x + width - 1} ${y + 2} Q ${x + width - 18} ${y - 1} ${x + width - 38} ${y + 2} Z`
}

function countryFlag(country: string) {
  return country
    .toUpperCase()
    .split('')
    .map((letter) => String.fromCodePoint(127397 + letter.charCodeAt(0)))
    .join('')
}

function itemLocation(item: GuestbookItem) {
  if (!item.location) return 'Location unavailable'
  return `${countryFlag(item.location.country)} ${item.location.city ?? item.location.country}`
}

const postedDateFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

function itemPostedDate(item: GuestbookItem) {
  if (!item.createdAt) return item.draft ? 'Not posted yet' : 'Posted recently'
  const posted = new Date(item.createdAt)
  if (Number.isNaN(posted.getTime())) return 'Posted recently'
  return `Posted ${postedDateFormatter.format(posted)}`
}

function requestHeaders(body = false): HeadersInit {
  return {
    'X-Guestbook-Client': clientId,
    ...(body ? { 'Content-Type': 'application/json' } : {}),
  }
}

async function api<T = void>(path = '', init?: RequestInit): Promise<T> {
  const response = await fetch(`${endpoint}${path}`, {
    ...init,
    cache: 'no-store',
    headers: { ...requestHeaders(Boolean(init?.body)), ...init?.headers },
  })
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { message?: string; retryAfter?: number }
    throw new ApiError(
      body.message || `Request failed (${response.status})`,
      response.status,
      body.retryAfter,
    )
  }
  return response.status === 204 ? (undefined as T) : ((await response.json()) as T)
}

function replaceItem(item: GuestbookItem) {
  const index = items.value.findIndex((candidate) => candidate.id === item.id)
  if (index >= 0) items.value[index] = normalizeItem(item)
  else items.value.push(normalizeItem(item))
}

function record(command: Command) {
  history.value.push(command)
  if (history.value.length > 100) history.value.shift()
  future.value = []
}

async function createRemote(item: GuestbookItem, recordHistory = true) {
  saving.value = true
  try {
    const saved = await api<GuestbookItem>('', { method: 'POST', body: JSON.stringify(payload(item)) })
    saved.owned = true
    replaceItem(saved)
    if (recordHistory) record({ type: 'create', item: cloneItem(saved) })
    return saved
  } catch (error) {
    items.value = items.value.filter((candidate) => candidate.id !== item.id)
    selectedId.value = undefined
    showError(error)
  } finally {
    saving.value = false
  }
}

async function updateRemote(before: GuestbookItem, after: GuestbookItem, recordHistory = true) {
  if (JSON.stringify(payload(before)) === JSON.stringify(payload(after))) return
  saving.value = true
  try {
    const saved = await api<GuestbookItem>(`/${after.id}`, {
      method: 'PUT',
      body: JSON.stringify(payload(after)),
    })
    saved.owned = true
    replaceItem(saved)
    if (recordHistory) record({ type: 'update', before: cloneItem(before), after: cloneItem(saved) })
  } catch (error) {
    replaceItem(before)
    showError(error)
  } finally {
    saving.value = false
  }
}

async function persistErasure(removed: GuestbookItem[]) {
  const persisted = removed.filter((item) => !item.draft)
  if (!persisted.length) return
  saving.value = true
  try {
    for (const item of persisted) {
      try {
        await api(`/${item.id}`, { method: 'DELETE' })
        record({ type: 'delete', item: cloneItem(item) })
      } catch (error) {
        replaceItem(item)
        showError(error)
      }
    }
  } finally {
    saving.value = false
  }
}

async function undo() {
  if (saving.value || !history.value.length) return
  const command = history.value[history.value.length - 1]
  const previousSelection = selectedId.value
  saving.value = true

  if (command.type === 'create') {
    items.value = items.value.filter((item) => item.id !== command.item.id)
    if (selectedId.value === command.item.id) selectedId.value = undefined
  } else if (command.type === 'delete') {
    replaceItem(command.item)
  } else {
    replaceItem(command.before)
  }
  history.value.pop()
  future.value.push(command)

  try {
    if (command.type === 'create') {
      await api(`/${command.item.id}`, { method: 'DELETE' })
    } else if (command.type === 'delete') {
      const restored = await api<GuestbookItem>('', {
        method: 'POST',
        body: JSON.stringify(payload(command.item)),
      })
      restored.owned = true
      replaceItem(restored)
    } else {
      const restored = await api<GuestbookItem>(`/${command.before.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload(command.before)),
      })
      restored.owned = true
      replaceItem(restored)
    }
  } catch (error) {
    future.value.pop()
    history.value.push(command)
    if (command.type === 'create') {
      replaceItem(command.item)
      selectedId.value = previousSelection
    } else if (command.type === 'delete') {
      items.value = items.value.filter((item) => item.id !== command.item.id)
      if (selectedId.value === command.item.id) selectedId.value = undefined
    } else {
      replaceItem(command.after)
    }
    showError(error)
  } finally {
    saving.value = false
  }
}

async function redo() {
  if (saving.value || !future.value.length) return
  const command = future.value[future.value.length - 1]
  const previousSelection = selectedId.value
  saving.value = true

  if (command.type === 'create') {
    replaceItem(command.item)
  } else if (command.type === 'delete') {
    items.value = items.value.filter((item) => item.id !== command.item.id)
    if (selectedId.value === command.item.id) selectedId.value = undefined
  } else {
    replaceItem(command.after)
  }
  future.value.pop()
  history.value.push(command)

  try {
    if (command.type === 'create') {
      const restored = await api<GuestbookItem>('', {
        method: 'POST',
        body: JSON.stringify(payload(command.item)),
      })
      restored.owned = true
      replaceItem(restored)
    } else if (command.type === 'delete') {
      await api(`/${command.item.id}`, { method: 'DELETE' })
    } else {
      const applied = await api<GuestbookItem>(`/${command.after.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload(command.after)),
      })
      applied.owned = true
      replaceItem(applied)
    }
  } catch (error) {
    history.value.pop()
    future.value.push(command)
    if (command.type === 'create') {
      items.value = items.value.filter((item) => item.id !== command.item.id)
      if (selectedId.value === command.item.id) selectedId.value = undefined
    } else if (command.type === 'delete') {
      replaceItem(command.item)
      selectedId.value = previousSelection
    } else {
      replaceItem(command.before)
    }
    showError(error)
  } finally {
    saving.value = false
  }
}

function selectTool(next: Tool) {
  const selected = selectedItem.value
  if (selected?.draft) {
    if (isEmptyEditableDraft(selected)) cancelDraft()
    else if (selected.kind === 'text' || selected.kind === 'sticky') commitEditor(selected)
  }
  tool.value = next
  selectedId.value = undefined
  emojiPickerOpen.value = next === 'emoji'
  if (next === 'image') imageInput.value?.click()
  if (next === 'pen') keepDrawingToolNearMarks()
}

function keepDrawingToolNearMarks() {
  const drawings = items.value.filter((item): item is DrawingItem => item.kind === 'drawing')
  if (!drawings.length) return
  const maxX = viewport.value.width * 0.75
  const maxY = viewport.value.height * 0.75
  const nearby = drawings.some((drawing) => {
    const [x, y] = drawingCenter(drawing)
    return Math.abs(camera.value.x - x) <= maxX && Math.abs(camera.value.y - y) <= maxY
  })
  if (nearby) return
  const [x, y] = drawingCenter(drawings[drawings.length - 1])
  camera.value = { x, y, zoom: Math.max(1, camera.value.zoom) }
}

function onCanvasPointerDown(event: PointerEvent) {
  void enableShakeUndo()
  if (event.button !== 0 && event.button !== 1) return
  if (event.pointerType === 'touch' && touchPointers.size >= 2) return
  capturePointer(event)
  if (tool.value === 'pan' || event.button === 1) {
    interaction = {
      mode: 'pan',
      pointer: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      cameraX: camera.value.x,
      cameraY: camera.value.y,
    }
    return
  }

  if (tool.value === 'erase') {
    interaction = { mode: 'erase', pointer: event.pointerId, removed: [] }
    eraseAt(worldPoint(event))
    return
  }

  if (tool.value === 'select' || tool.value === 'image') {
    if (isEmptyEditableDraft(selectedItem.value)) cancelDraft()
    selectedId.value = undefined
    return
  }

  const [x, y] = worldPoint(event)
  if (tool.value === 'pen') {
    if (!pointWithinCanvasRange([x, y])) return
    activePoints.value = [[x, y]]
    interaction = { mode: 'draw', pointer: event.pointerId }
    return
  }
  if (tool.value === 'text') {
    addEditableDraft({
      id: crypto.randomUUID(), kind: 'text', x, y, rotation: 0, text: '', font: 'system', color: '#572d24',
      size: 32, bold: false, italic: false, width: 156, height: 44, owned: true, draft: true,
    })
  } else if (tool.value === 'sticky') {
    addEditableDraft({
      id: crypto.randomUUID(), kind: 'sticky', x: x - 90, y: y - 75, rotation: 0, text: '', color: 'yellow',
      textColor: '#432d20', font: 'system', size: 18, bold: false, italic: false,
      width: 180, height: 150, owned: true, draft: true,
    })
  } else if (tool.value === 'emoji') {
    emojiPickerOpen.value = true
    if (!selectedEmoji.value) return
    const item: EmojiItem = {
      id: crypto.randomUUID(), kind: 'emoji', x, y, rotation: 0, emoji: selectedEmoji.value, size: 64, owned: true,
    }
    items.value.push(item)
    selectedId.value = item.id
    tool.value = 'select'
    emojiPickerOpen.value = false
    void createRemote(item)
  }
}

function addEditableDraft(item: TextItem | StickyItem) {
  items.value.push(item)
  selectedId.value = item.id
  tool.value = 'select'
  void nextTick(() => window.setTimeout(() => {
    const editor = document.querySelector<HTMLTextAreaElement>(`[data-guestbook-editor="${item.id}"]`)
    editor?.focus()
  }, 0))
}

function selectItem(event: PointerEvent, item: GuestbookItem) {
  if (tool.value !== 'select' || item.kind === 'drawing') return
  event.stopPropagation()
  if (selectedItem.value?.id !== item.id && isEmptyEditableDraft(selectedItem.value)) cancelDraft()
  selectedId.value = item.id
  if (item.owned || item.draft) startMove(event, item)
}

function selectDrawing(event: PointerEvent, item: DrawingItem) {
  if (tool.value !== 'select') return
  event.stopPropagation()
  selectedId.value = selectedId.value === item.id ? undefined : item.id
}

function startMove(event: PointerEvent, item: GuestbookItem) {
  if (item.kind === 'drawing' || (!item.owned && !item.draft)) return
  event.stopPropagation()
  capturePointer(event)
  selectedId.value = item.id
  interaction = { mode: 'move', pointer: event.pointerId, start: worldPoint(event), before: cloneItem(item) }
}

function startResize(event: PointerEvent, item: GuestbookItem) {
  event.stopPropagation()
  capturePointer(event)
  interaction = { mode: 'resize', pointer: event.pointerId, start: worldPoint(event), before: cloneItem(item) }
}

function startRotate(event: PointerEvent, item: GuestbookItem) {
  if (item.kind === 'drawing' || (!item.owned && !item.draft)) return
  event.stopPropagation()
  capturePointer(event)
  const point = worldPoint(event)
  const [centerX, centerY] = itemCenter(item)
  interaction = {
    mode: 'rotate',
    pointer: event.pointerId,
    startAngle: Math.atan2(point[1] - centerY, point[0] - centerX) * 180 / Math.PI,
    before: cloneItem(item),
  }
}

function onPointerMove(event: PointerEvent) {
  if (event.pointerType === 'touch' && touchPointers.has(event.pointerId)) {
    touchPointers.set(event.pointerId, [event.clientX, event.clientY])
  }
  if (!interaction) return
  if (interaction.mode === 'pinch') {
    if (!interaction.pointers.includes(event.pointerId) || !canvas.value) return
    const first = touchPointers.get(interaction.pointers[0])
    const second = touchPointers.get(interaction.pointers[1])
    if (!first || !second) return
    const midpoint = clientMidpoint(first, second)
    const nextZoom = Math.min(4, Math.max(
      0.25,
      interaction.startZoom * clientDistance(first, second) / interaction.startDistance,
    ))
    const rect = canvas.value.getBoundingClientRect()
    camera.value = constrainCamera({
      x: interaction.focal[0] - (midpoint[0] - rect.left - rect.width / 2) / nextZoom,
      y: interaction.focal[1] - (midpoint[1] - rect.top - rect.height / 2) / nextZoom,
      zoom: nextZoom,
    })
    return
  }
  if (interaction.pointer !== event.pointerId) return
  if (interaction.mode === 'pan') {
    camera.value = constrainCamera({
      ...camera.value,
      x: interaction.cameraX - (event.clientX - interaction.startX) / camera.value.zoom,
      y: interaction.cameraY - (event.clientY - interaction.startY) / camera.value.zoom,
    })
    return
  }
  if (interaction.mode === 'draw') {
    const point = worldPoint(event)
    if (!pointWithinCanvasRange(point)) return
    const previous = activePoints.value[activePoints.value.length - 1]
    if (Math.hypot(point[0] - previous[0], point[1] - previous[1]) >= 1.5 / camera.value.zoom) {
      activePoints.value.push(point)
    }
    return
  }
  if (interaction.mode === 'erase') {
    eraseAt(worldPoint(event))
    return
  }

  const active = interaction
  const current = items.value.find((item) => item.id === active.before.id)
  if (!current) return
  const point = worldPoint(event)
  if (active.mode === 'rotate') {
    const [centerX, centerY] = itemCenter(active.before)
    const angle = Math.atan2(point[1] - centerY, point[0] - centerX) * 180 / Math.PI
    current.rotation = ((active.before.rotation + angle - active.startAngle + 180) % 360 + 360) % 360 - 180
    return
  }
  const dx = point[0] - active.start[0]
  const dy = point[1] - active.start[1]
  const before = active.before
  if (active.mode === 'move') {
    current.x = before.x + dx
    current.y = before.y + dy
  } else {
    resizeItem(current, before, dx, dy)
  }
}

function resizeItem(current: GuestbookItem, before: GuestbookItem, dx: number, dy: number) {
  if (current.kind === 'text' && before.kind === 'text') {
    const scale = 1 + (dx + dy) / Math.max(80, before.width + before.height)
    current.size = Math.min(160, Math.max(12, Math.round(before.size * scale)))
    fitTextBox(current)
  } else if (current.kind === 'sticky' && before.kind === 'sticky') {
    current.width = Math.min(640, Math.max(100, before.width + dx))
    current.height = Math.min(640, Math.max(80, before.height + dy))
  } else if (current.kind === 'image' && before.kind === 'image') {
    const width = Math.min(640, Math.max(40, before.width + dx))
    const scale = width / before.width
    current.width = width
    current.height = Math.min(640, Math.max(40, before.height * scale))
  } else if (current.kind === 'emoji' && before.kind === 'emoji') {
    current.size = Math.min(128, Math.max(24, before.size + Math.max(dx, dy)))
  }
}

function onPointerUp(event: PointerEvent) {
  if (event.pointerType === 'touch') touchPointers.delete(event.pointerId)
  if (interaction?.mode === 'pinch') {
    if (!interaction.pointers.includes(event.pointerId)) return
    const remaining = [...touchPointers.entries()][0]
    interaction = remaining
      ? {
          mode: 'pan',
          pointer: remaining[0],
          startX: remaining[1][0],
          startY: remaining[1][1],
          cameraX: camera.value.x,
          cameraY: camera.value.y,
        }
      : undefined
    activePoints.value = []
    return
  }
  if (!interaction || interaction.pointer !== event.pointerId) return
  const finished = interaction
  interaction = undefined
  if (finished.mode === 'draw' && activePoints.value.length > 1) {
    const points = activePoints.value.slice(0, 1200)
    const item: DrawingItem = {
      id: crypto.randomUUID(), kind: 'drawing', x: points[0][0], y: points[0][1], rotation: 0,
      points, color: penColor.value, width: penWidth.value, owned: true,
    }
    items.value.push(item)
    selectedId.value = undefined
    void createRemote(item)
  } else if (finished.mode === 'move' || finished.mode === 'resize' || finished.mode === 'rotate') {
    const current = items.value.find((item) => item.id === finished.before.id)
    if (current && !current.draft) {
      void updateRemote(finished.before, cloneItem(current))
    }
  } else if (finished.mode === 'erase' && finished.removed.length) {
    void persistErasure(finished.removed)
  }
  activePoints.value = []
}

function beginEdit(item: GuestbookItem) {
  editBefore ??= cloneItem(item)
}

function preserveEditor() {
  preserveEditorBlur = true
  window.setTimeout(() => { preserveEditorBlur = false }, 0)
}

function isEmptyEditableDraft(item?: GuestbookItem) {
  return Boolean(
    item?.draft &&
    (item.kind === 'text' || item.kind === 'sticky') &&
    !item.text.trim(),
  )
}

function commitEditor(item: TextItem | StickyItem, event?: FocusEvent) {
  const nextFocus = event?.relatedTarget as HTMLElement | null
  if (preserveEditorBlur || nextFocus?.closest('.unified-toolbar, .secondary-toolbar')) {
    preserveEditorBlur = false
    return
  }
  if (!items.value.some((candidate) => candidate.id === item.id)) return
  const before = editBefore
  editBefore = undefined
  if (!item.text.trim()) {
    // Mobile browsers may briefly blur the editor while opening the keyboard or
    // resizing the visual viewport. Keep a new draft alive until the user
    // intentionally switches tools or selects something else.
    if (item.draft) return
    if (before) replaceItem(before)
    return showMessage('A text box cannot be empty.')
  }
  if (item.draft) void confirmDraft(item)
  else if (before) void updateRemote(before, cloneItem(item))
}

function onTextInput(item: TextItem, event: Event) {
  item.text = (event.target as HTMLTextAreaElement).value
  fitTextBox(item)
}

function onTextSizeChange(item: TextItem) {
  fitTextBox(item)
  commitStyle(item)
}

function commitStyle(item: GuestbookItem) {
  const before = editBefore
  editBefore = undefined
  if (!item.draft && before) void updateRemote(before, cloneItem(item))
}

function onTextFontChange(item: TextItem) {
  fitTextBox(item)
  commitStyle(item)
}

function toggleTextStyle(property: 'bold' | 'italic') {
  const item = selectedItem.value
  if (!item || item.kind !== 'text') return
  const before = cloneItem(item)
  item[property] = !item[property]
  fitTextBox(item)
  if (!item.draft) void updateRemote(before, cloneItem(item))
}

function toggleStickyStyle(property: 'bold' | 'italic') {
  const item = selectedItem.value
  if (!item || item.kind !== 'sticky') return
  const before = cloneItem(item)
  item[property] = !item[property]
  if (!item.draft) void updateRemote(before, cloneItem(item))
}

async function confirmDraft(draft?: GuestbookItem) {
  const item = draft ?? selectedItem.value
  if (!item?.draft) return
  if ((item.kind === 'text' || item.kind === 'sticky') && !item.text.trim()) {
    return
  }
  item.draft = false
  await createRemote(item)
}

function cancelDraft() {
  const item = selectedItem.value
  if (!item?.draft) return
  items.value = items.value.filter((candidate) => candidate.id !== item.id)
  selectedId.value = undefined
  editBefore = undefined
}

function chooseEmoji(event: Event) {
  const detail = (event as CustomEvent<{ unicode: string }>).detail
  selectedEmoji.value = detail.unicode
  emojiPickerOpen.value = false
  tool.value = 'emoji'
}

function closeEmojiPicker() {
  emojiPickerOpen.value = false
  tool.value = 'pan'
}

function styleEmojiPicker(element: Picker) {
  const style = document.createElement('style')
  style.textContent = `
    .picker { font-family: var(--font-sans); }
    .pad-top { height: 0.55rem; }
    .search-row { gap: 0.35rem; padding: 0 3.25rem 0.55rem 0.55rem; }
    input.search {
      height: 2.4rem;
      padding: 0 0.8rem;
      border-color: var(--rule-strong);
      background: var(--paper-sunk);
      box-shadow: var(--shadow-press-soft);
      transition: border-color 150ms ease, background-color 150ms ease, box-shadow 150ms ease;
    }
    input.search:hover { border-color: color-mix(in oklab, var(--accent) 42%, var(--rule-strong)); }
    input.search:focus-visible {
      border-color: var(--accent);
      outline: 2px solid color-mix(in oklab, var(--accent) 28%, transparent);
      outline-offset: 1px;
      box-shadow: var(--shadow-press-soft);
    }
    .skintone-button-wrapper { overflow: hidden; border-radius: 0.55rem; }
    .nav { gap: 0.1rem; padding: 0 0.35rem 0.15rem; }
    .nav-button { border-radius: 0.5rem; transition: background-color 150ms ease, transform 150ms ease; }
    .nav-button:hover { background: var(--accent-wash); }
    .nav-button:active { transform: scale(0.94); }
    .indicator-wrapper, .favorites { border-color: var(--rule); }
    .tabpanel { scrollbar-color: var(--rule-strong) transparent; }
    .category { font-size: 0.7rem; font-weight: 700; letter-spacing: 0.07em; text-transform: uppercase; }
    .favorites { padding: 0.3rem; }
    .emoji { transition: background-color 130ms ease, transform 130ms ease; }
    .emoji:active { transform: scale(0.88); }
    @media (prefers-reduced-motion: reduce) {
      .nav-button, .emoji, input.search { transition: none; }
    }
  `
  element.shadowRoot?.append(style)
}

async function prepareImage(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return (tool.value = 'select')
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 8_000_000) {
    tool.value = 'select'
    return showMessage('Choose a PNG, JPEG, or WebP under 8 MB.')
  }
  try {
    const src = await readFile(file)
    const image = await loadImage(src)
    const scale = Math.min(1, 480 / Math.max(image.naturalWidth, image.naturalHeight))
    const width = Math.max(40, Math.round(image.naturalWidth * scale))
    const height = Math.max(40, Math.round(image.naturalHeight * scale))
    const bitmap = document.createElement('canvas')
    bitmap.width = width
    bitmap.height = height
    bitmap.getContext('2d')!.drawImage(image, 0, 0, width, height)
    const item: ImageItem = {
      id: crypto.randomUUID(), kind: 'image', x: camera.value.x - width / 2, y: camera.value.y - height / 2, rotation: 0,
      src: bitmap.toDataURL('image/webp', 0.8), width, height,
      alt: file.name.replace(/\.[^.]+$/, '').slice(0, 120), owned: true,
    }
    items.value.push(item)
    selectedId.value = item.id
    tool.value = 'select'
    void createRemote(item)
  } catch {
    tool.value = 'select'
    showMessage('That image could not be read.')
  }
}

function readFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = src
  })
}

function onWheel(event: WheelEvent) {
  event.preventDefault()
  const before = worldPoint(event)
  const nextZoom = Math.min(4, Math.max(0.25, camera.value.zoom * Math.exp(-event.deltaY * 0.0015)))
  const rect = canvas.value!.getBoundingClientRect()
  const offsetX = event.clientX - rect.left - rect.width / 2
  const offsetY = event.clientY - rect.top - rect.height / 2
  camera.value = constrainCamera({
    x: before[0] - offsetX / nextZoom,
    y: before[1] - offsetY / nextZoom,
    zoom: nextZoom,
  })
}

function zoomBy(factor: number) {
  camera.value = constrainCamera({
    ...camera.value,
    zoom: Math.min(4, Math.max(0.25, camera.value.zoom * factor)),
  })
}

function focusRecent() {
  const latest = items.value.findLast((item) => !item.draft)
  const [x, y] = latest ? itemCenter(latest) : [0, 0]
  camera.value = { x, y, zoom: 1 }
}

async function loadItems(center = false) {
  if (interaction) return
  try {
    const result = await api<{ items: GuestbookItem[] }>()
    const drafts = items.value.filter((item) => item.draft)
    const selected = selectedItem.value
    items.value = result.items.map((remote) => {
      if (selected?.id === remote.id && selected.owned) return selected
      return normalizeItem(remote)
    })
    for (const draft of drafts) if (!items.value.some((item) => item.id === draft.id)) items.value.push(draft)
    if (center) focusRecent()
  } catch (error) {
    showError(error)
  } finally {
    loading.value = false
  }
}

async function loadVisitorCount() {
  try {
    const result = await api<{ count: number }>('/visitors')
    visitorCount.value = result.count
  } catch {
    // The canvas remains usable if the optional counter cannot be reached.
  }
}

function connectRealtime() {
  liveStream?.close()
  liveStream = new EventSource(`${endpoint}/stream`)
  liveStream.addEventListener('ready', () => void loadItems())
  liveStream.addEventListener('guestbook', (event) => {
    const change = JSON.parse((event as MessageEvent<string>).data) as
      | { action: 'upsert'; item: GuestbookItem }
      | { action: 'delete'; id: string }
    if (change.action === 'delete') {
      items.value = items.value.filter((item) => item.id !== change.id)
      if (selectedId.value === change.id) selectedId.value = undefined
      return
    }
    const existing = items.value.find((item) => item.id === change.item.id)
    change.item.owned = Boolean(existing?.owned)
    if (existing?.draft) return
    replaceItem(change.item)
  })
}

function onKeydown(event: KeyboardEvent) {
  const target = event.target as HTMLElement
  if (target.matches('input, textarea, select, [contenteditable="true"]')) return
  const modifier = event.metaKey || event.ctrlKey
  if (!modifier) return
  if (event.key.toLowerCase() === 'z') {
    event.preventDefault()
    if (event.shiftKey) void redo()
    else void undo()
  } else if (event.key.toLowerCase() === 'y') {
    event.preventDefault()
    void redo()
  }
}

function onDeviceMotion(event: DeviceMotionEvent) {
  if (!history.value.length || saving.value) return
  const acceleration = event.acceleration ?? event.accelerationIncludingGravity
  if (!acceleration) return
  const magnitude = Math.hypot(acceleration.x ?? 0, acceleration.y ?? 0, acceleration.z ?? 0)
  const now = Date.now()
  if (magnitude < 22 || now - lastShake < 1_400) return
  lastShake = now
  navigator.vibrate?.(35)
  void undo()
}

async function enableShakeUndo() {
  if (
    shakeEnabled ||
    shakePermissionRequested ||
    typeof DeviceMotionEvent === 'undefined' ||
    !window.matchMedia('(pointer: coarse)').matches
  ) return
  shakePermissionRequested = true
  const motion = DeviceMotionEvent as typeof DeviceMotionEvent & {
    requestPermission?: () => Promise<'granted' | 'denied'>
  }
  try {
    if (motion.requestPermission && (await motion.requestPermission()) !== 'granted') return
    window.addEventListener('devicemotion', onDeviceMotion)
    shakeEnabled = true
  } catch {
    // Motion permission is optional; keyboard and toolbar undo remain available.
  }
}

function flushPendingDraft() {
  const item = selectedItem.value
  if (!item?.draft || (item.kind !== 'text' && item.kind !== 'sticky') || !item.text.trim()) return
  item.draft = false
  void fetch(endpoint, {
    method: 'POST',
    keepalive: true,
    headers: requestHeaders(true),
    body: JSON.stringify(payload(item)),
  })
}

function showError(error: unknown) {
  if (error instanceof ApiError && error.status === 429) {
    const minutes = error.retryAfter ? Math.max(1, Math.ceil(error.retryAfter / 60)) : undefined
    rateLimitWarning.value = minutes
      ? `You've reached the guestbook limit. Try again in about ${minutes} min.`
      : "You've reached the guestbook limit. Give it a little time, then try again."
    return
  }
  showMessage(error instanceof Error && error.message ? error.message : 'The guestbook could not save that change.')
}

function showMessage(text: string) {
  message.value = text
  window.setTimeout(() => {
    if (message.value === text) message.value = ''
  }, 3400)
}

watch([emojiPickerOpen, emojiPickerHost], ([open, host]) => {
  if (open && host && picker) host.append(picker)
}, { flush: 'post' })

onMounted(async () => {
  window.addEventListener('keydown', onKeydown)
  window.addEventListener('pagehide', flushPendingDraft)
  if (
    typeof DeviceMotionEvent !== 'undefined' &&
    !('requestPermission' in DeviceMotionEvent) &&
    window.matchMedia('(pointer: coarse)').matches
  ) {
    window.addEventListener('devicemotion', onDeviceMotion)
    shakeEnabled = true
  }
  resizeObserver = new ResizeObserver(([entry]) => {
    viewport.value = { width: entry.contentRect.width, height: entry.contentRect.height }
    camera.value = constrainCamera(camera.value)
  })
  if (shell.value) resizeObserver.observe(shell.value)
  picker = new Picker({ dataSource: emojiDataUrl })
  picker.setAttribute('aria-label', 'Search and choose an emoji')
  styleEmojiPicker(picker)
  picker.addEventListener('emoji-click', chooseEmoji)
  void loadVisitorCount()
  await loadItems(true)
  connectRealtime()
})

onBeforeUnmount(() => {
  flushPendingDraft()
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('pagehide', flushPendingDraft)
  window.removeEventListener('devicemotion', onDeviceMotion)
  resizeObserver?.disconnect()
  picker?.removeEventListener('emoji-click', chooseEmoji)
  picker?.remove()
  liveStream?.close()
})
</script>

<template>
  <div class="pt-24 pb-8">
    <header class="mb-7 max-w-3xl">
      <p class="eyebrow mb-3" aria-live="polite">{{ visitorLabel }}</p>
      <h1 class="display">Leave your mark.</h1>
      <p class="mt-5 max-w-2xl text-base leading-relaxed text-ink-2 md:text-lg">
        Draw, type, paste a note, or add a tiny piece of yourself. This page belongs to everyone,
        so be kind to the people who arrive after you.
      </p>
    </header>

    <section ref="shell" class="guestbook-shell relative overflow-hidden rounded-2xl border border-rule-strong bg-surface shadow-e2" aria-label="Interactive guestbook canvas">
      <svg
        ref="canvas"
        class="absolute inset-0 size-full touch-none select-none"
        :style="{ cursor }"
        :viewBox="viewBoxString"
        role="application"
        aria-label="Infinite guestbook. Choose a tool, then draw or place an editable object."
        @pointerdown.capture="trackTouchPointer"
        @pointerdown="onCanvasPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
        @wheel="onWheel"
      >
        <defs>
          <pattern id="guest-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 16 20 H 24 M 20 16 V 24" stroke="#cfc2ae" stroke-width="0.8" />
          </pattern>
          <filter id="guest-shadow" x="-20%" y="-20%" width="140%" height="150%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#32170f" flood-opacity="0.22" />
          </filter>
          <linearGradient id="note-fold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#fff" stop-opacity="0.58" />
            <stop offset="0.58" stop-color="#fff" stop-opacity="0.18" />
            <stop offset="1" stop-color="#5c4024" stop-opacity="0.2" />
          </linearGradient>
        </defs>
        <rect :x="viewBox.x" :y="viewBox.y" :width="viewBox.width" :height="viewBox.height" fill="#f6f0e5" />
        <rect :x="viewBox.x" :y="viewBox.y" :width="viewBox.width" :height="viewBox.height" fill="url(#guest-grid)" />

        <g
          v-for="item in items"
          :key="item.id"
          :opacity="item.draft ? 0.82 : 1"
          :transform="itemTransform(item)"
          :class="item.kind !== 'drawing' && tool === 'select' ? (item.owned || item.draft ? 'canvas-owned' : 'canvas-inspect') : undefined"
          @pointerdown="item.kind !== 'drawing' && selectItem($event, item)"
        >
          <path
            v-if="item.kind === 'drawing'"
            :d="drawingPath(item.points)"
            fill="none"
            :stroke="item.color"
            :stroke-width="item.width"
            stroke-linecap="round"
            stroke-linejoin="round"
            :class="tool === 'select' ? 'doodle-inspect' : 'pointer-events-none'"
            @pointerdown="selectDrawing($event, item)"
          />

          <template v-else-if="item.kind === 'text'">
            <foreignObject :x="item.x" :y="item.y" :width="item.width" :height="item.height">
              <textarea
                v-if="selectedId === item.id && (item.owned || item.draft)"
                v-model="item.text"
                :data-guestbook-editor="item.id"
                class="canvas-editor canvas-text-editor"
                :style="textStyle(item)"
                maxlength="240"
                placeholder="Type here…"
                aria-label="Edit text on canvas"
                @pointerdown.stop
                @focus="beginEdit(item)"
                @input="onTextInput(item, $event)"
                @blur="commitEditor(item, $event)"
              />
              <div
                v-else
                class="canvas-display canvas-text-display"
                :style="textStyle(item)"
              >{{ item.text }}</div>
            </foreignObject>
          </template>

          <template v-else-if="item.kind === 'sticky'">
            <path :d="stickyPath(item)" :fill="stickyFill[item.color]" filter="url(#guest-shadow)" />
            <path :d="stickyFoldPath(item)" fill="url(#note-fold)" />
            <path :d="`M ${item.x + item.width - 38} ${item.y + 2} Q ${item.x + item.width - 13} ${item.y + 12} ${item.x + item.width - 2} ${item.y + 35}`" fill="none" stroke="#5c4024" stroke-opacity="0.18" stroke-width="1.5" />
            <foreignObject :x="item.x + 14" :y="item.y + 15" :width="item.width - 28" :height="item.height - 28">
              <textarea
                v-if="selectedId === item.id && (item.owned || item.draft)"
                v-model="item.text"
                :data-guestbook-editor="item.id"
                class="canvas-editor sticky-copy"
                :style="stickyTextStyle(item)"
                maxlength="400"
                placeholder="Write a note…"
                aria-label="Edit note on canvas"
                @pointerdown.stop
                @focus="beginEdit(item)"
                @blur="commitEditor(item, $event)"
              />
              <div
                v-else
                class="canvas-display sticky-copy"
                :style="stickyTextStyle(item)"
              >{{ item.text }}</div>
            </foreignObject>
          </template>

          <text
            v-else-if="item.kind === 'emoji'"
            :x="item.x"
            :y="item.y"
            :font-size="item.size"
            text-anchor="middle"
            dominant-baseline="central"
            :class="tool === 'select' ? undefined : 'pointer-events-none'"
          >{{ item.emoji }}</text>

          <g
            v-else-if="item.kind === 'image'"
            :class="tool === 'select' ? undefined : 'pointer-events-none'"
          >
            <rect :x="item.x - 6" :y="item.y - 6" :width="item.width + 12" :height="item.height + 12" rx="5" fill="#fffdf7" filter="url(#guest-shadow)" />
            <image :href="item.src" :x="item.x" :y="item.y" :width="item.width" :height="item.height" preserveAspectRatio="xMidYMid meet" />
          </g>
        </g>

        <path v-if="activePoints.length > 1" :d="drawingPath(activePoints)" fill="none" :stroke="penColor" :stroke-width="penWidth" stroke-linecap="round" stroke-linejoin="round" class="pointer-events-none" />

        <g v-if="selectedItem && selectedTooltip" :key="`tooltip-${selectedItem.id}`" class="pointer-events-none canvas-tooltip">
          <path
            :d="selectedTooltip.tail"
            fill="#fffaf0"
            stroke="#cbbba5"
            :stroke-width="1 / camera.zoom"
            stroke-linejoin="round"
            filter="url(#guest-shadow)"
          />
          <rect
            :x="selectedTooltip.x"
            :y="selectedTooltip.y"
            :width="selectedTooltip.width"
            :height="selectedTooltip.height"
            :rx="selectedTooltip.radius"
            fill="#fffaf0"
            stroke="#cbbba5"
            :stroke-width="1 / camera.zoom"
            filter="url(#guest-shadow)"
          />
          <line
            :x1="selectedTooltip.centerX - 13 / camera.zoom"
            :x2="selectedTooltip.centerX + 13 / camera.zoom"
            :y1="selectedTooltip.accentY"
            :y2="selectedTooltip.accentY"
            stroke="#c65d42"
            :stroke-width="2.5 / camera.zoom"
            stroke-linecap="round"
          />
          <text
            :x="selectedTooltip.centerX"
            :y="selectedTooltip.locationY"
            :font-size="12 / camera.zoom"
            text-anchor="middle"
            dominant-baseline="central"
            fill="#432d20"
            font-family="var(--font-sans)"
            font-weight="650"
          >{{ selectedTooltip.location }}</text>
          <text
            :x="selectedTooltip.centerX"
            :y="selectedTooltip.dateY"
            :font-size="9 / camera.zoom"
            text-anchor="middle"
            dominant-baseline="central"
            fill="#8b7163"
            font-family="var(--font-mono)"
            font-weight="600"
            :letter-spacing="0.35 / camera.zoom"
          >{{ selectedTooltip.date }}</text>
        </g>

        <g v-if="selectedItem && selectedBounds && canTransformSelected" class="selection-controls" :transform="itemTransform(selectedItem)">
          <rect :x="selectedBounds.x - 5 / camera.zoom" :y="selectedBounds.y - 5 / camera.zoom" :width="selectedBounds.width + 10 / camera.zoom" :height="selectedBounds.height + 10 / camera.zoom" fill="none" stroke="var(--accent)" :stroke-width="1.5 / camera.zoom" :stroke-dasharray="`${5 / camera.zoom} ${4 / camera.zoom}`" class="pointer-events-none" />
          <line
            :x1="selectedBounds.x + selectedBounds.width / 2"
            :y1="selectedBounds.y - 5 / camera.zoom"
            :x2="selectedBounds.x + selectedBounds.width / 2"
            :y2="selectedBounds.y - 28 / camera.zoom"
            stroke="var(--accent)"
            :stroke-width="1.5 / camera.zoom"
            class="pointer-events-none"
          />
          <circle
            :cx="selectedBounds.x + selectedBounds.width / 2"
            :cy="selectedBounds.y - 34 / camera.zoom"
            :r="8 / camera.zoom"
            fill="#fffaf0"
            stroke="var(--accent)"
            :stroke-width="2 / camera.zoom"
            class="rotate-handle"
            aria-label="Rotate mark"
            @pointerdown.stop="startRotate($event, selectedItem)"
          />
          <circle
            :cx="selectedBounds.x + selectedBounds.width + 5 / camera.zoom"
            :cy="selectedBounds.y + selectedBounds.height + 5 / camera.zoom"
            :r="7 / camera.zoom"
            fill="#fffaf0"
            stroke="var(--accent)"
            :stroke-width="2 / camera.zoom"
            class="resize-handle"
            @pointerdown.stop="startResize($event, selectedItem)"
          />
        </g>
      </svg>

      <div class="absolute inset-x-3 top-3 z-10 sm:inset-x-4 sm:top-4">
        <div class="toolbar unified-toolbar max-w-full rounded-xl p-1.5">
          <div class="toolbar-tools">
            <button v-for="entry in tools" :key="entry.id" type="button" class="tool-button" :class="tool === entry.id && 'tool-button-active'" :aria-label="entry.label" :aria-pressed="tool === entry.id" :title="entry.label" @click="selectTool(entry.id)">
              <component :is="entry.icon" class="size-4" />
              <span class="tool-label text-xs font-medium">{{ entry.label }}</span>
            </button>
            <button type="button" class="mini-button" :disabled="!history.length" aria-label="Undo" title="Undo (⌘Z)" @click="undo"><Undo2 class="size-4" /></button>
            <button type="button" class="mini-button" :disabled="!future.length" aria-label="Redo" title="Redo (⇧⌘Z)" @click="redo"><Redo2 class="size-4" /></button>
            <span class="zoom-controls">
              <span class="toolbar-divider" />
              <button type="button" class="mini-button" aria-label="Zoom out" @click="zoomBy(0.8)"><Minus class="size-4" /></button>
              <span class="tabular w-10 shrink-0 text-center text-xs text-ink-3">{{ Math.round(camera.zoom * 100) }}%</span>
              <button type="button" class="mini-button" aria-label="Zoom in" @click="zoomBy(1.25)"><Plus class="size-4" /></button>
            </span>
          </div>
        </div>

        <Transition name="options-reveal" mode="out-in">
          <div
            v-if="secondaryTool"
            :key="secondaryTool"
            class="toolbar secondary-toolbar mt-2 max-w-full rounded-xl"
            :class="[
              secondaryTool === 'emoji' ? 'emoji-toolbar' : 'toolbar-options p-1.5',
              secondaryTool === 'sticky' && 'sticky-toolbar',
            ]"
            @pointerdown.capture="preserveEditor"
          >
            <template v-if="tool === 'pen'">
              <label class="context-control"><span class="context-word">Ink</span><span class="color-preview secondary-color" :style="{ backgroundColor: penColor }"><input v-model="penColor" type="color" aria-label="Ink color" /></span></label>
              <label class="context-control range-control"><span class="context-word">Width</span><input v-model.number="penWidth" type="range" min="1" max="18" class="accent-[var(--accent)]" aria-label="Ink width" /></label>
            </template>

            <template v-if="selectedItem?.kind === 'text' && canEditSelected">
              <select v-model="selectedItem.font" class="editor-input font-input" aria-label="Font" @focus="beginEdit(selectedItem)" @change="onTextFontChange(selectedItem)">
                <option v-for="font in fontOptions" :key="font.value" :value="font.value" :style="{ fontFamily: font.family }">{{ font.label }}</option>
              </select>
              <input v-model.number="selectedItem.size" type="number" min="12" max="160" class="editor-input size-input" aria-label="Text size" @focus="beginEdit(selectedItem)" @change="onTextSizeChange(selectedItem)" />
              <label class="color-preview secondary-color" :style="{ backgroundColor: selectedItem.color }" title="Text color"><input v-model="selectedItem.color" type="color" aria-label="Text color" @focus="beginEdit(selectedItem)" @change="commitStyle(selectedItem)" /></label>
              <button type="button" class="mini-button secondary-button" :class="selectedItem.bold && 'mini-button-active'" aria-label="Bold" :aria-pressed="selectedItem.bold" @pointerdown.prevent @click="toggleTextStyle('bold')"><Bold class="size-4" /></button>
              <button type="button" class="mini-button secondary-button" :class="selectedItem.italic && 'mini-button-active'" aria-label="Italic" :aria-pressed="selectedItem.italic" @pointerdown.prevent @click="toggleTextStyle('italic')"><Italic class="size-4" /></button>
            </template>

            <template v-if="selectedItem?.kind === 'sticky' && canEditSelected">
              <button v-for="color in (Object.keys(stickyFill) as StickyColor[])" :key="color" type="button" class="note-swatch" :class="selectedItem.color === color && 'note-swatch-active'" :style="{ background: stickyFill[color] }" :aria-label="`${color} note`" @pointerdown.prevent="beginEdit(selectedItem)" @click="selectedItem.color = color; commitStyle(selectedItem)" />
              <select v-model="selectedItem.font" class="editor-input font-input note-font-input" aria-label="Note font" @focus="beginEdit(selectedItem)" @change="commitStyle(selectedItem)">
                <option v-for="font in fontOptions" :key="font.value" :value="font.value" :style="{ fontFamily: font.family }">{{ font.label }}</option>
              </select>
              <input v-model.number="selectedItem.size" type="number" min="12" max="64" class="editor-input size-input note-size-input" aria-label="Note text size" @focus="beginEdit(selectedItem)" @change="commitStyle(selectedItem)" />
              <label class="color-preview secondary-color" :style="{ backgroundColor: selectedItem.textColor }" title="Note text color"><input v-model="selectedItem.textColor" type="color" aria-label="Note text color" @focus="beginEdit(selectedItem)" @change="commitStyle(selectedItem)" /></label>
              <button type="button" class="mini-button secondary-button" :class="selectedItem.bold && 'mini-button-active'" aria-label="Bold note text" :aria-pressed="selectedItem.bold" @pointerdown.prevent @click="toggleStickyStyle('bold')"><Bold class="size-4" /></button>
              <button type="button" class="mini-button secondary-button" :class="selectedItem.italic && 'mini-button-active'" aria-label="Italic note text" :aria-pressed="selectedItem.italic" @pointerdown.prevent @click="toggleStickyStyle('italic')"><Italic class="size-4" /></button>
            </template>

            <template v-if="secondaryTool === 'emoji'">
              <button type="button" class="picker-close" aria-label="Close emoji picker" @click="closeEmojiPicker"><X class="size-4" /></button>
              <div ref="emojiPickerHost" class="emoji-picker-host" />
            </template>

          </div>
        </Transition>
      </div>

      <input ref="imageInput" type="file" accept="image/png,image/jpeg,image/webp" class="sr-only" @change="prepareImage" />

      <Transition name="options-reveal">
        <div v-if="rateLimitWarning" class="rate-limit-warning" role="alert">
          <span>{{ rateLimitWarning }}</span>
          <button type="button" aria-label="Dismiss limit warning" @click="rateLimitWarning = ''">
            <X class="size-4" />
          </button>
        </div>
      </Transition>

      <p class="sr-only" role="status" aria-live="polite">{{ message }}</p>
    </section>

    <p class="mt-3 text-xs leading-relaxed text-ink-3">
      shake to undo
    </p>
  </div>
</template>

<style scoped>
.guestbook-shell { height: calc(100dvh - 126px); min-height: 390px; isolation: isolate; background: #f6f0e5; box-shadow: var(--sheen), var(--shadow-2); }
.toolbar { color: var(--ink); background: color-mix(in oklab, var(--surface) 92%, transparent); border: 1px solid var(--rule-strong); box-shadow: var(--shadow-2); backdrop-filter: blur(16px); }
.unified-toolbar { width: 100%; overflow: hidden; }
.toolbar-tools { display: grid; width: 100%; grid-template-columns: repeat(10, minmax(0, 1fr)); gap: 0.15rem; }
.toolbar-tools > .mini-button { width: 100%; }
.secondary-toolbar { width: 100%; transform-origin: top left; }
.toolbar-options { display: flex; min-width: 0; min-height: 2.1rem; align-items: center; gap: 0.4rem; }
.sticky-toolbar { gap: 0.3rem; padding-inline: 0.3rem; }
.toolbar-divider { width: 1px; height: 1.25rem; margin: 0 0.25rem; flex: none; background: var(--rule); }
.context-word { display: none; color: var(--ink-3); font-size: 0.65rem; font-weight: 700; letter-spacing: 0.075em; text-transform: uppercase; }
.context-control { display: inline-flex; min-width: 0; align-items: center; gap: 0.35rem; color: var(--ink-2); font-size: 0.72rem; font-weight: 650; }
.range-control { flex: 1 1 7rem; }
.range-control input { width: 100%; min-width: 4.5rem; }
.tool-button, .mini-button { display: inline-flex; align-items: center; justify-content: center; gap: 0.4rem; min-height: 2rem; border-radius: 0.5rem; color: var(--ink-2); transition: color 150ms ease, background-color 150ms ease, box-shadow 150ms ease; }
.tool-button { width: 100%; min-width: 0; padding: 0; }
.tool-label { display: none; }
.mini-button { width: 1.75rem; flex: none; }
.tool-button:hover:not(:disabled), .mini-button:hover:not(:disabled) { color: var(--ink); background: var(--accent-wash); }
.tool-button-active, .mini-button-active { color: var(--accent); background: var(--accent-wash); box-shadow: inset 0 0 0 1px var(--rule); }
.mini-button:disabled { cursor: not-allowed; opacity: 0.35; }
.editor-input { height: 1.85rem; border: 1px solid var(--rule); border-radius: 0.5rem; background: var(--paper-sunk); padding: 0 0.5rem; color: var(--ink); font-size: 0.72rem; box-shadow: var(--shadow-press-soft); }
.font-input { width: 7rem; min-width: 0; flex: 0 1 7rem; }
.size-input { width: 3rem; padding-inline: 0.45rem; }
.color-preview { position: relative; display: inline-block; width: 1.7rem; height: 1.7rem; flex: none; overflow: hidden; border: 2px solid var(--surface); border-radius: 999px; box-shadow: 0 0 0 1px var(--rule-strong); }
.secondary-color { width: 1.45rem; height: 1.45rem; }
.secondary-button { width: 1.6rem; min-height: 1.85rem; }
.color-preview input { position: absolute; inset: -8px; width: calc(100% + 16px); height: calc(100% + 16px); cursor: pointer; opacity: 0; }
.canvas-owned { cursor: move; pointer-events: auto; }
.canvas-inspect { cursor: pointer; pointer-events: auto; }
.canvas-editor, .canvas-display { box-sizing: border-box; width: 100%; height: 100%; margin: 0; border: 0; background: transparent; outline: 0; resize: none; overflow: hidden; white-space: pre-wrap; overflow-wrap: anywhere; }
.canvas-editor { padding: 3px; box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--accent) 45%, transparent); }
.canvas-text-display, .canvas-text-editor { padding: 3px; line-height: 1.12; white-space: pre; overflow-wrap: normal; }
.sticky-copy { padding: 2px; line-height: 1.35; }
.resize-handle { cursor: nwse-resize; }
.rotate-handle { cursor: grab; }
.rotate-handle:active { cursor: grabbing; }
.doodle-inspect { cursor: pointer; pointer-events: stroke; }
.rate-limit-warning { position: absolute; z-index: 20; right: 1rem; bottom: 1rem; left: 1rem; display: flex; max-width: 30rem; align-items: center; justify-content: space-between; gap: 0.75rem; margin-inline: auto; border: 1px solid color-mix(in oklab, var(--accent) 45%, var(--rule-strong)); border-radius: 0.85rem; padding: 0.7rem 0.75rem 0.7rem 0.9rem; color: var(--ink); background: color-mix(in oklab, var(--surface) 96%, transparent); box-shadow: var(--shadow-2); backdrop-filter: blur(16px); font-size: 0.78rem; font-weight: 650; line-height: 1.35; }
.rate-limit-warning button { display: grid; width: 1.8rem; height: 1.8rem; flex: none; place-items: center; border-radius: 0.5rem; color: var(--ink-2); transition: color 150ms ease, background-color 150ms ease; }
.rate-limit-warning button:hover { color: var(--ink); background: var(--accent-wash); }
.canvas-tooltip { transform-box: fill-box; transform-origin: center bottom; animation: tooltip-pop 220ms cubic-bezier(0.22, 1, 0.36, 1); }
@keyframes tooltip-pop {
  from { opacity: 0; transform: translateY(5px) scale(0.94); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
.note-swatch { width: 1rem; height: 1rem; aspect-ratio: 1; flex: none; border: 1.5px solid var(--surface); border-radius: 50%; box-shadow: 0 0 0 1px var(--rule); }
.note-swatch-active { box-shadow: 0 0 0 2px var(--accent); }
.note-font-input { width: 5.25rem; flex: 0 1 5.25rem; }
.note-size-input { width: 3rem; }
.zoom-controls { display: none; align-items: center; }
.secondary-toolbar.emoji-toolbar { position: relative; width: 100%; overflow: hidden; padding: 0.35rem; }
.emoji-picker-host { width: 100%; }
.picker-close { position: absolute; z-index: 2; top: 0.55rem; right: 0.55rem; display: grid; width: 2.4rem; height: 2.4rem; place-items: center; border: 1px solid var(--rule-strong); border-radius: 0.6rem; color: var(--ink-2); background: var(--surface-2); box-shadow: var(--shadow-1); transition: color 150ms ease, background-color 150ms ease, border-color 150ms ease, transform 150ms ease; }
.picker-close:hover { color: var(--ink); border-color: color-mix(in oklab, var(--accent) 38%, var(--rule-strong)); background: var(--surface); }
.picker-close:active { transform: scale(0.94); }
.emoji-toolbar :deep(emoji-picker) { display: flex; width: 100%; height: min(390px, 48vh); overflow: hidden; border-radius: 0.7rem; --background: var(--surface); --border-color: transparent; --border-radius: 0.7rem; --border-size: 0px; --emoji-padding: 0.42rem; --input-border-color: var(--rule-strong); --input-border-radius: 0.6rem; --input-border-size: 1px; --input-padding: 0.55rem 0.75rem; --input-font-size: 0.9rem; --input-font-color: var(--ink); --input-placeholder-color: var(--ink-3); --outline-color: var(--accent); --indicator-color: var(--accent); --button-hover-background: var(--accent-wash); --button-active-background: color-mix(in oklab, var(--accent) 16%, transparent); --category-font-color: var(--ink-2); }

.options-reveal-enter-active,
.options-reveal-leave-active { transition: opacity 180ms ease, transform 260ms cubic-bezier(0.22, 1, 0.36, 1), filter 220ms ease; will-change: opacity, transform, filter; }
.options-reveal-enter-from,
.options-reveal-leave-to { opacity: 0; transform: translateY(-0.5rem) scale(0.98); filter: blur(5px); }
.options-reveal-enter-to,
.options-reveal-leave-from { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }

@media (min-width: 480px) {
  .toolbar-options { gap: 0.65rem; }
  .sticky-toolbar { gap: 0.6rem; padding-inline: 0.6rem; }
  .editor-input { height: 2.1rem; padding-inline: 0.65rem; font-size: 0.78rem; }
  .size-input, .note-size-input { width: 4.25rem; }
  .secondary-color { width: 1.6rem; height: 1.6rem; }
  .secondary-button { width: 1.85rem; min-height: 2.1rem; }
  .note-swatch { width: 1.35rem; height: 1.35rem; }
  .note-font-input { width: 5.5rem; flex-basis: 5.5rem; }
}

@media (min-width: 1024px) {
  .unified-toolbar, .secondary-toolbar { width: max-content; }
  .secondary-toolbar.emoji-toolbar { width: min(32rem, calc(100vw - 2rem)); }
  .toolbar-tools { display: flex; width: auto; }
  .toolbar-tools > .mini-button { width: 2rem; }
  .tool-button { width: auto; padding: 0 0.65rem; }
  .context-word { display: inline-flex; }
  .range-control { flex: none; }
  .range-control input { width: 5rem; }
  .font-input { width: 8.5rem; flex: none; }
  .size-input { width: 4.5rem; }
  .sticky-toolbar { gap: 0.7rem; padding-inline: 0.7rem; }
  .note-font-input { width: 5.5rem; }
  .note-size-input { width: 4.25rem; }
  .zoom-controls { display: inline-flex; }
}

@media (prefers-reduced-motion: reduce) {
  .canvas-tooltip { animation: none; }
  .options-reveal-enter-active,
  .options-reveal-leave-active { transition: none; }
}

</style>
