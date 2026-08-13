import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { guestbookClientId, sanitizeGuestbookItem } from '../src/routes/guestbook.js'

const base = {
  id: '12af58b8-6ddc-4fe1-b07a-9d14f60b49dd',
  x: 12,
  y: -34,
  rotation: 0,
}

describe('guestbook validation', () => {
  it('accepts only UUID session ownership headers', () => {
    assert.equal(guestbookClientId({ get: () => base.id }), base.id)
    assert.equal(guestbookClientId({ get: () => undefined }, false), null)
    assert.throws(
      () => guestbookClientId({ get: () => 'not-a-session' }),
      /session is no longer valid/,
    )
  })

  it('keeps only supported text properties', () => {
    assert.deepEqual(
      sanitizeGuestbookItem({
        ...base,
        kind: 'text',
        text: '  hello  ',
        font: 'display',
        color: '#9a3412',
        size: 36,
        bold: true,
        italic: false,
        width: 240,
        height: 80,
        unexpected: 'nope',
      }),
      {
        ...base,
        kind: 'text',
        text: 'hello',
        font: 'display',
        color: '#9a3412',
        size: 36,
        bold: true,
        italic: false,
        width: 240,
        height: 80,
      },
    )
  })

  it('keeps supported sticky-note text styles', () => {
    assert.deepEqual(
      sanitizeGuestbookItem({
        ...base,
        kind: 'sticky',
        text: '  hello note  ',
        color: 'lavender',
        textColor: '#432d20',
        font: 'handwritten',
        size: 22,
        bold: true,
        italic: true,
        width: 180,
        height: 150,
      }),
      {
        ...base,
        kind: 'sticky',
        text: 'hello note',
        color: 'lavender',
        textColor: '#432d20',
        font: 'handwritten',
        size: 22,
        bold: true,
        italic: true,
        width: 180,
        height: 150,
      },
    )
  })

  it('rejects oversized drawings', () => {
    assert.throws(
      () =>
        sanitizeGuestbookItem({
          ...base,
          kind: 'drawing',
          points: Array.from({ length: 1201 }, () => [0, 0]),
          color: '#000000',
          width: 4,
        }),
      /1,200 points/,
    )
  })

  it('normalizes drawing rotation and validates element rotation', () => {
    const drawing = sanitizeGuestbookItem({
      ...base,
      kind: 'drawing',
      rotation: 90,
      points: [[0, 0], [10, 10]],
      color: '#000000',
      width: 4,
    })
    assert.equal(drawing.rotation, 0)
    assert.throws(
      () => sanitizeGuestbookItem({
        ...base,
        kind: 'emoji',
        rotation: 181,
        emoji: '👋',
        size: 64,
      }),
      /rotation/,
    )
  })

  it('rejects scripts and oversized data URLs as images', () => {
    assert.throws(
      () =>
        sanitizeGuestbookItem({
          ...base,
          kind: 'image',
          src: 'data:image/svg+xml,<svg onload="alert(1)"/>',
          width: 100,
          height: 100,
        }),
      /Invalid or oversized image/,
    )
  })
})
