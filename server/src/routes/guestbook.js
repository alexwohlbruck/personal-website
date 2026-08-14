import { Router } from 'express'
import { getGuestbookVisitorCount } from '../apis/analytics.js'
import { ensureAdminSessions, readAdminSession } from '../lib/admin-auth.js'
import { cached } from '../lib/cache.js'
import { database, ensureGuestbookSchema } from '../lib/database.js'
import { guestbookItemBounds } from '../lib/guestbook-geometry.js'
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
// Roughly a 96px webp. Big enough to recognise, small enough that fourteen of
// them together are still a fraction of one full sized upload.
const THUMB_LIMIT = 24_000
// How many marks one window may return. A dense corner of the board gives up
// its most recent marks first rather than everything it holds.
const REGION_LIMIT = 600
// Roughly three megabytes of marks, and a rough allowance for the JSON around
// each one. Both are ceilings, not targets: an ordinary window is a few dozen
// kilobytes.
const RESPONSE_BUDGET = 3_000_000
const ROW_OVERHEAD = 512

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
    // The limit exists to stop one visitor filling the board. The owner
    // clearing up after them should not be spending the same allowance.
    if (readAdminSession(req)) return next()

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
  const image = {
    ...base,
    src: input.src,
    width: input.width,
    height: input.height,
    alt: String(input.alt ?? '').trim().slice(0, 120),
  }

  // A postage stamp of the same picture, for the home page card and anywhere
  // else that wants to show the board without carrying a megabyte of base64.
  // Optional, because marks made before this existed do not have one.
  if (input.thumb !== undefined && input.thumb !== null) {
    if (!IMAGE.test(input.thumb) || input.thumb.length > THUMB_LIMIT) reject('Invalid image preview.')
    image.thumb = input.thumb
  }
  return image
}

const CORNERS = ['left', 'top', 'right', 'bottom']

/** The window being asked for, or null for "whatever is most recent". */
export function readRegion(query) {
  const given = CORNERS.filter((name) => query[name] !== undefined)
  if (!given.length) return null
  if (given.length !== CORNERS.length) reject('A region needs left, top, right and bottom.')

  const values = CORNERS.map((name) => Number(query[name]))
  if (!values.every((value) => Number.isFinite(value) && Math.abs(value) <= 1e9)) {
    reject('A region needs four finite numbers.')
  }

  // Accept the corners in either order rather than returning nothing for a
  // window that was described from the bottom right.
  const [left, top, right, bottom] = values
  return {
    left: Math.min(left, right),
    top: Math.min(top, bottom),
    right: Math.max(left, right),
    bottom: Math.max(top, bottom),
  }
}

const shape = (row) => ({
  id: row.id,
  kind: row.kind,
  x: row.x,
  y: row.y,
  ...row.payload,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
  owned: row.owned,
})

/**
 * As many marks as will fit in a sane response.
 *
 * A row limit alone does not bound anything, because an image carries its
 * pixels inline: six hundred notes is a hundred kilobytes and six hundred
 * photographs is a hundred megabytes. Anyone could ask for the widest possible
 * window and pull that repeatedly. Counting bytes as they go in keeps a
 * request expensive for the server only in proportion to what it returns,
 * and keeps a dense corner from timing out an ordinary visitor.
 */
export function fitInResponse(rows) {
  const items = []
  let budget = RESPONSE_BUDGET

  for (const row of rows) {
    const item = shape(row)
    budget -= (item.src?.length ?? 0) + (item.thumb?.length ?? 0) + ROW_OVERHEAD
    if (budget < 0 && items.length) return { items, truncated: true }
    items.push(item)
  }
  return { items, truncated: false }
}

/**
 * The marks in one part of the board.
 *
 * Without a region this answers with the most recent marks, which is what a
 * client that has not been told about regions expects. With one it reads
 * through the spatial index, so a board with a hundred thousand marks costs
 * the same to open as a board with a hundred.
 */
router.get('/', async (req, res) => {
  const clientId = guestbookClientId(req, false)
  const region = readRegion(req.query)
  const limit = Math.min(1_000, Math.max(1, Number(req.query.limit) || REGION_LIMIT))
  await ensureGuestbookSchema()

  const result = region
    ? await database().query(
        `SELECT id, kind, x, y, payload, created_at AS "createdAt", updated_at AS "updatedAt",
                client_id = $1::uuid AS owned
           FROM (
             SELECT * FROM guestbook_items
              WHERE box(point(min_x, min_y), point(max_x, max_y))
                 && box(point($2, $3), point($4, $5))
              ORDER BY updated_at DESC
              LIMIT $6
           ) window_
          ORDER BY updated_at ASC`,
        [clientId, region.left, region.top, region.right, region.bottom, limit],
      )
    : await database().query(
        `SELECT id, kind, x, y, payload, created_at AS "createdAt", updated_at AS "updatedAt",
                client_id = $1::uuid AS owned
           FROM (
             SELECT * FROM guestbook_items ORDER BY updated_at DESC LIMIT $2
           ) recent
          ORDER BY updated_at ASC`,
        [clientId, limit],
      )

  const page = fitInResponse(result.rows)
  res.set('Cache-Control', 'no-store')
  res.json({
    items: page.items,
    // The region held more than one response can carry, so the client knows
    // it is looking at the most recent slice rather than all of it.
    truncated: page.truncated || result.rowCount >= limit,
  })
})

/**
 * Where the board is and where to open it.
 *
 * The canvas is unbounded, so a first time visitor has to be put somewhere
 * that has something on it. The middle of the twenty most recent marks lands
 * wherever people have been drawing lately, which beats both the origin and
 * the single newest mark: one is usually empty, the other is wherever one
 * person happened to wander off to.
 */
router.get('/overview', async (req, res) => {
  // Every visitor asks this once, and it is four aggregates and a count across
  // the whole table, which no index can answer. Half a minute of staleness in
  // "where has everyone been drawing" is not something anyone can perceive.
  const overview = await cached('guestbook:overview', 30_000, readOverview)
  res.set('Cache-Control', 'public, max-age=30')
  res.json(overview)
})

async function readOverview() {
  await ensureGuestbookSchema()
  const result = await database().query(
    `WITH recent AS (
       SELECT min_x, min_y, max_x, max_y
         FROM guestbook_items
        WHERE min_x IS NOT NULL
        ORDER BY updated_at DESC
        LIMIT 20
     )
     SELECT
       (SELECT count(*) FROM guestbook_items) AS count,
       (SELECT avg((min_x + max_x) / 2) FROM recent) AS "centerX",
       (SELECT avg((min_y + max_y) / 2) FROM recent) AS "centerY",
       min(min_x) AS left, min(min_y) AS top,
       max(max_x) AS right, max(max_y) AS bottom
     FROM guestbook_items`,
  )

  const row = result.rows[0] ?? {}
  const bounded = row.left !== null && row.left !== undefined
  return {
    count: Number(row.count ?? 0),
    center: { x: Number(row.centerX ?? 0), y: Number(row.centerY ?? 0) },
    bounds: bounded
      ? { left: Number(row.left), top: Number(row.top), right: Number(row.right), bottom: Number(row.bottom) }
      : null,
  }
}

router.get('/preview', async (req, res) => {
  await ensureGuestbookSchema()
  const result = await database().query(
    `SELECT id, kind, x, y, payload - 'src' AS payload
     FROM (
       SELECT * FROM guestbook_items ORDER BY updated_at DESC LIMIT 14
     ) recent
     ORDER BY updated_at ASC`,
  )

  res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
  res.json({
    items: result.rows.map((row) => ({
      id: row.id,
      kind: row.kind,
      x: row.x,
      y: row.y,
      ...row.payload,
    })),
  })
})

router.get('/stream', (req, res) => {
  const { send, sendRaw, close } = openStream(req, res)
  send('ready', { connected: true })
  close(subscribeToGuestbook((frame) => sendRaw('guestbook', frame)))
})

router.get('/visitors', async (req, res) => {
  const count = await getGuestbookVisitorCount()
  res.set('Cache-Control', 'no-store')
  res.json({ count })
})

/**
 * One mark, in full.
 *
 * The live stream leaves uploads out, so this is how a canvas that is looking
 * at a photograph someone just added gets the photograph. One request from
 * whoever is actually watching that spot, rather than a megabyte pushed at
 * everybody who happens to have the page open.
 */
router.get('/:id', async (req, res) => {
  const clientId = guestbookClientId(req, false)
  if (!UUID.test(req.params.id)) reject('Invalid item id.')
  await ensureGuestbookSchema()
  const result = await database().query(
    `SELECT id, kind, x, y, payload, created_at AS "createdAt", updated_at AS "updatedAt",
            client_id = $2::uuid AS owned
       FROM guestbook_items WHERE id = $1`,
    [req.params.id, clientId],
  )
  if (!result.rowCount) return res.status(404).json({ message: 'That mark is no longer here.' })
  res.set('Cache-Control', 'no-store')
  res.json(shape(result.rows[0]))
})

router.post('/', writeLimiter.guard, async (req, res) => {
  const clientId = guestbookClientId(req)
  const item = sanitizeGuestbookItem(req.body)
  // Both are waits on somebody else's machine, and neither needs the other's
  // answer. Serially they were a geolocation round trip stacked on top of a
  // database round trip before the mark could be written.
  const [location] = await Promise.all([resolveIpLocation(req.ip), ensureGuestbookSchema()])
  item.location = location
  const { id, kind, x, y, ...payload } = item
  const box = guestbookItemBounds(item)
  const result = await database().query(
    `INSERT INTO guestbook_items (id, kind, x, y, payload, client_id, min_x, min_y, max_x, max_y)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     ON CONFLICT (id) DO NOTHING
     RETURNING created_at AS "createdAt", updated_at AS "updatedAt"`,
    [id, kind, x, y, payload, clientId, box.minX, box.minY, box.maxX, box.maxY],
  )
  if (!result.rowCount) return res.status(409).json({ message: 'That mark is already on the board.' })
  const saved = { ...item, ...result.rows[0] }
  publishGuestbook({ action: 'upsert', item: { ...saved, owned: false } })
  res.status(201).json({ ...saved, owned: true })
})

router.put('/:id', async (req, res) => {
  // Load the session generation before asking whether this is the owner: the
  // check reads it synchronously and answers "no" if it is not there yet.
  await ensureAdminSessions()
  const admin = Boolean(readAdminSession(req))
  const clientId = guestbookClientId(req, !admin)
  const item = sanitizeGuestbookItem(req.body)
  if (item.id !== req.params.id) reject('The item id cannot be changed.')
  const { id, kind, x, y, ...payload } = item
  const box = guestbookItemBounds(item)
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
            min_x = $7, min_y = $8, max_x = $9, max_y = $10,
            updated_at = now()
      WHERE id = $1 AND ($6::uuid IS NULL OR client_id = $6)
      RETURNING payload, client_id AS "clientId", created_at AS "createdAt", updated_at AS "updatedAt"`,
    // A null here means "any owner", which only an admin session can ask for.
    [id, kind, x, y, payload, admin ? null : clientId, box.minX, box.minY, box.maxX, box.maxY],
  )
  if (!result.rowCount) return res.status(404).json({ message: 'That mark cannot be edited from this session.' })
  const { payload: stored, clientId: owner, ...timestamps } = result.rows[0]
  const saved = { ...item, ...stored, ...timestamps }
  publishGuestbook({ action: 'upsert', item: { ...saved, owned: false } })
  // An admin editing somebody else's mark has not adopted it, and the canvas
  // still shows whose it was.
  res.json({ ...saved, owned: Boolean(clientId) && owner === clientId })
})

router.delete('/:id', async (req, res) => {
  await ensureAdminSessions()
  const admin = Boolean(readAdminSession(req))
  const clientId = guestbookClientId(req, !admin)
  if (!UUID.test(req.params.id)) reject('Invalid item id.')
  await ensureGuestbookSchema()
  const result = await database().query(
    'DELETE FROM guestbook_items WHERE id = $1 AND ($2::uuid IS NULL OR client_id = $2)',
    [req.params.id, admin ? null : clientId],
  )
  if (!result.rowCount) return res.status(404).json({ message: 'That mark cannot be removed from this session.' })
  writeLimiter.release(req.params.id)
  publishGuestbook({ action: 'delete', id: req.params.id })
  res.status(204).end()
})

export default router
