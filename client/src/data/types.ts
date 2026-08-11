export interface Project {
  /** URL slug and the folder name under `assets/portfolio`. */
  name: string
  title: string
  /** Brand colour, used for the tile fill and the page's ambient wash. */
  color: string
  /** Path under `assets/`, e.g. `svg/parchment.svg`. Falls back to a monogram. */
  icon?: string
  /** Blank line separated; rendered as paragraphs. */
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

export interface InstagramPost {
  id: string
  permalink: string
  media_url: string
  caption?: string
}

export interface CalendarEvent {
  start: string
  end: string
  summary?: string
}
