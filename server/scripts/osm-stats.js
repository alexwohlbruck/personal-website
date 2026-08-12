import { mkdir, readFile, writeFile } from 'node:fs/promises'

const API = 'https://api.openstreetmap.org/api/0.6'
const USER_ID = 12370548
const USER_AGENT = 'alex.wohlbruck.com/2.0 (+https://alex.wohlbruck.com)'
const HEADERS = { Accept: 'application/json', 'User-Agent': USER_AGENT }
const LIMIT = 100
const OUTPUT = new URL('../src/data/osm-lifetime.generated.json', import.meta.url)

async function getJson(url) {
  const response = await fetch(url, { headers: HEADERS })
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`)
  return response.json()
}

function compact(changeset) {
  return {
    id: changeset.id,
    created_at: changeset.created_at,
    changes_count: changeset.changes_count ?? 0,
    min_lat: changeset.min_lat,
    min_lon: changeset.min_lon,
    max_lat: changeset.max_lat,
    max_lon: changeset.max_lon,
    tags: changeset.tags?.comment ? { comment: changeset.tags.comment } : {},
  }
}

async function readArchive() {
  try {
    const snapshot = JSON.parse(await readFile(OUTPUT, 'utf8'))
    return Array.isArray(snapshot.changesets) ? snapshot.changesets : []
  } catch (error) {
    if (error.code === 'ENOENT') return []
    throw error
  }
}

const profileResponse = await getJson(`${API}/user/${USER_ID}.json`)
const profile = profileResponse.user
if (!profile) throw new Error('OpenStreetMap returned no user profile.')

const archived = await readArchive()
if (archived.length === profile.changesets.count) {
  console.info(`Archive is current at ${archived.length} lifetime changesets.`)
  process.exit(0)
}

const fetched = []
const newestArchived = archived[0]?.created_at
const from = newestArchived
  ? new Date(new Date(newestArchived).getTime() - 1_000).toISOString()
  : new Date(0).toISOString()
let before
let pageNumber = 0

while (true) {
  const url = new URL(`${API}/changesets.json`)
  url.searchParams.set('user', String(USER_ID))
  url.searchParams.set('from', from)
  url.searchParams.set('limit', String(LIMIT))
  if (before) url.searchParams.set('to', before)

  const response = await getJson(url)
  const page = response.changesets
  if (!Array.isArray(page)) throw new Error('OpenStreetMap returned no changeset list.')

  pageNumber += 1
  fetched.push(...page.map(compact))
  console.info(`Fetched page ${pageNumber}: ${fetched.length} candidate changesets`)

  if (page.length < LIMIT) break
  // Include the boundary second again on the next page. Multiple changesets
  // can share a timestamp, and OSM's `to` filter is exclusive; IDs are
  // deduplicated below after the deliberately overlapping requests.
  before = new Date(new Date(page.at(-1).created_at).getTime() + 1_000).toISOString()
  await new Promise((resolve) => setTimeout(resolve, 500))
}

const unique = [
  ...new Map([...archived, ...fetched].map((changeset) => [changeset.id, changeset])).values(),
]
unique.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

if (unique.length !== profile.changesets.count) {
  throw new Error(
    `Archive has ${unique.length} changesets, but the profile reports ${profile.changesets.count}.`,
  )
}

const snapshot = {
  generatedAt: new Date().toISOString(),
  userId: USER_ID,
  changesets: unique,
}

await mkdir(new URL('../src/data/', import.meta.url), { recursive: true })
await writeFile(OUTPUT, `${JSON.stringify(snapshot, null, 2)}\n`)
console.info(`Wrote ${unique.length} lifetime changesets to ${OUTPUT.pathname}`)
