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

      CREATE INDEX IF NOT EXISTS guestbook_items_updated_at_idx
        ON guestbook_items (updated_at DESC);

      CREATE INDEX IF NOT EXISTS guestbook_items_client_id_idx
        ON guestbook_items (client_id);

      CREATE TABLE IF NOT EXISTS guestbook_visitors (
        client_id uuid PRIMARY KEY,
        first_seen_at timestamptz NOT NULL DEFAULT now()
      );
    `)
    .catch((error) => {
      // Let a later request retry after a transient Neon wake-up or network
      // failure instead of caching one rejected promise for this process.
      schemaReady = undefined
      throw error
    })
  return schemaReady
}
