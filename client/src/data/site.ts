export const site = {
  name: 'Alex Wohlbruck',
  initials: 'AW',
  /** Canonical origin, used to build absolute URLs for meta tags and the feed. */
  url: 'https://alex.wohlbruck.com',
  role: 'Software engineer & designer',
  location: 'Brooklyn, NY',
  timezone: 'America/New_York',
  currently: {
    title: 'Software Engineer',
    company: 'Subway Builder',
    since: new Date('2025-10-01'),
  },
  /** The hero statement. Say the thing, then stop. */
  statement:
    'I create software for the web. Maps, tools, games, and interfaces designed to delight.',
  /** Rotates under the hero statement. */
  alsoA: [
    'web developer',
    'graphic designer',
    'photographer',
    'software engineer',
    'pianist',
    'designer',
    'environmentalist',
    'cartographer',
    'bike commuter',
    'OpenStreetMap contributor',
    'cat dad',
    'cheese lover',
    'coffee shop frequenter',
    'problem solver',
    'musician',
    'urbanist',
    'cyclist',
    'programmer',
    'homelabber',
    'Brooklynite',
    'train nerd',
    'traveler',
    'explorer',
    'nerd',
    'activist',
    'techie',
    'feminist',
    'advocate',
    'library card holder',
    'anti-imperialist',
    'anti-zionist',
    'city council attendee',
    'cat fact collector',
  ],
} as const

export const links = {
  linkedin: 'https://linkedin.com/in/alexwohlbruck',
  github: 'https://github.com/alexwohlbruck',
  instagram: 'https://instagram.com/alexwohlbruck',
  spotify: 'https://open.spotify.com/user/alexwohlbruck',
  musescore: 'https://musescore.com/user/29055565',
  twitter: 'https://twitter.com/alexwohlbruck',
  strava: 'https://www.strava.com/athletes/95789735',
  osm: 'https://www.openstreetmap.org/user/alexwohlbruck',
} as const

export interface SocialLink {
  label: string
  /** Filename under `assets/svg/`. */
  icon: string
  href?: string
  /** Named route, for internal destinations. */
  to?: string
  handle: string
}

export const socials: SocialLink[] = [
  { label: 'Email', icon: 'at', to: 'contact', handle: 'Send a message' },
  { label: 'GitHub', icon: 'github', href: links.github, handle: '@alexwohlbruck' },
  { label: 'LinkedIn', icon: 'linkedin', href: links.linkedin, handle: 'in/alexwohlbruck' },
  { label: 'Instagram', icon: 'instagram', href: links.instagram, handle: '@alexwohlbruck' },
  { label: 'Spotify', icon: 'spotify', href: links.spotify, handle: 'alexwohlbruck' },
  { label: 'MuseScore', icon: 'musescore', href: links.musescore, handle: 'Sheet music' },
  { label: 'Strava', icon: 'strava', href: links.strava, handle: 'Rides & runs' },
  { label: 'OpenStreetMap', icon: 'osm', href: links.osm, handle: 'Map edits' },
]

const defaultBackendUrl = import.meta.env.DEV
  ? 'http://localhost:3000'
  : globalThis.location?.hostname === 'alex.wohlbruck.com'
    ? 'https://api.alex.wohlbruck.dev'
    : '/api'

/**
 * Set `VITE_BACKEND_URL` when Vite runs separately from Express. The unified
 * Vega image uses same-origin /api; the legacy Netlify hostname uses Vega's
 * compatibility API hostname.
 */
export const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ?? defaultBackendUrl

/**
 * Jukebox resolves the Spotify track identifier supplied by the now-playing
 * API and returns a live MP3 stream. It is deliberately separate from the
 * Spotify Web Playback SDK: that SDK cannot play an arbitrary audio source.
 */
export const JUKEBOX_URL = import.meta.env.VITE_JUKEBOX_URL ?? 'https://jukebox.wohlbruck.dev'
