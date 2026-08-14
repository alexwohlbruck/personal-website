import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { guestbookItemBounds } from '../src/lib/guestbook-geometry.js'
import { readRegion } from '../src/routes/guestbook.js'

describe('guestbook item bounds', () => {
  it('measures a note from its corner', () => {
    assert.deepEqual(
      guestbookItemBounds({ kind: 'sticky', x: 10, y: 20, width: 100, height: 50, rotation: 0 }),
      { minX: 10, minY: 20, maxX: 110, maxY: 70 },
    )
  })

  it('measures an emoji from its middle', () => {
    assert.deepEqual(
      guestbookItemBounds({ kind: 'emoji', x: 0, y: 0, size: 64, rotation: 0 }),
      { minX: -32, minY: -32, maxX: 32, maxY: 32 },
    )
  })

  it('wraps a stroke around its points, allowing for its width', () => {
    assert.deepEqual(
      guestbookItemBounds({
        kind: 'drawing',
        x: 0,
        y: 0,
        width: 10,
        rotation: 0,
        points: [[0, 0], [100, 40], [-20, 90]],
      }),
      { minX: -25, minY: -5, maxX: 105, maxY: 95 },
    )
  })

  it('gives a rotated mark the room it turns through', () => {
    const upright = guestbookItemBounds({ kind: 'image', x: 0, y: 0, width: 100, height: 100, rotation: 0 })
    const turned = guestbookItemBounds({ kind: 'image', x: 0, y: 0, width: 100, height: 100, rotation: 45 })
    assert.ok(turned.minX < upright.minX && turned.maxX > upright.maxX)
    // The circle the square cannot leave: half its diagonal from the centre.
    assert.ok(Math.abs(turned.maxX - (50 + Math.hypot(100, 100) / 2)) < 1e-9)
  })

  it('survives a stroke with no points', () => {
    const box = guestbookItemBounds({ kind: 'drawing', x: 5, y: 6, width: 4, points: [], rotation: 0 })
    assert.deepEqual(box, { minX: 5, minY: 6, maxX: 5, maxY: 6 })
  })
})

describe('region parsing', () => {
  it('reads a window', () => {
    assert.deepEqual(
      readRegion({ left: '-100', top: '-50', right: '100', bottom: '50' }),
      { left: -100, top: -50, right: 100, bottom: 50 },
    )
  })

  it('accepts corners given in either order', () => {
    assert.deepEqual(
      readRegion({ left: '100', top: '50', right: '-100', bottom: '-50' }),
      { left: -100, top: -50, right: 100, bottom: 50 },
    )
  })

  it('reads a window sitting on the origin', () => {
    assert.deepEqual(
      readRegion({ left: '0', top: '0', right: '0', bottom: '0' }),
      { left: 0, top: 0, right: 0, bottom: 0 },
    )
  })

  it('means most recent when no window is given', () => {
    assert.equal(readRegion({}), null)
    assert.equal(readRegion({ limit: '10' }), null)
  })

  it('refuses half a window', () => {
    assert.throws(() => readRegion({ left: '0', top: '0' }), /needs left, top, right and bottom/)
  })

  it('refuses values that are not finite numbers', () => {
    for (const bad of ['abc', 'NaN', 'Infinity', '1e400', ['1', '2']]) {
      assert.throws(
        () => readRegion({ left: bad, top: '0', right: '10', bottom: '10' }),
        /region needs/,
        `accepted ${JSON.stringify(bad)}`,
      )
    }
  })
})
