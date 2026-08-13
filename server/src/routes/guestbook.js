import { Router } from 'express'
import { database, ensureGuestbookSchema } from '../lib/database.js'
import { publishGuestbook, subscribeToGuestbook } from '../lib/guestbook-live.js'
import { resolveIpLocation } from '../lib/ip-location.js'
import { openStream } from '../lib/sse.js'

const router = Router()
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const HEX = /^#[0-9a-f]{6}$/i
const IMAGE = /^data:image\/(png|jpeg|webp);base64,/i
const KINDS = new Set(['drawing', 'text', 'sticky', 'emoji', 'image'])
const FONTS = new Set([
  'system', 'geist', 'exposure', 'humanist', 'rounded', 'serif', 'book', 'mono', 'cursive', 'casual', 'handwritten', 'display',
])
const STICKY_COLORS = new Set(['yellow', 'pink', 'blue', 'green', 'orange', 'lavender'])
const CLIENT_HEADER = 'X-Guestbook-Client'

// Enough for a real drawing session, low enough that a single address cannot
// fill the board with a tight request loop. Deploy restarts naturally clear it.
const WRITE_LIMIT = 100
const WINDOW_MS = 60 * 60 * 1000

export function createWriteLimiter({ limit = WRITE_LIMIT, windowMs = WINDOW_MS, now = Date.now } = {}) {
  const writes = new Map()

  function removeReservation(key, reservation) {
    const remaining = (writes.get(key) ?? []).filter((entry) => entry !== reservation)
    if (remaining.length) writes.set(key, remaining)
    else writes.delete(key)
  }

  function guard(req, res, next) {
    const key = req.ip
    const timestamp = now()
    const recent = (writes.get(key) ?? []).filter((entry) => timestamp - entry.time < windowMs)
    if (recent.length >= limit) {
      const retryAfter = Math.max(1, Math.ceil((recent[0].time + windowMs - timestamp) / 1000))
      res.set('Retry-After', String(retryAfter))
      return res.status(429).json({
        message: 'You have reached the guestbook limit. Give it a little time, then try again.',
        retryAfter,
      })
    }

    const reservation = { id: req.body?.id, time: timestamp }
    recent.push(reservation)
    writes.set(key, recent)
    res.once('finish', () => {
      if (res.statusCode >= 400) removeReservation(key, reservation)
    })

    if (writes.size > 1_000) {
      for (const [address, entries] of writes) {
        if (!entries.some((entry) => timestamp - entry.time < windowMs)) writes.delete(address)
      }
    }
    next()
  }

  function release(id) {
    for (const [key, entries] of writes) {
      const remaining = entries.filter((entry) => entry.id !== id)
      if (remaining.length) writes.set(key, remaining)
      else writes.delete(key)
    }
  }

  return { guard, release }
}

const writeLimiter = createWriteLimiter()

const finite = (value, limit = 1_000_000) =>
  typeof value === 'number' && Number.isFinite(value) && Math.abs(value) <= limit
const numberBetween = (value, min, max) => finite(value, max) && value >= min && value <= max

function reject(message) {
  const error = new Error(message)
  error.status = 400
  throw error
}

export function guestbookClientId(req, required = true) {
  const value = req.get(CLIENT_HEADER)?.trim()
  if (value && UUID.test(value)) return value
  if (!required) return null
  const error = new Error('This guestbook session is no longer valid. Refresh and try again.')
  error.status = 401
  throw error
}

export function sanitizeGuestbookItem(input) {
  if (!input || typeof input !== 'object') reject('A guestbook item is required.')
  if (!UUID.test(input.id)) reject('Invalid item id.')
  if (!KINDS.has(input.kind)) reject('Invalid item type.')
  if (!finite(input.x) || !finite(input.y)) reject('Invalid item position.')
  const rotation = input.kind === 'drawing' ? 0 : Number(input.rotation ?? 0)
  if (!numberBetween(rotation, -180, 180)) reject('Invalid item rotation.')

  const base = { id: input.id, kind: input.kind, x: input.x, y: input.y, rotation }

  if (input.kind === 'drawing') {
    if (!Array.isArray(input.points) || input.points.length < 2 || input.points.length > 1200) {
      reject('A drawing must contain between 2 and 1,200 points.')
    }
    const points = input.points.map((point) => {
      if (!Array.isArray(point) || point.length !== 2 || !finite(point[0]) || !finite(point[1])) {
        reject('Invalid drawing point.')
      }
      return [point[0], point[1]]
    })
    if (!HEX.test(input.color) || !numberBetween(input.width, 1, 24)) {
      reject('Invalid drawing style.')
    }
    return { ...base, points, color: input.color, width: input.width }
  }

  if (input.kind === 'text') {
    const text = String(input.text ?? '').trim().slice(0, 240)
    if (!text) reject('Text cannot be empty.')
    if (
      !FONTS.has(input.font) ||
      !HEX.test(input.color) ||
      !numberBetween(input.size, 12, 160) ||
      !numberBetween(input.width, 80, 800) ||
      !numberBetween(input.height, 30, 500)
    ) {
      reject('Invalid text style.')
    }
    return {
      ...base,
      text,
      font: input.font,
      color: input.color,
      size: input.size,
      bold: Boolean(input.bold),
      italic: Boolean(input.italic),
      width: input.width,
      height: input.height,
    }
  }

  if (input.kind === 'sticky') {
    const text = String(input.text ?? '').trim().slice(0, 400)
    if (!text) reject('A note cannot be empty.')
    if (
      !STICKY_COLORS.has(input.color) ||
      !FONTS.has(input.font) ||
      !HEX.test(input.textColor) ||
      !numberBetween(input.size, 12, 64) ||
      !numberBetween(input.width, 100, 640) ||
      !numberBetween(input.height, 80, 640)
    ) {
      reject('Invalid note style.')
    }
    return {
      ...base,
      text,
      color: input.color,
      textColor: input.textColor,
      font: input.font,
      size: input.size,
      bold: Boolean(input.bold),
      italic: Boolean(input.italic),
      width: input.width,
      height: input.height,
    }
  }

  if (input.kind === 'emoji') {
    const emoji = String(input.emoji ?? '').trim().slice(0, 16)
    if (!emoji || !numberBetween(input.size, 24, 128)) reject('Invalid emoji.')
    return { ...base, emoji, size: input.size }
  }

  if (!IMAGE.test(input.src) || input.src.length > 700_000) reject('Invalid or oversized image.')
  if (!numberBetween(input.width, 40, 640) || !numberBetween(input.height, 40, 640)) {
    reject('Invalid image size.')
  }
  return {
    ...base,
    src: input.src,
    width: input.width,
    height: input.height,
    alt: String(input.alt ?? '').trim().slice(0, 120),
  }
}

router.get('/', async (req, res) => {
  const clientId = guestbookClientId(req, false)
  await ensureGuestbookSchema()
  const result = await database().query(
    `SELECT id, kind, x, y, payload, created_at AS "createdAt", updated_at AS "updatedAt",
            client_id = $1::uuid AS owned
     FROM (
       SELECT * FROM guestbook_items ORDER BY updated_at DESC LIMIT 750
     ) recent
     ORDER BY updated_at ASC`,
    [clientId],
  )

  res.set('Cache-Control', 'no-store')
  res.json({
    items: result.rows.map((row) => ({
      id: row.id,
      kind: row.kind,
      x: row.x,
      y: row.y,
      ...row.payload,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      owned: row.owned,
    })),
  })
})

router.get('/stream', (req, res) => {
  const { send, close } = openStream(req, res)
  send('ready', { connected: true })
  close(subscribeToGuestbook((change) => send('guestbook', change)))
})

router.post('/', writeLimiter.guard, async (req, res) => {
  const clientId = guestbookClientId(req)
  const item = sanitizeGuestbookItem(req.body)
  item.location = await resolveIpLocation(req.ip)
  const { id, kind, x, y, ...payload } = item
  await ensureGuestbookSchema()
  const result = await database().query(
    `INSERT INTO guestbook_items (id, kind, x, y, payload, client_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (id) DO NOTHING
     RETURNING created_at AS "createdAt", updated_at AS "updatedAt"`,
    [id, kind, x, y, payload, clientId],
  )
  if (!result.rowCount) return res.status(409).json({ message: 'That mark is already on the board.' })
  const saved = { ...item, ...result.rows[0] }
  publishGuestbook({ action: 'upsert', item: { ...saved, owned: false } })
  res.status(201).json({ ...saved, owned: true })
})

router.put('/:id', async (req, res) => {
  const clientId = guestbookClientId(req)
  const item = sanitizeGuestbookItem(req.body)
  if (item.id !== req.params.id) reject('The item id cannot be changed.')
  const { id, kind, x, y, ...payload } = item
  await ensureGuestbookSchema()
  const result = await database().query(
    `UPDATE guestbook_items
        SET kind = $2,
            x = $3,
            y = $4,
            payload = $5::jsonb || CASE
              WHEN payload ? 'location' THEN jsonb_build_object('location', payload->'location')
              ELSE '{}'::jsonb
            END,
            updated_at = now()
      WHERE id = $1 AND client_id = $6
      RETURNING payload, created_at AS "createdAt", updated_at AS "updatedAt"`,
    [id, kind, x, y, payload, clientId],
  )
  if (!result.rowCount) return res.status(404).json({ message: 'That mark cannot be edited from this session.' })
  const saved = { ...item, ...result.rows[0].payload, ...result.rows[0] }
  delete saved.payload
  publishGuestbook({ action: 'upsert', item: { ...saved, owned: false } })
  res.json({ ...saved, owned: true })
})

router.delete('/:id', async (req, res) => {
  const clientId = guestbookClientId(req)
  if (!UUID.test(req.params.id)) reject('Invalid item id.')
  await ensureGuestbookSchema()
  const result = await database().query(
    'DELETE FROM guestbook_items WHERE id = $1 AND client_id = $2',
    [req.params.id, clientId],
  )
  if (!result.rowCount) return res.status(404).json({ message: 'That mark cannot be removed from this session.' })
  writeLimiter.release(req.params.id)
  publishGuestbook({ action: 'delete', id: req.params.id })
  res.status(204).end()
})

export default router
