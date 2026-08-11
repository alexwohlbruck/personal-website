import type { Project } from './types'

/** Newest first. This is the order they appear in the index. */
export const projects: Project[] = [
  {
    name: 'portolan',
    title: 'Portolan',
    color: '#101820',
    description:
      "Give Portolan a city's published schedule data and it draws the transit map. Every agency publishes a GTFS feed, but a feed is built for trip planners rather than for looking at: draw one straight onto a map and fifteen lines pile up along the same corridor, with only the last one drawn visible.\n\nPortolan does what a mapmaker would do by hand. It works out which routes share a trunk, runs them alongside each other at an even spacing, splits them apart at junctions, and labels every station with the routes that call there. The pipeline is Go and the workbench is Vue. No mapmaker is involved at any step.",
    start: new Date('2026-08-04'),
    end: new Date(),
    github: 'https://github.com/alexwohlbruck/portolan',
    images: ['workbench-nyc.png', 'loop-chicago.png'],
    tags: ['client-side', 'server-side', 'cartography'],
  },
  {
    name: 'barrelman',
    title: 'Barrelman',
    color: '#fff9f3',
    icon: 'svg/barrelman.svg',
    description:
      "The search and routing engine behind Parchment. Barrelman takes an OpenStreetMap extract and turns it into a set of services: place search, spatial queries, vector tiles and routing, all from the same data and with no dependency on commercial map APIs. It is named after the sailor in the crow's nest who watches the horizon.\n\nPostGIS does the heavy lifting, Martin serves the tiles and GraphHopper handles routes. Transit feeds, bike share systems and address data import alongside the OSM extract.",
    start: new Date('2026-03-30'),
    end: new Date(),
    url: 'https://barrelman.dev',
    github: 'https://github.com/alexwohlbruck/barrelman',
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
    tags: ['client-side', 'server-side', 'apis', 'databases', 'cartography'],
  },
  {
    name: 'coopoly-deal',
    title: 'Co-Opoly Deal',
    color: '#c41e1e',
    icon: 'svg/coopoly-deal.svg',
    description:
      'A multiplayer card game in the spirit of Monopoly Deal. One player opens a room, up to six join with a six digit code, and the first to collect three complete property sets wins.\n\nBun and Hono on the back end with WebSockets keeping every hand in sync, React on the front. The whole thing ships as one Docker container.',
    start: new Date('2026-02-26'),
    end: new Date(),
    url: 'https://coopoly.deal',
    github: 'https://github.com/alexwohlbruck/coopoly-deal',
    cover: 'game.jpg',
    images: ['main.jpg', 'lobby.jpg', 'game.jpg', 'settings.jpg', 'endgame.jpg'],
    tags: ['client-side', 'server-side', 'realtime', 'graphic-design', 'ux'],
  },
  {
    name: 'parchment',
    title: 'Parchment Maps',
    color: '#0F141F',
    icon: 'svg/parchment.svg',
    description:
      'A modern mapping and navigation app based on open data and open source software.',
    start: new Date('2023-11-19'),
    end: new Date(),
    url: 'https://parchment.app',
    github: 'https://github.com/alexwohlbruck/parchment',
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
    ],
  },
  {
    name: 'rack-finder',
    title: 'Rack Finder',
    color: '#fce047',
    icon: 'svg/rack-finder.svg',
    description:
      'Easily find nearby bike racks in your city! This simple app uses OpenStreetMap data to locate nearby bike racks, and allows you to contribute new ones to the OSM database.',
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
      'apis',
      'cross-platform',
      'graphic-design',
      'cartography',
    ],
  },
  {
    name: 'worxstr',
    title: 'Worxstr',
    color: '#18202d',
    icon: 'svg/worxstr.svg',
    description:
      'Worxstr is a digital labor management and payments platform for temporary contract work. Since it was started, I have been designing and developing our website and mobile app. I developed our brand design guidelines and logo, and I am the frontend development lead on the project.',
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
      'graphic-design',
      'ux',
      'testing',
      'ci-cd',
    ],
  },
  {
    name: 'covalent',
    title: 'Covalent',
    color: '#141618',
    icon: 'svg/covalent.svg',
    description:
      'For my final CS capstone course, using Node.js and the ESP32 microcontroller, this project aims to connect friends who live far away with a lamp for each person that will light up and pulse in sync when someone sends a message.\n\nI made two lamps, each equipped with a Wemos D1 mini, which connected to a Node.js Socket.io server and can be controlled using a web app via Bluetooth. Colors can be changed by rotating the top bezel, and the pulse sent by pressing down. A double press will activate a simple reading mode, which lights the lamp indefinitely in the color temperature of your choice. The lamps are also outfitted with PIR motion and ambient light sensors, which can smartly dim the lamp when you are sleeping or not in the room.',
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
      'graphic-design',
      'ci-cd',
      'iot',
    ],
  },
  {
    name: 'portfolio',
    title: 'Portfolio',
    color: '#65ffb7',
    icon: 'svg/portfolio.svg',
    description:
      "This is the website you're looking at right now. The current edition runs on Vue 3, Vite and Tailwind, with a paper-and-ink design system that follows your system theme. It hosts my projects, a bit about me, and media pulled live from the Instagram and Spotify APIs. Go ahead and explore the rest.",
    start: new Date('2021-07-16'),
    end: new Date(),
    github: 'https://github.com/alexwohlbruck/personal-website',
    images: ['home.png', 'about.png', 'work.png', 'project.png', 'contact.png'],
    tags: [
      'client-side',
      'server-side',
      'apis',
      'realtime',
      'graphic-design',
      'ux',
      'ci-cd',
    ],
  },
  {
    name: 'gp-wallpaper',
    title: 'Google Photos Wallpaper',
    color: '#ffffff',
    icon: 'svg/gp-wallpaper.svg',
    description:
      "This project was inspired by the personal photo slideshow on the Google Nest devices. This app uses the Google Photos API to retrieve a user's photo albums, changing their desktop wallpaper on a customized cycle.",
    start: new Date('2020-03-19'),
    github: 'https://github.com/alexwohlbruck/google-photos-wallpaper',
    images: ['main.png'],
    tags: [
      'client-side',
      'server-side',
      'cross-platform',
      'ux',
      'testing',
    ],
  },
  {
    name: 'cat-facts',
    title: 'Cat Facts',
    color: '#03a9f4',
    icon: 'svg/cat-facts.svg',
    description:
      'What started out as a fun prank texting friends random cat facts every day, turned into a wide-scale API that people around the world use in their "pet" projects (ha). Here I host a database of facts about cats, dogs, and other animals. Facts are crowdsourced from users and voted on to elect the best facts.',
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
      'graphic-design',
    ],
  },
  {
    name: 'clicky',
    title: 'Clicky',
    color: '#e91e63',
    icon: 'svg/clicky.svg',
    description:
      'In high school, sometimes I would play a game with classmates where one person would type a letter into a text box as fast as they can, and another person would backspace as fast as they can. The first person to fill the text box or delete all the letters wins. I decided to turn this into an online multiplayer game, and I called it Clicky.',
    start: new Date('2017-11-27'),
    end: new Date('2018-05-10'),
    url: 'https://clickygame.herokuapp.com/',
    github: 'https://github.com/alexwohlbruck/clicky',
    images: ['game.png', 'logo.png', 'name.png'],
    tags: [
      'client-side',
      'server-side',
      'realtime',
      'graphic-design',
      'ux',
    ],
  },
  {
    name: 'jukebox',
    title: 'Jukebox',
    color: '#063547',
    icon: 'svg/jukebox.svg',
    description:
      'This app lets you stream music from your Spotify account for free by streaming the isolated audio from the Youtube-equivalent music videos. You can search and play songs from Spotify, and the mp3 file will be streamed to the browser. I started to redesign the site with a better user interface and synchonized group playback, but I later scrapped it to work on other projects. There are some concept UI mockups in the screenshots below.',
    start: new Date('2017-02-10'),
    url: 'https://jukebox-redux.herokuapp.com/',
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
      'graphic-design',
      'ux',
    ],
  },
  {
    name: 'rps',
    title: 'Rock, Paper, Scissors',
    color: '#28b4e5',
    icon: 'img/rps.png',
    description:
      'This was the first significant project I worked on when I started to learn JavaScript and jQuery. The code is pretty rough looking, but all-in-all it turned out to be a nice little game.',
    start: new Date('2015-05-26'),
    url: 'https://rockpaperscissors-demo.netlify.app',
    github: 'https://github.com/alexwohlbruck/rock-paper-scissors',
    coverPosition: 'center',
    images: ['title.png', 'instructions.png', 'color.png', 'play.png', 'finish.png'],
    tags: [
      'client-side',
      'graphic-design',
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
