import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { clusterChangesets, mergeChangesets, shapeStats, tallyThemes } from '../src/apis/osm.js'

const changeset = (overrides = {}) => ({
  id: 10,
  created_at: '2026-08-12T12:00:00Z',
  changes_count: 4,
  min_lat: 40.67,
  min_lon: -73.97,
  max_lat: 40.68,
  max_lon: -73.96,
  tags: { comment: 'Add bike parking near a coffee shop' },
  ...overrides,
})

describe('OpenStreetMap stats', () => {
  it('groups nearby changesets and keeps distant cities separate', () => {
    const clusters = clusterChangesets([
      changeset(),
      changeset({ min_lat: 40.72, max_lat: 40.73 }),
      changeset({ min_lat: 35.21, max_lat: 35.22, min_lon: -80.85, max_lon: -80.84 }),
    ])

    assert.deepEqual(
      clusters.map((cluster) => cluster.count),
      [2, 1],
    )
  })

  it('infers broad themes once per changeset', () => {
    const themes = tallyThemes([
      changeset(),
      changeset({ tags: { comment: 'Update bicycle racks and cycling parking' } }),
      changeset({ tags: { comment: 'Trace apartment buildings' } }),
    ])

    assert.deepEqual(themes.slice(0, 3), [
      { name: 'Cycling', count: 2 },
      { name: 'Parking', count: 2 },
      { name: 'Buildings', count: 1 },
    ])
  })

  it('shapes the public payload and omits unnamed places', () => {
    const result = shapeStats(
      { account_created: '2020-12-22T02:11:44Z', changesets: { count: 4034 } },
      [changeset()],
      [
        { label: 'Brooklyn, New York', count: 9, lat: 40.68, lon: -73.96 },
        { label: null, count: 1, lat: 0, lon: 0 },
      ],
    )

    assert.equal(result.changesets, 4034)
    assert.equal(result.mappedObjects, 4)
    assert.equal(result.isLifetime, false)
    assert.equal(result.places.length, 1)
    assert.deepEqual(result.recent[0], {
      id: 10,
      comment: 'Add bike parking near a coffee shop',
      changes: 4,
      createdAt: '2026-08-12T12:00:00Z',
      url: 'https://www.openstreetmap.org/changeset/10',
    })
  })

  it('overlays live changesets on the lifetime archive without duplicates', () => {
    const archived = [
      changeset({ id: 1, created_at: '2026-08-10T12:00:00Z' }),
      changeset({ id: 2, created_at: '2026-08-11T12:00:00Z' }),
    ]
    const latest = [
      changeset({ id: 2, created_at: '2026-08-11T12:00:00Z', changes_count: 8 }),
      changeset({ id: 3, created_at: '2026-08-12T12:00:00Z' }),
    ]

    const result = mergeChangesets(latest, archived)

    assert.deepEqual(
      result.map((item) => item.id),
      [3, 2, 1],
    )
    assert.equal(result[1].changes_count, 8)
  })
})
