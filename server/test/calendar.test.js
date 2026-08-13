import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { shapeCalendar, streaks, tallyDays, toWeeks, withLevels } from '../src/lib/calendar.js'

/** Days ending on a known Tuesday, so the row each one lands in is checkable. */
const calendar = (counts, start = '2026-08-02') =>
  counts.map((count, index) => {
    const date = new Date(`${start}T00:00:00Z`)
    date.setUTCDate(date.getUTCDate() + index)
    return { date: date.toISOString().slice(0, 10), count, level: Math.min(4, count) }
  })

describe('Contribution calendar', () => {
  it('pads the first column so every square lands on its own weekday', () => {
    // Starts on a Wednesday, so the first column has three empty days above it.
    const weeks = toWeeks(calendar([1, 2, 3, 4, 5], '2026-08-05'))

    assert.equal(weeks.length, 2)
    assert.deepEqual(weeks[0].slice(0, 3), [null, null, null])
    assert.equal(weeks[0][3].date, '2026-08-05')
    assert.equal(weeks[0][6].date, '2026-08-08')
    assert.equal(weeks[1][0].date, '2026-08-09')
    assert.deepEqual(weeks[1].slice(2), [null, null, null, null, null])
  })

  it('counts the current run back past a day that has not happened yet', () => {
    assert.deepEqual(streaks(calendar([1, 0, 2, 3, 4, 0])), {
      current: 3,
      longest: 3,
      busiest: { date: '2026-08-06', count: 4, level: 4 },
    })
  })

  it('counts today when today already has something on it', () => {
    const result = streaks(calendar([0, 1, 1]))
    assert.equal(result.current, 2)
    assert.equal(result.longest, 2)
  })

  it('has no busiest day before the first contribution', () => {
    assert.deepEqual(streaks(calendar([0, 0, 0])), { current: 0, longest: 0, busiest: null })
  })

  it('buckets by quartile, so one huge day does not flatten the year', () => {
    const levels = withLevels(calendar([0, 1, 2, 3, 4, 900])).map((day) => day.level)

    // Shaded against the maximum instead, every one of these ordinary days
    // would be under 1% of 900 and the year would read as empty.
    assert.deepEqual(levels, [0, 1, 1, 2, 3, 4])
  })

  it('leaves a year with nothing in it at level zero', () => {
    assert.deepEqual(
      withLevels(calendar([0, 0])).map((day) => day.level),
      [0, 0],
    )
  })

  it('counts timestamps into one square a day and keeps the empty ones', () => {
    const days = tallyDays(
      [
        '2026-08-13T09:00:00Z',
        '2026-08-13T22:30:00Z',
        '2026-08-11T12:00:00Z',
        // Outside the window, and so not counted.
        '2019-01-01T12:00:00Z',
      ],
      new Date('2026-08-13T18:00:00Z'),
      5,
    )

    assert.deepEqual(days, [
      { date: '2026-08-09', count: 0, level: 0 },
      { date: '2026-08-10', count: 0, level: 0 },
      { date: '2026-08-11', count: 1, level: 1 },
      { date: '2026-08-12', count: 0, level: 0 },
      { date: '2026-08-13', count: 2, level: 2 },
    ])
  })

  it('buckets a late-evening edit into the UTC day it happened on', () => {
    const [day] = tallyDays(['2026-08-13T23:45:00Z'], new Date('2026-08-13T23:59:00Z'), 1)
    assert.equal(day.date, '2026-08-13')
    assert.equal(day.count, 1)
  })

  it('shapes a calendar from days in any order', () => {
    const days = calendar([2, 0, 5])
    const result = shapeCalendar([...days].reverse())

    assert.equal(result.total, 7)
    assert.equal(result.from, '2026-08-02')
    assert.equal(result.to, '2026-08-04')
    assert.equal(result.activeDays, 2)
    assert.equal(result.currentStreak, 1)
    assert.equal(result.longestStreak, 1)
    assert.equal(result.busiestDay.date, '2026-08-04')
    assert.equal(result.weeks[0][0].date, '2026-08-02')
  })
})
