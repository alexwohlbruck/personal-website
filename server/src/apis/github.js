import { config } from '../config.js'
import { cached } from '../lib/cache.js'
import { shapeCalendar } from '../lib/calendar.js'
import { ApiError, fetchJson } from '../util.js'

const REST = 'https://api.github.com'
const GRAPHQL = `${REST}/graphql`
const USER_AGENT = 'alex.wohlbruck.com/2.0 (+https://alex.wohlbruck.com)'
const LANGUAGE_LIMIT = 6
const RECENT_LIMIT = 5
const REPO_PAGE = 100

/** GitHub's own five buckets, so the squares match the ones on the profile. */
const LEVELS = {
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4,
}

const PROFILE_QUERY = `
  query ($login: String!) {
    user(login: $login) {
      login
      createdAt
      followers { totalCount }
      contributionsCollection {
        contributionCalendar {
          weeks { contributionDays { date contributionCount contributionLevel } }
        }
      }
      repositories(
        first: ${REPO_PAGE}
        privacy: PUBLIC
        isFork: false
        ownerAffiliations: OWNER
        orderBy: { field: PUSHED_AT, direction: DESC }
      ) {
        totalCount
        nodes { name url description stargazerCount primaryLanguage { name } }
      }
    }
  }
`

function login() {
  return config.github.login
}

function headers() {
  const value = { Accept: 'application/vnd.github+json', 'User-Agent': USER_AGENT }
  // Only ever sent to api.github.com. The public calendar below is a page on
  // github.com, and a token has no business travelling to an HTML endpoint.
  if (config.github.token) value.Authorization = `Bearer ${config.github.token}`
  return value
}

async function fetchText(url) {
  const response = await fetch(url, { headers: { Accept: 'text/html', 'User-Agent': USER_AGENT } })
  if (!response.ok) {
    throw new ApiError(`${response.status} ${response.statusText}`, response.status)
  }
  return response.text()
}

/* -------------------------------------------------------------------------- */
/* Shaping                                                                    */
/* -------------------------------------------------------------------------- */

const DAY_CELL = /<td[^>]*\bdata-date="(\d{4}-\d{2}-\d{2})"[^>]*>/g
const TOOLTIP = /<tool-tip[^>]*\bfor="([^"]+)"[^>]*>([\s\S]*?)<\/tool-tip>/g

/**
 * The calendar as the profile page itself renders it.
 *
 * GitHub publishes contribution counts nowhere in its public REST API, and the
 * GraphQL field that has them refuses anonymous callers. This fragment is the
 * same one the profile page fetches, needs no credentials, and is what keeps
 * the panel alive on a deployment without a token. Each square carries its
 * date and quartile as attributes; the exact count lives in the tooltip that
 * points back at the square's id.
 */
export function parseContributionCalendar(html) {
  const counts = new Map()
  for (const [, id, text] of html.matchAll(TOOLTIP)) {
    // "No contributions on August 11th." has no number to find, which is 0.
    const count = text.replace(/,/g, '').match(/(\d+)\s+contribution/)
    counts.set(id, count ? Number(count[1]) : 0)
  }

  const days = []
  for (const [tag, date] of html.matchAll(DAY_CELL)) {
    const id = tag.match(/\bid="([^"]+)"/)?.[1]
    const level = Number(tag.match(/\bdata-level="(\d)"/)?.[1] ?? 0)
    // A square with a level but no tooltip still happened at least once.
    days.push({ date, count: counts.get(id) ?? (level ? 1 : 0), level })
  }

  if (!days.length) throw new ApiError('GitHub returned no contribution calendar.', 502)
  return days
}

/** Repositories per language. Bytes would be a truer measure and costs one
 * request per repository to find out, which this does not spend. */
export function topLanguages(repos) {
  const tally = new Map()
  for (const repo of repos) {
    if (!repo.language) continue
    tally.set(repo.language, (tally.get(repo.language) ?? 0) + 1)
  }

  return [...tally]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, LANGUAGE_LIMIT)
}

/**
 * Public pushes, as the closest thing GitHub offers to "recent work". The feed
 * also carries stars, forks and comments, which say nothing about it.
 *
 * Anonymous callers get a thinner payload than the docs describe: no `commits`
 * array and no `size`, only the head SHA. So the message is left null here for
 * `describePushes` to go and fetch, and the commit count is only claimed when
 * the feed actually stated one.
 */
export function shapeEvents(events = []) {
  const seen = new Set()

  return events
    .filter((event) => event.type === 'PushEvent' && (event.payload?.head || event.payload?.commits?.length))
    .filter((event) => {
      // Pushing one commit to two branches is two events landing on the same
      // SHA, which would otherwise read as the same work done twice.
      const key = `${event.repo.name}@${event.payload.head}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .slice(0, RECENT_LIMIT)
    .map((event) => {
      const commits = event.payload.commits ?? []
      const head = commits.at(-1)
      return {
        id: String(event.id),
        source: event.repo.name,
        repo: event.repo.name.split('/').at(-1),
        sha: event.payload.head ?? head?.sha,
        branch: event.payload.ref?.replace('refs/heads/', '') ?? null,
        // A commit body belongs in the log, not on a card.
        message: head?.message.split('\n')[0] ?? null,
        commits: event.payload.size ?? (commits.length || null),
        createdAt: event.created_at,
      }
    })
}

export function shapeStats(profile, days, repos = [], recent = []) {
  return {
    profile: `https://github.com/${profile.login}`,
    login: profile.login,
    memberSince: profile.memberSince ?? null,
    followers: profile.followers ?? 0,
    repos: profile.repos ?? repos.length,
    stars: repos.reduce((total, repo) => total + (repo.stars ?? 0), 0),
    calendar: shapeCalendar(days),
    languages: topLanguages(repos),
    recent,
  }
}

/* -------------------------------------------------------------------------- */
/* Fetching                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * The last few pushes, each with the subject line of the commit it landed on.
 *
 * The activity feed is a bonus row, not the section: every request in here
 * falls back rather than throws, so a rate-limited feed costs a list and not
 * the graph above it. Five extra commit lookups an hour is a price worth
 * paying for a list that says what was done rather than only where.
 */
async function fetchRecent() {
  const events = await fetchJson(`${REST}/users/${login()}/events/public?per_page=30`, {
    headers: headers(),
  }).catch(() => [])

  const pushes = shapeEvents(Array.isArray(events) ? events : [])

  return Promise.all(
    pushes.map(async (push) => {
      const commit =
        push.message || !push.sha
          ? null
          : await fetchJson(`${REST}/repos/${push.source}/commits/${push.sha}`, {
              headers: headers(),
            }).catch(() => null)

      const message = push.message ?? commit?.commit?.message.split('\n')[0]
      return {
        id: push.id,
        repo: push.repo,
        url: `https://github.com/${push.source}/commit/${push.sha}`,
        message: message || `Pushed to ${push.branch ?? 'a branch'}`,
        commits: push.commits,
        createdAt: push.createdAt,
      }
    }),
  )
}

/** One request for the whole panel, and the only way to read the calendar
 * without scraping for it. */
async function fetchWithToken() {
  const body = await fetchJson(GRAPHQL, {
    method: 'POST',
    headers: { ...headers(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: PROFILE_QUERY, variables: { login: login() } }),
  })

  // GraphQL reports its failures inside a 200 rather than as a status code.
  if (body?.errors?.length) throw new ApiError(`GitHub: ${body.errors[0].message}`, 502)
  const user = body?.data?.user
  if (!user) throw new ApiError('GitHub returned an unexpected profile.', 502)

  const days = user.contributionsCollection.contributionCalendar.weeks.flatMap((week) =>
    week.contributionDays.map((day) => ({
      date: day.date,
      count: day.contributionCount,
      level: LEVELS[day.contributionLevel] ?? 0,
    })),
  )

  return {
    profile: {
      login: user.login,
      memberSince: user.createdAt,
      followers: user.followers.totalCount,
      repos: user.repositories.totalCount,
    },
    days,
    repos: user.repositories.nodes.map((repo) => ({
      name: repo.name,
      url: repo.url,
      description: repo.description,
      stars: repo.stargazerCount,
      language: repo.primaryLanguage?.name ?? null,
    })),
  }
}

/** The same panel out of endpoints that need no credentials. Three requests
 * against an hourly cache, well inside the 60 an hour anonymous callers get. */
async function fetchPublic() {
  const [html, user, repos] = await Promise.all([
    fetchText(`https://github.com/users/${login()}/contributions`),
    fetchJson(`${REST}/users/${login()}`, { headers: headers() }),
    fetchJson(`${REST}/users/${login()}/repos?per_page=${REPO_PAGE}&type=owner&sort=pushed`, {
      headers: headers(),
    }),
  ])

  if (!user?.login) throw new ApiError('GitHub returned an unexpected profile.', 502)

  return {
    profile: {
      login: user.login,
      memberSince: user.created_at,
      followers: user.followers,
      repos: user.public_repos,
    },
    days: parseContributionCalendar(html),
    repos: (Array.isArray(repos) ? repos : [])
      .filter((repo) => !repo.fork)
      .map((repo) => ({
        name: repo.name,
        url: repo.html_url,
        description: repo.description,
        stars: repo.stargazers_count,
        language: repo.language,
      })),
  }
}

async function fetchStats() {
  const [{ profile, days, repos }, recent] = await Promise.all([
    config.github.token ? fetchWithToken() : fetchPublic(),
    fetchRecent(),
  ])

  return shapeStats(profile, days, repos, recent)
}

/** Hourly, so a commit shows up the same afternoon it was pushed. Single
 * flight means a burst of visitors still costs one refresh. */
export function getGithubStats() {
  return cached('github:stats', 60 * 60 * 1000, fetchStats)
}
