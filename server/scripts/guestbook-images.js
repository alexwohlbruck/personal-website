import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { database } from '../src/lib/database.js'
import { log } from '../src/util.js'

/**
 * Tidy up the images already on the board.
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

const THUMB_LONGEST = 96
/** Anything past this was almost certainly written by a browser that could not
 *  encode webp and quietly handed back a PNG instead. */
const RECOMPRESS_OVER = 60_000

const rows = await database().query(
  `SELECT id, payload->>'src' AS src, payload ? 'thumb' AS has_thumb
     FROM guestbook_items
    WHERE kind = 'image'`,
)

let thumbed = 0
let shrunk = 0
let saved = 0

for (const row of rows.rows) {
  const [, mime, encoded] = /^data:(image\/(?:png|jpeg|webp));base64,(.+)$/is.exec(row.src ?? '') ?? []
  if (!encoded) {
    log(`  ${row.id}: no readable image, skipped`, 'FgYellow')
    continue
  }
  const original = Buffer.from(encoded, 'base64')

  try {
    if (!row.has_thumb) {
      const thumb = await sharp(original)
        .resize(THUMB_LONGEST, THUMB_LONGEST, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 50 })
        .toBuffer()
      await database().query(
        "UPDATE guestbook_items SET payload = payload || jsonb_build_object('thumb', $2::text) WHERE id = $1",
        [row.id, `data:image/webp;base64,${thumb.toString('base64')}`],
      )
      thumbed += 1
    }

    // A PNG of a photograph is many times the size of the same picture as
    // webp, and the browser gave us no say in it. Redo it here.
    if (mime !== 'image/webp' && original.length > RECOMPRESS_OVER) {
      const better = await sharp(original).webp({ quality: 80 }).toBuffer()
      if (better.length < original.length) {
        await database().query(
          "UPDATE guestbook_items SET payload = payload || jsonb_build_object('src', $2::text) WHERE id = $1",
          [row.id, `data:image/webp;base64,${better.toString('base64')}`],
        )
        shrunk += 1
        saved += original.length - better.length
        const kb = (bytes) => `${Math.round(bytes / 1024)} kB`
        log(`  ${row.id}: ${mime} ${kb(original.length)} → webp ${kb(better.length)}`, 'FgGray')
      }
    }
  } catch (error) {
    log(`  ${row.id}: ${error.message}`, 'FgRed')
  }
}

log(
  `Done. ${thumbed} thumbnail${thumbed === 1 ? '' : 's'} built, ${shrunk} image${shrunk === 1 ? '' : 's'} recompressed, ${Math.round(saved / 1024)} kB saved.`,
  'FgGreen',
)
process.exit(0)
