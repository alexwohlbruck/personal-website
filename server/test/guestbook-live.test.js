import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { publishGuestbook, subscribeToGuestbook } from '../src/lib/guestbook-live.js'

describe('guestbook realtime', () => {
  it('broadcasts mutations and detaches closed streams', () => {
    const received = []
    const unsubscribe = subscribeToGuestbook((change) => received.push(change))
    publishGuestbook({ action: 'delete', id: 'one' })
    unsubscribe()
    publishGuestbook({ action: 'delete', id: 'two' })
    assert.deepEqual(received, [{ action: 'delete', id: 'one' }])
  })
})
