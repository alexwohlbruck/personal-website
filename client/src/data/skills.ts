import type { SkillGroups } from './types'

/**
 * Skills, not tools. A framework or a database engine is something I picked up
 * in a week and could put down tomorrow; what a project actually demonstrates
 * is the practice underneath it. Project tags are drawn from this same set, so
 * every tag on a project resolves to something on this page.
 */
export const skills: SkillGroups = {
  engineering: [
    {
      name: 'Client-side development',
      tag: 'client-side',
      proficiency: 10,
      description:
        'This is what I do best. Front-end web development has always been what I have considered my best skill. Vue is my home ground, though I have shipped production work in Svelte and contributed to React codebases, and the fundamentals underneath them all matter more to me than the framework on top.',
    },
    {
      name: 'Server-side development',
      tag: 'server-side',
      proficiency: 9,
      description:
        'The other half of web development, backend programming is also in my toolbelt by default. I have extensive experience programming web backends in Node.js, Bun, Python, and some PHP.',
    },
    {
      name: 'Web API design',
      tag: 'apis',
      proficiency: 10,
      description:
        'I have had many runs at designing web APIs to have my client code communicate with a backend server. I am proficient in REST API concepts and design patterns. Check out my project Cat Facts, which has a public API for accessing random facts about cats and other animals.',
    },
    {
      name: 'Databases',
      tag: 'databases',
      proficiency: 8,
      description:
        'Every project needs somewhere to put things. I have shipped on MongoDB, Postgres, MySQL and Firebase, and I am comfortable designing a schema, writing the queries and knowing when a document store beats a relational one. Postgres is where I land most often now.',
    },
    {
      name: 'Realtime apps',
      tag: 'realtime',
      proficiency: 9,
      description:
        'I have always thought realtime data was one of the coolest features of modern applications, and over the years I have learned how to integrate realtime data updates in my apps in a robust and reactive manner using Socket.io and Flux state management patterns.',
    },
    {
      name: 'Cross-platform apps',
      tag: 'cross-platform',
      proficiency: 9,
      description:
        'I have shipped JavaScript-based mobile apps to iOS and Android using the Capacitor framework, and built installable web apps that work offline. Not only was I able to target multiple platforms with one codebase, but the native apps perform well and hardly feel out of place in their respective operating systems, even integrating with native system APIs.',
    },
  ],
  craft: [
    {
      name: 'Graphic design',
      tag: 'graphic-design',
      proficiency: 9,
      description:
        'When I first learned Photoshop in middle school, it started my lifelong passion for graphic design. Before I learned to code, I wanted to major in it in college. I have designed countless logos, graphic art, and UI mockups over the years, mostly in Photoshop and Illustrator.',
    },
    {
      name: 'UX design',
      tag: 'ux',
      proficiency: 9,
      description:
        'When I am making my apps, I always keep the user experience at the center of my process. I aim to create beautiful but also intuitive interfaces that pack a list of required features naturally into the viewport, with fluid animations and delightful interactions. I prototype in Figma, and used to in Adobe XD.',
    },
    {
      name: 'Cartography',
      tag: 'cartography',
      proficiency: 9,
      description:
        'Maps have taken over most of my side project time. I have worked with tiles, projections, routing and the OpenStreetMap data model. Parchment renders its own basemap from open data, Rack Finder queries OSM directly to find bike parking, and I contribute edits of my own.',
    },
  ],
  practice: [
    {
      name: 'Testing',
      tag: 'testing',
      proficiency: 7,
      description:
        'I have integrated both unit tests and E2E tests in hobby and professional projects. Cypress is my favorite testing framework for writing automated tests for web and mobile apps.',
    },
    {
      name: 'CI/CD',
      tag: 'ci-cd',
      proficiency: 7,
      description:
        'Continuous integration and deployment are integral to my workflow in many projects. I am familiar with Git CI and AWS CodePipeline for deploying my projects to the cloud.',
    },
    {
      name: 'IoT & embedded',
      tag: 'iot',
      proficiency: 8,
      description:
        'In addition to programming, I also love smart home tech. I got my Home Assistant rig set up a couple of years ago and I have had a lot of fun using sensors and other devices to control my home automation system. For Covalent I went a layer down, writing C++ for ESP32 microcontrollers and driving them from the browser over Web Bluetooth.',
    },
  ],
}

export const skillGroupLabels = {
  engineering: 'Engineering',
  craft: 'Craft',
  practice: 'Practice',
} as const

export const allSkills = [...skills.engineering, ...skills.craft, ...skills.practice]

export function tagLabel(tag: string): string {
  return allSkills.find((skill) => skill.tag === tag)?.name ?? tag
}

/**
 * The tags worth showing in a cramped space. Nearly every project is
 * client-side work, so rank by rarity and surface what actually sets one apart.
 */
export function distinctiveTags(tags: string[], frequency: Map<string, number>, count = 3) {
  return [...tags]
    .sort((a, b) => (frequency.get(a) ?? 0) - (frequency.get(b) ?? 0) || a.localeCompare(b))
    .slice(0, count)
    .map(tagLabel)
}

export function tagFrequency(projectTags: string[][]) {
  const counts = new Map<string, number>()
  for (const tags of projectTags) {
    for (const tag of tags) counts.set(tag, (counts.get(tag) ?? 0) + 1)
  }
  return counts
}
