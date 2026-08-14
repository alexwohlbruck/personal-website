import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { database } from '../src/lib/database.js'
import { log } from '../src/util.js'

/**
 * Give older image marks the thumbnail newer ones are uploaded with.
 *
 * The browser makes these at upload time, so this only exists for the handful
 * that predate that. It is safe to run again: rows that already have one are
 * skipped, and nothing here touches the original upload.
 *
 * sharp is borrowed from the client, which already builds image renditions
 * with it. Adding a thirty megabyte native dependency to the server for a
 * script that runs approximately once is a poor trade.
 */

const here = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(path.join(here, '../../client/package.json'))

let sharp
try {
  sharp = require('sharp')
} catch {
  log('sharp is not installed. Run `npm install` in ../client first.', 'FgRed')
  process.exit(1)
}

const LONGEST = 96

const rows = await database().query(
  `SELECT id, payload->>'src' AS src
     FROM guestbook_items
    WHERE kind = 'image' AND NOT payload ? 'thumb'`,
)

if (!rows.rowCount) {
  log('Every image already has a thumbnail.', 'FgGreen')
  process.exit(0)
}

log(`Building ${rows.rowCount} thumbnail${rows.rowCount === 1 ? '' : 's'}…`)

let built = 0
for (const row of rows.rows) {
  const [, encoded] = /^data:image\/(?:png|jpeg|webp);base64,(.+)$/is.exec(row.src ?? '') ?? []
  if (!encoded) {
    log(`  ${row.id}: no readable image, skipped`, 'FgYellow')
    continue
  }

  try {
    const thumb = await sharp(Buffer.from(encoded, 'base64'))
      .resize(LONGEST, LONGEST, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 50 })
      .toBuffer()

    await database().query(
      `UPDATE guestbook_items
          SET payload = payload || jsonb_build_object('thumb', $2::text)
        WHERE id = $1`,
      [row.id, `data:image/webp;base64,${thumb.toString('base64')}`],
    )
    built += 1
    log(`  ${row.id}: ${Math.round(thumb.length / 1024)} kB`, 'FgGray')
  } catch (error) {
    log(`  ${row.id}: ${error.message}`, 'FgRed')
  }
}

log(`Done. ${built} of ${rows.rowCount} rebuilt.`, 'FgGreen')
process.exit(0)
