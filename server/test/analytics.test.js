import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { parseVisitorCount } from '../src/apis/analytics.js'

describe('Google Analytics session count', () => {
  it('reads the sessions metric from a report', () => {
    assert.equal(parseVisitorCount({ rows: [{ metricValues: [{ value: '1234' }] }] }), 1234)
  })

  it('treats an empty or malformed report as zero visitors', () => {
    assert.equal(parseVisitorCount({}), 0)
    assert.equal(parseVisitorCount({ rows: [{ metricValues: [{ value: 'nope' }] }] }), 0)
  })
})
