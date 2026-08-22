import type { Component } from 'vue'
import type { Project } from './types'

/** Newest first. This is the order they appear in the index. */
export const projects: Project[] = [
  {
    name: 'portolan',
    title: 'Portolan',
    color: '#101820',
    summary: "Transit maps drawn automatically from a city's published schedule data.",
    start: new Date('2026-08-04'),
    end: new Date(),
    github: 'https://github.com/alexwohlbruck/portolan',
    images: [
      'workbench-nyc.png',
      'amtrak-north-america.jpg',
      'loop-chicago.png',
      'elevated-chicago.jpg',
      'coney-island-nyc.jpg',
      'lynx-charlotte.jpg',
    ],
    tags: ['client-side', 'server-side', 'cartography', 'ci-cd'],
  },
  {
    name: 'barrelman',
    title: 'Barrelman',
    color: '#fff9f3',
    icon: 'svg/barrelman.svg',
    summary: 'Self-hosted search, tiles and routing, all built from OpenStreetMap data.',
    start: new Date('2026-03-30'),
    end: new Date(),
    url: 'https://barrelman.dev',
    github: 'https://github.com/alexwohlbruck/barrelman',
    post: 'building-parchment-on-open-data',
    images: [
      'landing.jpg',
      'features.jpg',
      'osm.jpg',
      'pricing.jpg',
      'world.jpg',
      'dash.png',
      'regions.png',
      'jobs.png',
      'scripts.png',
      'api-keys.png',
      'accounts.png',
    ],
    tags: ['client-side', 'server-side', 'apis', 'databases', 'cartography', 'ci-cd'],
  },
  {
    name: 'coopoly-deal',
    title: 'Co-Opoly Deal',
    color: '#c41e1e',
    icon: 'svg/coopoly-deal.svg',
    summary: 'A realtime multiplayer card game for up to six players.',
    start: new Date('2026-02-26'),
    end: new Date(),
    url: 'https://coopoly.deal',
    github: 'https://github.com/alexwohlbruck/coopoly-deal',
    cover: 'game.jpg',
    images: ['main.jpg', 'lobby.jpg', 'game.jpg', 'settings.jpg', 'endgame.jpg'],
    tags: ['client-side', 'server-side', 'realtime', 'ux', 'ci-cd'],
  },
  {
    name: 'parchment',
    title: 'Parchment Maps',
    color: '#0F141F',
    icon: 'svg/parchment.svg',
    summary: 'A mapping and navigation app built entirely on open data.',
    start: new Date('2023-11-19'),
    end: new Date(),
    url: 'https://parchment.app',
    github: 'https://github.com/alexwohlbruck/parchment',
    post: 'building-parchment-on-open-data',
    cover: 'landing.png',
    images: [
      'landing.png',
      'main.png',
      'day-night.png',
      'search.png',
      'place.png',
      'directions.png',
      'transit.png',
      'streetview.png',
      'settings.png',
      'integrations.png',
      'library-mobile.png',
      'collections-mobile.png',
      'bike-parking-mobile.png',
      'transit-station-mobile.png',
      'weather-mobile.png',
    ],
    tags: [
      'client-side',
      'server-side',
      'apis',
      'databases',
      'realtime',
      'cross-platform',
      'ux',
      'cartography',
      'ci-cd',
    ],
  },
  {
    name: 'rack-finder',
    title: 'Rack Finder',
    color: '#fce047',
    icon: 'svg/rack-finder.svg',
    summary: 'Find bike parking nearby, and add whatever is missing to OpenStreetMap.',
    start: new Date('2023-07-30'),
    end: new Date('2023-12-22'),
    url: 'https://rackfinder.app',
    github: 'https://github.com/alexwohlbruck/rack-finder',
    images: [
      'main.png',
      'detail.png',
      'onboarding.png',
      'main-large.png',
      'contribute.png',
      'poster.png',
      'preferences.png',
      'dark.png',
      'filter.png',
    ],
    tags: [
      'client-side',
      'cross-platform',
      'cartography',
    ],
  },
  {
    name: 'worxstr',
    title: 'Worxstr',
    color: '#18202d',
    icon: 'svg/worxstr.svg',
    summary: 'A labor management and payments platform. I led the frontend and the brand.',
    start: new Date('2020-12-06'),
    end: new Date('2022-05-06'),
    url: 'https://worxstr.netlify.app',
    github: 'https://github.com/Worxstr',
    images: [
      'home.png',
      'home-2.png',
      'dashboard.png',
      'shift.png',
      'jobs.png',
      'job.png',
      'payments.png',
      'payment.png',
      'schedule.png',
      'shift-assign.png',
      'users.png',
      'messages.png',
      'settings.png',
      'dark.png',
      'pricing.png',
      'support.png',
      'blog.png',
    ],
    tags: [
      'client-side',
      'server-side',
      'apis',
      'databases',
      'realtime',
      'cross-platform',
      'ux',
      'ci-cd',
    ],
  },
  {
    name: 'covalent',
    title: 'Covalent',
    color: '#141618',
    icon: 'svg/covalent.svg',
    summary: 'Paired lamps that glow in sync when a friend far away sends a pulse.',
    start: new Date('2022-01-13'),
    end: new Date('2022-05-11'),
    url: 'https://www.projectcovalent.app',
    github: 'https://github.com/alexwohlbruck/covalent',
    images: [
      'slide-1.png',
      'slide-2.png',
      'slide-3.png',
      'slide-4.png',
      'slide-5.png',
      'final.jpg',
      'gif-5.gif',
      'gif-1.gif',
      'progress-1.jpg',
      'gif-2.gif',
      'progress-2.jpg',
      'progress-3.jpg',
      'progress-4.jpg',
      'progress-5.jpg',
      'progress-6.jpg',
      'progress-7.jpg',
      'progress-8.jpg',
      'progress-9.jpg',
      'progress-10.jpg',
      'progress-11.jpg',
      'progress-12.jpg',
      'progress-13.jpg',
      'gif-4.gif',
      'progress-14.jpg',
      'gif-3.gif',
      'progress-15.jpg',
    ],
    tags: [
      'client-side',
      'server-side',
      'apis',
      'realtime',
      'ci-cd',
      'iot',
    ],
  },
  {
    name: 'portfolio',
    title: 'Portfolio',
    color: '#65ffb7',
    icon: 'svg/portfolio.svg',
    summary: 'This site. Vue, Vite and Tailwind, on a paper and ink design system.',
    start: new Date('2021-07-16'),
    end: new Date(),
    github: 'https://github.com/alexwohlbruck/personal-website',
    images: ['home.png', 'about.png', 'work.png', 'project.png', 'contact.png'],
    tags: [
      'client-side',
      'server-side',
      'realtime',
      'ux',
      'ci-cd',
    ],
  },
  {
    name: 'gp-wallpaper',
    title: 'Google Photos Wallpaper',
    color: '#ffffff',
    icon: 'svg/gp-wallpaper.svg',
    summary: 'Cycles your desktop wallpaper through a Google Photos album.',
    start: new Date('2020-03-19'),
    github: 'https://github.com/alexwohlbruck/google-photos-wallpaper',
    images: ['main.png'],
    tags: [
      'client-side',
      'cross-platform',
      'ux',
    ],
  },
  {
    name: 'cat-facts',
    title: 'Cat Facts',
    color: '#03a9f4',
    icon: 'svg/cat-facts.svg',
    summary: 'A prank text service that turned into a public API people still use.',
    start: new Date('2016-12-09'),
    end: new Date('2020-04-01'),
    url: 'https://catfacts.wohlbruck.dev',
    github: 'https://github.com/alexwohlbruck/cat-facts',
    images: [
      'home.png',
      'facts.png',
      'fact.png',
      'recipients.png',
      'console.png',
      'fact-2.png',
      'profile.png',
    ],
    tags: [
      'client-side',
      'server-side',
      'apis',
      'databases',
      'realtime',
    ],
  },
  {
    name: 'clicky',
    title: 'Clicky',
    color: '#e91e63',
    icon: 'svg/clicky.svg',
    summary: 'An online multiplayer typing race, taken from a game played in class.',
    start: new Date('2017-11-27'),
    end: new Date('2018-05-10'),
    url: 'https://clickygame.herokuapp.com/',
    github: 'https://github.com/alexwohlbruck/clicky',
    images: ['game.png', 'logo.png', 'name.png'],
    tags: [
      'client-side',
      'server-side',
      'realtime',
      'ux',
    ],
  },
  {
    name: 'jukebox',
    title: 'Jukebox',
    color: '#063547',
    icon: 'svg/jukebox.svg',
    summary: 'Streams Spotify tracks by sourcing the audio from their music videos.',
    start: new Date('2017-02-10'),
    url: 'https://jukebox.wohlbruck.dev',
    github: 'https://github.com/alexwohlbruck/jukebox',
    images: [
      'original.png',
      'new.png',
      'album.png',
      'search.png',
      'artist.png',
      'home.png',
      'songs.png',
      'album-mobile.png',
      'home-mobile.png',
      'now-playing.png',
    ],
    tags: [
      'client-side',
      'server-side',
      'apis',
      'databases',
      'ux',
    ],
  },
  {
    name: 'rps',
    title: 'Rock, Paper, Scissors',
    color: '#28b4e5',
    icon: 'img/rps.png',
    summary: 'The first real thing I built while learning JavaScript.',
    start: new Date('2015-05-26'),
    url: 'https://rockpaperscissors-demo.netlify.app',
    github: 'https://github.com/alexwohlbruck/rock-paper-scissors',
    coverPosition: 'center',
    images: ['title.png', 'instructions.png', 'color.png', 'play.png', 'finish.png'],
    tags: [
      'client-side',
    ],
  },
]

/** Hand-picked for the home page, in the order they appear there. */
const featuredNames = ['parchment', 'barrelman', 'portolan']

export const featuredProjects = featuredNames
  .map((name) => projects.find((project) => project.name === name))
  .filter((project): project is Project => Boolean(project))

/** Fills the rest of the home page: newest first, minus anything featured. */
export function moreProjects(count: number): Project[] {
  return projects.filter((project) => !featuredNames.includes(project.name)).slice(0, count)
}

export function findProject(name: string): Project | undefined {
  return projects.find((project) => project.name === name)
}

/**
 * Written out in full rather than built from the key: Tailwind scans source
 * files as plain text, so an interpolated class name never reaches the CSS.
 */
const coverCrop = {
  top: 'object-top',
  center: 'object-center',
  bottom: 'object-bottom',
} as const

/**
 * The write-ups, compiled from `content/projects/*.md` into Vue components at
 * build time. Eager because the prose is a few kilobytes against galleries of
 * screenshots, and because a resolved component is one less thing for the
 * prerender pass to wait on.
 */
const bodies = import.meta.glob('../content/projects/*.md', {
  eager: true,
  import: 'default',
}) as Record<string, Component>

/** The rendered write-up, or undefined for a project with no `.md` yet. */
export function projectBody(name: string): Component | undefined {
  return bodies[`../content/projects/${name}.md`]
}

/** The cover image and its crop, filled in with the defaults. */
export function projectCover(project: Project) {
  return {
    file: project.cover ?? project.images[0] ?? '',
    position: coverCrop[project.coverPosition ?? 'top'],
  }
}

/** Wraps around, so the detail page's prev/next never dead-ends. */
export function adjacentProjects(name: string) {
  const index = projects.findIndex((project) => project.name === name)
  if (index === -1) return { previous: undefined, next: undefined }
  return {
    previous: projects[(index - 1 + projects.length) % projects.length],
    next: projects[(index + 1) % projects.length],
  }
}
