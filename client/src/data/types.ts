export interface Project {
  /** URL slug and the folder name under `assets/portfolio`. */
  name: string
  title: string
  /** Brand colour, used for the tile fill and the page's ambient wash. */
  color: string
  /** Path under `assets/`, e.g. `svg/parchment.svg`. Falls back to a monogram. */
  icon?: string
  /** One line for the index and cards. Falls back to the description. */
  summary?: string
  /** Blank line separated; rendered as paragraphs on the project page. */
  description: string
  start: Date
  /** Omitted for projects that never formally ended. */
  end?: Date
  url?: string
  github?: string
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
    name: string
    duration_ms: number
    external_urls: { spotify: string }
    album: { images: { url: string; width: number; height: number }[] }
    artists: { name: string; external_urls: { spotify: string } }[]
  }
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
  /** On history entries only. */
  played_at?: string
  /** On liked songs only. */
  added_at?: string
}

export interface SpotifyPlaylist {
  id: string
  name: string
  url: string
  image: string | null
  description: string
  tracks: number
}

export interface SpotifyShow {
  id: string
  name: string
  url: string
  image: string | null
  publisher: string
  added_at: string
}

/** Which window of listening history a set of favourites covers. */
export type SpotifyRange = 'month' | 'sixMonths' | 'allTime'

export interface SpotifyTop {
  artists: SpotifyArtist[]
  genres: SpotifyGenre[]
  tracks: SpotifyListTrack[]
}

/**
 * Everything the listening section draws.
 *
 * Every field is independently nullable: the server fetches them in parallel
 * and half of them need scopes an older token was never granted, so a null here
 * means "that panel has nothing to say" rather than "the request failed".
 */
export interface SpotifyListening {
  ranges: Record<SpotifyRange, SpotifyTop | null>
  recent: SpotifyListTrack[] | null
  liked: SpotifyListTrack[] | null
  playlists: { items: SpotifyPlaylist[]; total: number } | null
  shows: SpotifyShow[] | null
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

/**
 * A busy interval and nothing else. The server asks Google for free/busy rather
 * than for events, so titles never reach it in the first place.
 */
export interface CalendarEvent {
  start: string
  end: string
}
