import { readFileSync } from 'node:fs'
import { cached } from '../lib/cache.js'
import { ApiError, fetchJson } from '../util.js'

const API = 'https://api.openstreetmap.org/api/0.6'
const NOMINATIM = 'https://nominatim.openstreetmap.org/reverse'
const USER_ID = 12370548
const PROFILE = 'https://www.openstreetmap.org/user/alexwohlbruck'
const USER_AGENT = 'alex.wohlbruck.com/2.0 (+https://alex.wohlbruck.com)'
const HEADERS = { Accept: 'application/json', 'User-Agent': USER_AGENT }

const SNAPSHOT = JSON.parse(
  readFileSync(new URL('../data/osm-lifetime.generated.json', import.meta.url), 'utf8'),
)
const PAGE_LIMIT = 100
const PLACE_LIMIT = 5
let lifetimeChangesets = SNAPSHOT.changesets

const THEMES = [
  { name: 'Cycling', words: ['bike', 'bicycle', 'cycle', 'cycling', 'rack'] },
  { name: 'Businesses', words: ['business', 'cafe', 'coffee', 'restaurant', 'shop', 'store'] },
  { name: 'Buildings', words: ['apartment', 'building', 'construction'] },
  { name: 'Parking', words: ['garage', 'parking'] },
  { name: 'Streets', words: ['crossing', 'highway', 'lane', 'road', 'sidewalk', 'street'] },
  { name: 'Transit', words: ['bus', 'rail', 'station', 'subway', 'transit'] },
  { name: 'Nature', words: ['garden', 'natural', 'park', 'tree', 'water', 'wood'] },
]

function radians(value) {
  return (value * Math.PI) / 180
}

/** Great-circle distance in kilometres. Accurate enough for grouping nearby
 * changesets into a city-sized focus area. */
function distance(a, b) {
  const earth = 6371
  const dLat = radians(b.lat - a.lat)
  const dLon = radians(b.lon - a.lon)
  const lat1 = radians(a.lat)
  const lat2 = radians(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  return 2 * earth * Math.asin(Math.sqrt(h))
}

function point(changeset) {
  const bounds = [changeset.min_lat, changeset.min_lon, changeset.max_lat, changeset.max_lon]
  if (!bounds.every(Number.isFinite)) return null

  const southWest = { lat: changeset.min_lat, lon: changeset.min_lon }
  const northEast = { lat: changeset.max_lat, lon: changeset.max_lon }
  // A country-spanning bulk changeset does not have a meaningful centre.
  if (distance(southWest, northEast) > 250) return null

  return {
    lat: (changeset.min_lat + changeset.max_lat) / 2,
    lon: (changeset.min_lon + changeset.max_lon) / 2,
  }
}

/** Group work into focus areas without needing a geocoder call for
 * every changeset. Each group gets only one reverse lookup after ranking. */
export function clusterChangesets(changesets, radius = 60) {
  const clusters = []

  for (const changeset of changesets) {
    const location = point(changeset)
    if (!location) continue

    const cluster = clusters.find((candidate) => distance(candidate, location) <= radius)
    if (!cluster) {
      clusters.push({ ...location, count: 1 })
      continue
    }

    cluster.lat = (cluster.lat * cluster.count + location.lat) / (cluster.count + 1)
    cluster.lon = (cluster.lon * cluster.count + location.lon) / (cluster.count + 1)
    cluster.count += 1
  }

  return clusters.sort((a, b) => b.count - a.count).slice(0, PLACE_LIMIT)
}

/** Changeset comments are free text, not object tags. These deliberately broad
 * buckets describe editing interests without claiming OSM exposes a
 * user's most-used map tags (it does not). */
export function tallyThemes(changesets) {
  return THEMES.map((theme) => ({
    name: theme.name,
    count: changesets.filter((changeset) => {
      const comment = changeset.tags?.comment?.toLowerCase() ?? ''
      return theme.words.some((word) => new RegExp(`\\b${word}s?\\b`, 'i').test(comment))
    }).length,
  }))
    .filter((theme) => theme.count > 0)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, 4)
}

function placeLabel(result) {
  const address = result?.address ?? {}
  const locality =
    address.borough ??
    address.city_district ??
    address.city ??
    address.town ??
    address.village ??
    address.municipality ??
    address.county
  const region = address.state ?? address.country

  if (locality && region && locality !== region) return `${locality}, ${region}`
  return locality ?? region ?? result?.display_name?.split(',').slice(0, 2).join(',') ?? null
}

async function nameCluster(cluster, index) {
  // The public service permits at most one request per second. A cold cache
  // resolves only five ranked areas, serially, and the complete result is
  // retained for a day before any visitor can cause another lookup.
  if (index) await new Promise((resolve) => setTimeout(resolve, 1_050))

  const url = new URL(NOMINATIM)
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('lat', cluster.lat.toFixed(5))
  url.searchParams.set('lon', cluster.lon.toFixed(5))
  url.searchParams.set('zoom', '10')
  url.searchParams.set('addressdetails', '1')

  try {
    const result = await fetchJson(url, { headers: HEADERS })
    return { ...cluster, label: placeLabel(result) }
  } catch {
    return { ...cluster, label: null }
  }
}

export function shapeStats(profile, changesets, places = []) {
  const totalChangesets = profile.changesets?.count ?? changesets.length
  return {
    profile: PROFILE,
    changesets: totalChangesets,
    memberSince: profile.account_created,
    mappedObjects: changesets.reduce(
      (total, changeset) => total + (changeset.changes_count ?? 0),
      0,
    ),
    sampleSize: changesets.length,
    isLifetime: changesets.length === totalChangesets,
    lastEdit: changesets[0]?.created_at ?? null,
    places: places.filter((place) => place.label),
    themes: tallyThemes(changesets),
    recent: changesets.slice(0, 4).map((changeset) => ({
      id: changeset.id,
      comment: changeset.tags?.comment || 'Map edits',
      changes: changeset.changes_count ?? 0,
      createdAt: changeset.created_at,
      url: `https://www.openstreetmap.org/changeset/${changeset.id}`,
    })),
  }
}

/** The checked-in archive avoids walking all 41 API pages in production.
 * Overlaying the current page keeps it exact as new edits are made, until the
 * archive trails the account by more than OSM's 100-result page size. */
export function mergeChangesets(latest, archived = SNAPSHOT.changesets) {
  const byId = new Map(archived.map((changeset) => [changeset.id, changeset]))
  for (const changeset of latest) byId.set(changeset.id, changeset)
  return [...byId.values()].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )
}

async function fetchChangesetsSince(createdAt) {
  const fetched = []
  const from = createdAt
    ? new Date(new Date(createdAt).getTime() - 1_000).toISOString()
    : new Date(0).toISOString()
  let before

  while (true) {
    const url = new URL(`${API}/changesets.json`)
    url.searchParams.set('user', String(USER_ID))
    url.searchParams.set('from', from)
    url.searchParams.set('limit', String(PAGE_LIMIT))
    if (before) url.searchParams.set('to', before)

    const response = await fetchJson(url, { headers: HEADERS })
    if (!Array.isArray(response?.changesets)) {
      throw new ApiError('OpenStreetMap returned an unexpected changeset list.', 502)
    }

    fetched.push(...response.changesets)
    if (response.changesets.length < PAGE_LIMIT) break

    // Overlap the boundary second so identically-timed changesets are not
    // dropped by OSM's exclusive `to` filter. mergeChangesets removes repeats.
    const oldest = response.changesets.at(-1).created_at
    before = new Date(new Date(oldest).getTime() + 1_000).toISOString()
    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  return fetched
}

async function fetchStats() {
  const profileResponse = await fetchJson(`${API}/user/${USER_ID}.json`, { headers: HEADERS })

  if (!profileResponse?.user) {
    throw new ApiError('OpenStreetMap returned an unexpected response.', 502)
  }

  if (profileResponse.user.changesets?.count !== lifetimeChangesets.length) {
    const latest = await fetchChangesetsSince(lifetimeChangesets[0]?.created_at)
    lifetimeChangesets = mergeChangesets(latest, lifetimeChangesets)
  }

  const clusters = clusterChangesets(lifetimeChangesets)
  const places = []
  for (const [index, cluster] of clusters.entries()) {
    places.push(await nameCluster(cluster, index))
  }

  return shapeStats(profileResponse.user, lifetimeChangesets, places)
}

/** The first page request after 24 hours refreshes the in-memory lifetime
 * archive. Single-flight prevents concurrent visitors duplicating requests. */
export function getOsmStats() {
  return cached('osm:stats', 24 * 60 * 60 * 1000, fetchStats)
}
