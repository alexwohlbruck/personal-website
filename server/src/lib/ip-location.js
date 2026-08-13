const locations = new Map()
const MAX_CACHE = 2_000

function publicIp(value) {
  const ip = String(value ?? '').replace(/^::ffff:/, '')
  const second = Number(ip.split('.')[1])
  if (
    !ip ||
    ip === '::1' ||
    ip.startsWith('127.') ||
    ip.startsWith('10.') ||
    ip.startsWith('192.168.') ||
    (ip.startsWith('172.') && second >= 16 && second <= 31) ||
    /^(fc|fd|fe8|fe9|fea|feb)/i.test(ip)
  ) return null
  return ip
}

export async function resolveIpLocation(value) {
  const ip = publicIp(value)
  if (!ip) return null
  if (locations.has(ip)) return locations.get(ip)

  try {
    const url = new URL(`https://ipwho.is/${encodeURIComponent(ip)}`)
    url.searchParams.set('fields', 'success,country_code,city')
    const response = await fetch(url, { signal: AbortSignal.timeout(2_500) })
    if (!response.ok) return null
    const result = await response.json()
    if (result.success === false) return null
    const country = typeof result.country_code === 'string' && /^[A-Z]{2}$/.test(result.country_code)
      ? result.country_code
      : null
    if (!country) return null
    const location = {
      country,
      city: typeof result.city === 'string' ? result.city.trim().slice(0, 80) || null : null,
    }
    if (locations.size >= MAX_CACHE) locations.delete(locations.keys().next().value)
    locations.set(ip, location)
    return location
  } catch {
    // Location is decorative. A resolver outage must never block a drawing.
    return null
  }
}
