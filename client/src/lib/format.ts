const MS_PER_DAY = 1000 * 60 * 60 * 24

export function isToday(date: Date): boolean {
  const today = new Date()
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  )
}

export function year(date: Date): string {
  return isToday(date) ? 'Now' : String(date.getFullYear())
}

export function monthShort(date: Date): string {
  return date.toLocaleString('en-US', { month: 'short' })
}

export function monthYear(date: Date): string {
  return isToday(date) ? 'Now' : date.toLocaleString('en-US', { month: 'short', year: 'numeric' })
}

/**
 * "2020–2022", or "Jul–Dec 2023" for spans inside one year. Anything still
 * running, or with no recorded end, shows the year it began and stops there.
 */
export function dateRange(start: Date, end?: Date): string {
  if (!end) return String(start.getFullYear())
  if (isToday(end)) return String(start.getFullYear())
  if (start.getFullYear() === end.getFullYear()) {
    return `${monthShort(start)}–${monthShort(end)} ${end.getFullYear()}`
  }
  return `${start.getFullYear()}–${end.getFullYear()}`
}

/** Rough, human duration: "3 mos", "1 yr 4 mos". */
export function duration(start: Date, end?: Date): string {
  const finish = end ?? new Date()
  const months = Math.max(1, Math.round((finish.getTime() - start.getTime()) / MS_PER_DAY / 30.44))
  const years = Math.floor(months / 12)
  const remainder = months % 12
  if (years === 0) return `${months} mo${months === 1 ? '' : 's'}`
  if (remainder === 0) return `${years} yr${years === 1 ? '' : 's'}`
  return `${years} yr${years === 1 ? '' : 's'} ${remainder} mo${remainder === 1 ? '' : 's'}`
}

export function relativeTime(input: number | string | Date): string {
  const date = new Date(input)
  const seconds = Math.round((Date.now() - date.getTime()) / 1000)
  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

  const thresholds: [Intl.RelativeTimeFormatUnit, number][] = [
    ['second', 60],
    ['minute', 60],
    ['hour', 24],
    ['day', 7],
    ['week', 4.35],
    ['month', 12],
  ]

  let value = seconds
  for (const [unit, step] of thresholds) {
    if (Math.abs(value) < step) return formatter.format(-Math.round(value), unit)
    value /= step
  }
  return formatter.format(-Math.round(value), 'year')
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

/** Two-digit index for the numbered lists: 1 → "01". */
export function ordinal(index: number): string {
  return String(index + 1).padStart(2, '0')
}

export function timezoneLabel(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}
