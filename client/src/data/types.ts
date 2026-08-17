export interface Project {
  /** URL slug and the folder name under `assets/portfolio`. */
  name: string
  title: string
  /** Brand colour, used for the tile fill and the page's ambient wash. */
  color: string
  /** Path under `assets/`, e.g. `svg/parchment.svg`. Falls back to a monogram. */
  icon?: string
  /**
   * One line for the index, the cards and the page's meta description. The
   * prose itself lives in `content/projects/<name>.md`.
   */
  summary: string
  start: Date
  /** Omitted for projects that never formally ended. */
  end?: Date
  url?: string
  github?: string
  /** Slug of a blog post about this project, linked from the masthead. */
  post?: string
  /** Filenames under `assets/portfolio/<name>/`. May be empty. */
  images: string[]
  /** Which image fronts the project. Defaults to the first in `images`. */
  cover?: string
  /**
   * How the cover is cropped in its frame. Screenshots are usually best from
   * the top, so that is the default; use `center` for art and `bottom` when
   * the interesting part is below the fold.
   */
  coverPosition?: 'top' | 'center' | 'bottom'
  /** Skill tags. The About page cross-references these. */
  tags: string[]
}

export interface Skill {
  name: string
  tag: string
  /** 1–10, self-assessed. */
  proficiency: number
  description?: string
}

export interface SkillGroups {
  engineering: Skill[]
  craft: Skill[]
  practice: Skill[]
}

export interface TimelineEvent {
  /** When it began. */
  from: Date
  /** When it ended. Leave off for a single moment, like a graduation. */
  to?: Date
  /** Still going, so the range runs to now. */
  ongoing?: boolean
  /** Colours the thread on the timeline. Defaults to work. */
  kind?: 'work' | 'education' | 'life'
  title: string
  description: string
  icon?: string
  /** The company or school's own site. */
  url?: string
  /** Slug of a related project, linked from the entry. */
  project?: string
}

export interface SpotifyPlaybackState {
  is_playing: boolean
  timestamp: number | string
  progress_ms: number
  item: {
    id: string
    name: string
    duration_ms: number
    external_urls: { spotify: string }
    album: { images: { url: string; width: number; height: number }[] }
    artists: { name: string; external_urls: { spotify: string } }[]
  }
  /** First item from Spotify's dynamic queue, when available. */
  next_item?: {
    id: string
    name: string
    duration_ms: number
    external_urls: { spotify: string }
    album: { images: { url: string; width: number; height: number }[] }
    artists: { name: string; external_urls: { spotify: string } }[]
  } | null
}

/** A track as it appears in a list rather than in the player. */
export interface SpotifyListTrack {
  id: string
  name: string
  url: string
  /** Already joined, since nothing renders them separately. */
  artists: string
  album: string
  artwork: string | null
  duration_ms: number
  /** When it was liked. */
  added_at?: string
}

export interface SpotifyArtist {
  id: string
  name: string
  url: string
  image: string | null
  genres: string[]
}

/** A genre and how strongly it shows up, relative to the leading one. 0–1. */
export interface SpotifyGenre {
  name: string
  weight: number
}

/** Which window of listening history a set of favourites covers. */
export type SpotifyRange = 'month' | 'sixMonths' | 'allTime'

export interface SpotifyTop {
  artists: SpotifyArtist[]
  genres: SpotifyGenre[]
}

/**
 * The player's sidekick.
 *
 * Every field is independently nullable: the server fetches them in parallel
 * and all of them need a scope an older token was never granted, so a null here
 * means "that panel has nothing to say" rather than "the request failed".
 */
export interface SpotifyListening {
  ranges: Record<SpotifyRange, SpotifyTop | null>
  liked: SpotifyListTrack[] | null
}

export interface InstagramPost {
  id: string
  permalink: string
  /** The cover, which is the first image in `media`. */
  media_url: string
  /** Every image in the post. Most of these are albums rather than singles. */
  media: string[]
  caption?: string
}

/**
 * A single photo, lifted out of whatever post it belongs to.
 *
 * The grid shows photos rather than posts, so an album of twenty contributes
 * twenty tiles. It keeps a pointer back to its post for the caption and link.
 */
export interface InstagramImage {
  key: string
  url: string
  permalink: string
  caption?: string
  /** Which photo of its post this is, and how many there are. */
  position: number
  total: number
}

export interface OpenStreetMapPlace {
  label: string
  /** Changesets whose centre falls in this area. */
  count: number
  lat: number
  lon: number
}

export interface OpenStreetMapStats {
  profile: string
  /** Lifetime changeset count from the public OSM user profile. */
  changesets: number
  memberSince: string
  /** Map objects changed across the archived changesets. */
  mappedObjects: number
  sampleSize: number
  /** Whether the archive count matches the current profile count. */
  isLifetime: boolean
  lastEdit: string | null
  /** The trailing year of editing, one changeset per count. */
  calendar: ContributionCalendar
  places: OpenStreetMapPlace[]
  /** Broad topics inferred from changeset comments. */
  themes: { name: string; count: number }[]
  recent: {
    id: number
    comment: string
    changes: number
    createdAt: string
    url: string
  }[]
}

export interface CalendarDay {
  /** `YYYY-MM-DD`, in UTC. A square belongs to a date, not to a moment. */
  date: string
  count: number
  /** 0–4 intensity. GitHub's own buckets; quartiles for everything else. */
  level: number
}

/**
 * A year of squares. Shared by every panel that draws one, so the graph itself
 * never has to know whether it is counting commits or changesets.
 */
export interface ContributionCalendar {
  total: number
  /** First and last day of the window, `YYYY-MM-DD`. */
  from: string | null
  to: string | null
  /** Days with at least one of whatever is being counted. */
  activeDays: number
  /**
   * Columns, oldest first. Each holds seven slots, Sunday first, with `null`
   * where the window starts or ends mid-week.
   */
  weeks: (CalendarDay | null)[][]
  currentStreak: number
  longestStreak: number
  busiestDay: CalendarDay | null
}

export interface GitHubStats {
  profile: string
  login: string
  memberSince: string | null
  followers: number
  /** Public, non-forked repositories. */
  repos: number
  stars: number
  calendar: ContributionCalendar
  /** Most-used languages, counted in repositories. */
  languages: { name: string; count: number }[]
  recent: {
    id: string
    /** Repository name without its owner. */
    repo: string
    url: string
    message: string
    /** Only set when GitHub said how many commits the push carried. */
    commits: number | null
    createdAt: string
  }[]
}

/**
 * A busy interval and nothing else. The server asks Google for free/busy rather
 * than for events, so titles never reach it in the first place.
 */
export interface CalendarEvent {
  start: string
  end: string
}
