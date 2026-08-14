import pg from 'pg'
import { config } from '../config.js'
import { log } from '../util.js'

const { Pool } = pg

let pool
let schemaReady

export function database() {
  if (!config.database.configured) {
    const error = new Error('The guestbook database is not configured.')
    error.status = 503
    throw error
  }

  if (!pool) {
    pool = new Pool({
      connectionString: config.database.url,
      enableChannelBinding: true,
      max: 5,
      connectionTimeoutMillis: 10_000,
      idleTimeoutMillis: 30_000,
      allowExitOnIdle: true,
    })
    // A dropped idle connection should be reported, not become an unhandled
    // EventEmitter error that takes down unrelated site integrations.
    pool.on('error', (error) => log(`Database pool error: ${error.message}`, 'FgRed'))
  }
  return pool
}

/**
 * Keep this tiny app migration-free for now. The statement is idempotent and
 * is run once per process before the first guestbook query.
 */
export function ensureGuestbookSchema() {
  schemaReady ??= database()
    .query(`
      CREATE TABLE IF NOT EXISTS guestbook_items (
        id uuid PRIMARY KEY,
        kind text NOT NULL,
        x double precision NOT NULL,
        y double precision NOT NULL,
        payload jsonb NOT NULL,
        client_id uuid,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );

      ALTER TABLE guestbook_items
        ADD COLUMN IF NOT EXISTS client_id uuid;

      -- Where the mark sits, so the canvas can be read a region at a time.
      -- x and y alone will not do: they are one corner for a note, the middle
      -- for an emoji, and the first point of the line for a stroke.
      ALTER TABLE guestbook_items
        ADD COLUMN IF NOT EXISTS min_x double precision,
        ADD COLUMN IF NOT EXISTS min_y double precision,
        ADD COLUMN IF NOT EXISTS max_x double precision,
        ADD COLUMN IF NOT EXISTS max_y double precision;

      CREATE INDEX IF NOT EXISTS guestbook_items_updated_at_idx
        ON guestbook_items (updated_at DESC);

      CREATE INDEX IF NOT EXISTS guestbook_items_client_id_idx
        ON guestbook_items (client_id);

      -- Core Postgres geometry, no PostGIS. GiST over the rectangle answers
      -- "what is inside this window" without reading the whole board.
      CREATE INDEX IF NOT EXISTS guestbook_items_bounds_idx
        ON guestbook_items USING gist (box(point(min_x, min_y), point(max_x, max_y)));
    `)
    .then(backfillBounds)
    .catch((error) => {
      // Let a later request retry after a transient Neon wake-up or network
      // failure instead of caching one rejected promise for this process.
      schemaReady = undefined
      throw error
    })
  return schemaReady
}

/**
 * Measure marks written before there was anywhere to record their size.
 *
 * Runs once, on the first request after deploying this, and finds nothing on
 * every start after that. Reading in batches keeps one oversized page of
 * base64 images out of memory; src and thumb are dropped on the way out
 * because nothing here needs to look at the picture.
 */
async function backfillBounds() {
  const { guestbookItemBounds } = await import('./guestbook-geometry.js')
  let measured = 0

  for (;;) {
    const pending = await database().query(
      `SELECT id, kind, x, y, payload - 'src' - 'thumb' AS payload
         FROM guestbook_items
        WHERE min_x IS NULL
        LIMIT 500`,
    )
    if (!pending.rowCount) break

    for (const row of pending.rows) {
      const bounds = guestbookItemBounds({ ...row.payload, kind: row.kind, x: row.x, y: row.y })
      await database().query(
        'UPDATE guestbook_items SET min_x = $2, min_y = $3, max_x = $4, max_y = $5 WHERE id = $1',
        [row.id, bounds.minX, bounds.minY, bounds.maxX, bounds.maxY],
      )
    }
    measured += pending.rowCount
    if (pending.rowCount < 500) break
  }

  if (measured) log(`Measured ${measured} guestbook marks for the spatial index.`, 'FgGreen')
}
