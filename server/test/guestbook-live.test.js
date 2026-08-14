import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { publishGuestbook, subscribeToGuestbook } from '../src/lib/guestbook-live.js'

/** Listeners are handed a finished frame, so read it back to see the change. */
function listen() {
  const frames = []
  const unsubscribe = subscribeToGuestbook((frame) => frames.push(frame))
  return { frames, unsubscribe, changes: () => frames.map((frame) => JSON.parse(frame)) }
}

describe('guestbook realtime', () => {
  it('broadcasts mutations and detaches closed streams', () => {
    const stream = listen()
    publishGuestbook({ action: 'delete', id: 'one' })
    stream.unsubscribe()
    publishGuestbook({ action: 'delete', id: 'two' })
    assert.deepEqual(stream.changes(), [{ action: 'delete', id: 'one' }])
  })

  it('serialises once, however many people are watching', () => {
    const streams = [listen(), listen(), listen()]
    publishGuestbook({ action: 'delete', id: 'shared' })
    const [first] = streams[0].frames
    // The same string object reaches everybody, which is the point.
    for (const stream of streams) assert.equal(stream.frames[0], first)
    streams.forEach((stream) => stream.unsubscribe())
  })

  it('leaves the upload out but keeps the thumbnail', () => {
    const stream = listen()
    publishGuestbook({
      action: 'upsert',
      item: { id: 'a', kind: 'image', src: 'data:image/webp;base64,' + 'x'.repeat(500_000), thumb: 'data:image/webp;base64,small', width: 100 },
    })
    stream.unsubscribe()

    const [change] = stream.changes()
    assert.equal(change.item.src, undefined)
    assert.equal(change.item.thumb, 'data:image/webp;base64,small')
    assert.equal(change.item.hasUpload, true)
    assert.ok(stream.frames[0].length < 1_000, `frame was ${stream.frames[0].length} bytes`)
  })

  it('passes marks that carry no upload straight through', () => {
    const stream = listen()
    const item = { id: 'b', kind: 'text', text: 'hello', width: 10 }
    publishGuestbook({ action: 'upsert', item })
    stream.unsubscribe()
    assert.deepEqual(stream.changes(), [{ action: 'upsert', item }])
  })

  it('does nothing at all when nobody is listening', () => {
    assert.doesNotThrow(() => publishGuestbook({ action: 'delete', id: 'nobody' }))
  })
})
