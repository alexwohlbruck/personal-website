import assert from 'node:assert/strict'
import { afterEach, describe, it } from 'node:test'
import { resolveIpLocation } from '../src/lib/ip-location.js'

const originalFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = originalFetch
})

describe('guestbook IP location', () => {
  it('does not send loopback or private addresses to the resolver', async () => {
    let called = false
    globalThis.fetch = async () => {
      called = true
      throw new Error('should not fetch')
    }

    assert.equal(await resolveIpLocation('127.0.0.1'), null)
    assert.equal(await resolveIpLocation('::1'), null)
    assert.equal(await resolveIpLocation('192.168.1.2'), null)
    assert.equal(called, false)
  })

  it('keeps the city and ISO country code from a public-IP lookup', async () => {
    globalThis.fetch = async (url) => {
      assert.match(String(url), /^https:\/\/ipwho\.is\/8\.8\.4\.4/)
      return new Response(JSON.stringify({ success: true, country_code: 'US', city: 'Mountain View' }))
    }

    assert.deepEqual(await resolveIpLocation('::ffff:8.8.4.4'), {
      country: 'US',
      city: 'Mountain View',
    })
  })
})
