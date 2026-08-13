/**
 * The year-of-squares calendar, shared by the GitHub and OpenStreetMap panels.
 *
 * Both sections draw the same thing from different sources: GitHub hands over a
 * calendar already bucketed into quartiles, while OpenStreetMap hands over a few
 * thousand changeset timestamps and leaves the counting here. Everything below
 * works in UTC on plain `YYYY-MM-DD` days, because a calendar square belongs to
 * a date rather than to a moment, and reading one as local time moves every
 * square a row for half the planet.
 */

const DAY = 24 * 60 * 60 * 1000
const SPAN = 365

/** The calendar day a timestamp falls on, in UTC. */
export function isoDay(value) {
  return new Date(value).toISOString().slice(0, 10)
}

function midnight(day) {
  return Date.parse(`${day}T00:00:00Z`)
}

/**
 * Four intensities over the days that had something on them.
 *
 * Quartiles rather than fractions of the maximum: one 300-changeset import day
 * would otherwise flatten a year of ordinary editing into the palest shade.
 */
export function withLevels(days) {
  const counts = days
    .filter((day) => day.count > 0)
    .map((day) => day.count)
    .sort((a, b) => a - b)

  if (!counts.length) return days.map((day) => ({ ...day, level: 0 }))

  const at = (fraction) => counts[Math.min(counts.length - 1, Math.floor(counts.length * fraction))]
  const thresholds = [at(0.25), at(0.5), at(0.75)]

  return days.map((day) => ({
    ...day,
    level: day.count === 0 ? 0 : 1 + thresholds.filter((threshold) => day.count > threshold).length,
  }))
}

/**
 * A day per square across the trailing year, counted from timestamps.
 *
 * Days with nothing on them still get a square: the gaps are half of what the
 * graph says.
 */
export function tallyDays(timestamps, end = new Date(), span = SPAN) {
  const last = midnight(isoDay(end))
  const first = last - (span - 1) * DAY

  const counts = new Map()
  for (const timestamp of timestamps) {
    const day = isoDay(timestamp)
    const time = midnight(day)
    if (!(time >= first && time <= last)) continue
    counts.set(day, (counts.get(day) ?? 0) + 1)
  }

  const days = []
  for (let time = first; time <= last; time += DAY) {
    const day = isoDay(time)
    days.push({ date: day, count: counts.get(day) ?? 0, level: 0 })
  }

  return withLevels(days)
}

/**
 * Days into calendar columns, Sunday at the top of each.
 *
 * The window rarely begins on a Sunday, so the first and last columns are
 * padded with nulls rather than being drawn short.
 */
export function toWeeks(days) {
  const weeks = []
  let week = null

  for (const day of days) {
    const row = new Date(`${day.date}T00:00:00Z`).getUTCDay()
    if (!week || row === 0) {
      week = Array(7).fill(null)
      weeks.push(week)
    }
    week[row] = day
  }

  return weeks
}

/**
 * Consecutive days with something on them, plus the single busiest.
 *
 * The final square is a day still in progress, so an empty one has not broken
 * anything yet and the current run is counted from the day before it.
 */
export function streaks(days) {
  let longest = 0
  let running = 0
  let busiest = null

  for (const day of days) {
    running = day.count > 0 ? running + 1 : 0
    longest = Math.max(longest, running)
    if (!busiest || day.count > busiest.count) busiest = day
  }

  let current = 0
  const from = days.at(-1)?.count ? days.length - 1 : days.length - 2
  for (let i = from; i >= 0 && days[i]?.count > 0; i -= 1) current += 1

  return { current, longest, busiest: busiest?.count ? busiest : null }
}

/** Everything a panel needs to draw and caption one calendar. */
export function shapeCalendar(days) {
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date))
  const { current, longest, busiest } = streaks(sorted)

  return {
    total: sorted.reduce((total, day) => total + day.count, 0),
    from: sorted[0]?.date ?? null,
    to: sorted.at(-1)?.date ?? null,
    activeDays: sorted.filter((day) => day.count > 0).length,
    weeks: toWeeks(sorted),
    currentStreak: current,
    longestStreak: longest,
    busiestDay: busiest,
  }
}
