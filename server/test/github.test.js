import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  parseContributionCalendar,
  shapeEvents,
  shapeStats,
  topLanguages,
} from '../src/apis/github.js'

/** Days ending on a known Saturday, so the row each one lands in is checkable. */
const calendar = (counts, start = '2026-08-02') =>
  counts.map((count, index) => {
    const date = new Date(`${start}T00:00:00Z`)
    date.setUTCDate(date.getUTCDate() + index)
    return { date: date.toISOString().slice(0, 10), count, level: Math.min(4, count) }
  })

describe('GitHub contributions', () => {
  it('reads dates, levels and counts out of the public calendar fragment', () => {
    const html = `
      <table><tbody><tr>
        <td data-date="2026-08-02" id="day-0" data-level="0" class="ContributionCalendar-day"></td>
        <td data-date="2026-08-03" id="day-1" data-level="4" class="ContributionCalendar-day"></td>
        <td data-date="2026-08-04" id="day-2" data-level="2" class="ContributionCalendar-day"></td>
      </tr></tbody></table>
      <tool-tip for="day-0" class="sr-only">No contributions on August 2nd.</tool-tip>
      <tool-tip for="day-1" class="sr-only">1,204 contributions on August 3rd.</tool-tip>
    `

    assert.deepEqual(parseContributionCalendar(html), [
      { date: '2026-08-02', count: 0, level: 0 },
      { date: '2026-08-03', count: 1204, level: 4 },
      // No tooltip, but a shaded square happened at least once.
      { date: '2026-08-04', count: 1, level: 2 },
    ])
  })

  it('refuses a page it could find no calendar in', () => {
    assert.throws(() => parseContributionCalendar('<html>Not Found</html>'), /calendar/)
  })

  it('ranks languages by repository and breaks ties by name', () => {
    const languages = topLanguages([
      { language: 'Vue' },
      { language: 'TypeScript' },
      { language: 'Vue' },
      { language: 'Dart' },
      { language: null },
    ])

    assert.deepEqual(languages, [
      { name: 'Vue', count: 2 },
      { name: 'Dart', count: 1 },
      { name: 'TypeScript', count: 1 },
    ])
  })

  it('keeps pushes out of the activity feed and drops the rest', () => {
    const pushes = shapeEvents([
      { id: 1, type: 'WatchEvent', repo: { name: 'a/b' }, payload: {} },
      {
        id: 2,
        type: 'PushEvent',
        created_at: '2026-08-12T12:00:00Z',
        repo: { name: 'alexwohlbruck/personal-website' },
        payload: {
          size: 3,
          ref: 'refs/heads/dev',
          head: 'abc123',
          commits: [{ sha: 'zzz', message: 'One' }, { sha: 'yyy', message: 'Two\n\nBody text' }],
        },
      },
      { id: 3, type: 'PushEvent', repo: { name: 'a/b' }, payload: {} },
      // The same commit, pushed a second time to another branch.
      {
        id: 5,
        type: 'PushEvent',
        created_at: '2026-08-12T12:01:00Z',
        repo: { name: 'alexwohlbruck/personal-website' },
        payload: { ref: 'refs/heads/main', head: 'abc123' },
      },
    ])

    assert.deepEqual(pushes, [
      {
        id: '2',
        source: 'alexwohlbruck/personal-website',
        repo: 'personal-website',
        sha: 'abc123',
        branch: 'dev',
        message: 'Two',
        commits: 3,
        createdAt: '2026-08-12T12:00:00Z',
      },
    ])
  })

  it('keeps a push the anonymous feed stripped down to a head SHA', () => {
    // No commits array and no size, which is all an unauthenticated caller
    // gets. The message is fetched separately; the count is never invented.
    const [push] = shapeEvents([
      {
        id: 4,
        type: 'PushEvent',
        created_at: '2026-08-13T16:53:13Z',
        repo: { name: 'alexwohlbruck/personal-website' },
        payload: { ref: 'refs/heads/main', head: 'b1351ab' },
      },
    ])

    assert.equal(push.sha, 'b1351ab')
    assert.equal(push.message, null)
    assert.equal(push.commits, null)
    assert.equal(push.branch, 'main')
  })

  it('shapes the public payload from days in any order', () => {
    const days = calendar([2, 0, 5])
    const result = shapeStats(
      { login: 'alexwohlbruck', memberSince: '2019-02-10T00:00:00Z', followers: 12, repos: 40 },
      [...days].reverse(),
      [{ language: 'Vue', stars: 3 }, { language: 'Vue', stars: 0 }],
      [],
    )

    assert.equal(result.profile, 'https://github.com/alexwohlbruck')
    assert.equal(result.stars, 3)
    assert.equal(result.repos, 40)
    assert.equal(result.calendar.total, 7)
    assert.equal(result.calendar.from, '2026-08-02')
    assert.equal(result.calendar.to, '2026-08-04')
    assert.deepEqual(result.languages, [{ name: 'Vue', count: 2 }])
    assert.deepEqual(result.recent, [])
  })
})
