import type { SkillGroups } from './types'

export const skills: SkillGroups = {
  languages: [
    {
      name: 'HTML',
      tag: 'html',
      proficiency: 10,
      description:
        "I first started to learn to code with HTML, and it has been the backbone of most of my projects ever since. Although these days, I prefer to use tools like Pug and JSX to elevate my HTML's capabilities.",
    },
    {
      name: 'CSS',
      tag: 'css',
      proficiency: 9,
      description:
        'CSS has always been a fantastic yet deeply confusing tool for application design, but I have managed to get the hang of it by now. This site is built on a small set of hand-tuned design tokens on top of Tailwind.',
    },
    {
      name: 'JavaScript',
      tag: 'js',
      proficiency: 10,
      description:
        'The first programming language I learned, and the one I have most experience with. I have a love-hate relationship with JS, but TypeScript has come to save the day.',
    },
    {
      name: 'TypeScript',
      tag: 'ts',
      proficiency: 8,
      description:
        'I was reluctant to get on board with TypeScript for a while, but ever since I started using it I have found it hard to go back. Some of the advanced language features are still unfamiliar territory for me, but I am learning all the time!',
    },
    {
      name: 'Python',
      tag: 'python',
      proficiency: 8,
      description:
        "Although I never had any formal introduction to Python, it snuck into my life and workflows as I suspect it does to everyone else. We built the Worxstr backend using Python, and although I wouldn't pick it again for a large-scale app, it will always be my favorite language for hacking around and trying new experiments.",
    },
    {
      name: 'Java',
      tag: 'java',
      proficiency: 8,
      description:
        "Java is the language of choice at App State's computer science department for the introduction to programming. It followed us throughout our four years of classes, and is a solid language for me. I have not tried using it yet in any personal projects, but I am certainly aware now of all the design patterns it has to offer.",
    },
    {
      name: 'Dart',
      tag: 'dart',
      proficiency: 6,
      description:
        'I have been slow to learn the Dart language over the last few years, mostly out of the desire to learn cross-platform development with Flutter. I have high hopes for the Dart/Flutter platform, and soon I want to start a multi-platform project using it.',
    },
    {
      name: 'C++',
      tag: 'cpp',
      proficiency: 4,
      description:
        'We learned C and C++ in our systems classes in university, which were not easy at all. What got me to dread the language less was a number of experiments I did with the Arduino and ESP8266 computer boards. Programming those is partly what kickstarted my interest in IoT and embedded systems.',
    },
    {
      name: 'SQL',
      tag: 'sql',
      proficiency: 5,
      description:
        'I started using SQL when I first started learning web development, and every now and then it comes by me. Although given the choice, I usually use a NoSQL database like MongoDB or Firebase for my projects.',
    },
  ],
  tools: [
    {
      name: 'Vue',
      tag: 'vue',
      proficiency: 10,
      description:
        'Vue has always been my favorite JavaScript framework since I first tried it after coming from Angular.js. It has been my framework of choice for most of my projects, including this website.',
    },
    {
      name: 'React',
      tag: 'react',
      proficiency: 7,
      description:
        "I have used React in some open source contributions and I tried my hand with it a number of times. Although I have not used it for a major project, I am fairly familiar with it's paradigms and design patterns.",
    },
    { name: 'Angular', tag: 'angular', proficiency: 8 },
    { name: 'Svelte', tag: 'svelte', proficiency: 6 },
    {
      name: 'Node.js',
      tag: 'node',
      proficiency: 10,
      description:
        'When I began learning web development, I started out with PHP, but quickly got annoyed with it. Node.js was my next choice and I love using it to this day. Usually my preferred language for my web backends.',
    },
    {
      name: 'Flutter',
      tag: 'flutter',
      proficiency: 5,
      description:
        'Flutter has always fascinated me, and although I have not had the time yet to sink some good hours into learning it all, I have dabbled with Flutter in some hackathons I attended. Hoping to learn more soon.',
    },
    {
      name: 'Git',
      tag: 'git',
      proficiency: 9,
      description:
        "Being an essential tool for programming teams, I am very familiar with the Git workflow, although some of it's more advanced commands are still out of my reach.",
    },
    {
      name: 'MongoDB',
      tag: 'mongodb',
      proficiency: 9,
      description:
        "MongoDB has been my favorite database to use since I came across it the first time. It gives me flexibility that SQL databases don't while still able to perform complex lookup and join features.",
    },
    {
      name: 'MySQL',
      tag: 'mysql',
      proficiency: 7,
      description:
        "This is the type of SQL database I have used before. I am familiar and comfortable with basic relational database design and querying, though I haven't tried many of it's advanced features.",
    },
    {
      name: 'Firebase',
      tag: 'firebase',
      proficiency: 8,
      description:
        "The Firebase suite has always been fun to work with with it's realtime database and plug-n-play libraries. Although it can be limiting sometimes, it is a very fun tool to use for my projects.",
    },
    {
      name: 'Photoshop',
      tag: 'photoshop',
      proficiency: 10,
      description:
        'I started playing around in Photoshop around when I was in middle school. Learning to use Photoshop is what got me interested in graphic design, and then later web design and programming. I have used this tool the longest out of everything else listed here.',
    },
    {
      name: 'Illustrator',
      tag: 'illustrator',
      proficiency: 9,
      description:
        'Shortly after learning to use Photoshop, I also began learning Illustrator for designing vector graphics. This has been an invaluable skill to this day for me when creating graphics and mockups for my website and app designs.',
    },
    {
      name: 'Adobe XD',
      tag: 'xd',
      proficiency: 8,
      description:
        'I began using XD along with Figma occasionally for UI mockups around when they were first released. I have come to love these tools since they provide much better features for UI prototyping than something like Illustrator.',
    },
  ],
  specializations: [
    {
      name: 'Client-side development',
      tag: 'client-side',
      proficiency: 10,
      description:
        'This is what I do best. Front-end web development has always been what I have considered my best skill. Although I am always wanting to dive in to other areas of programming, this has always been my special power.',
    },
    {
      name: 'Server-side development',
      tag: 'server-side',
      proficiency: 9,
      description:
        'The other half of web development, backend programming is also in my toolbelt by default. I have extensive experience programming web backends in Node.js, Python, and some PHP.',
    },
    {
      name: 'Cross-platform apps',
      tag: 'cross-platform',
      proficiency: 9,
      description:
        'In addition to messing around with Flutter occasionally, I have also shipped JavaScript-based mobile apps to iOS and Android using the Capacitor framework. Not only was I able to target multiple platforms with one codebase, but the native apps perform well and hardly feel out of place in their respective operating systems, even integrating with native system APIs.',
    },
    {
      name: 'Web API design',
      tag: 'apis',
      proficiency: 10,
      description:
        'I have had many runs at designing web APIs to have my client code communicate with a backend server. I am proficient in REST API concepts and design patterns. Check out my project Cat Facts, which has a public API for accessing random facts about cats and other animals.',
    },
    {
      name: 'Realtime apps',
      tag: 'realtime',
      proficiency: 9,
      description:
        'I have always thought realtime data was one of the coolest features of modern applications, and over the years I have learned how to integrate realtime data updates in my apps in a robust and reactive manner using Socket.io and Flux state management patterns.',
    },
    {
      name: 'CI/CD',
      tag: 'ci-cd',
      proficiency: 7,
      description:
        'Continuous integration and deployment are integral to my workflow in many projects. I am familiar with Git CI and AWS CodePipeline for deploying my projects to the cloud.',
    },
    {
      name: 'Testing',
      tag: 'testing',
      proficiency: 7,
      description:
        'I have integrated both unit tests and E2E tests in hobby and professional projects. Cypress is my favorite testing framework for writing automated tests for web and mobile apps.',
    },
    {
      name: 'Graphic design',
      tag: 'graphic-design',
      proficiency: 9,
      description:
        'When I first learned Photoshop, it started my lifelong passion for graphic design. Before I learned to code, I wanted to major in it in college. I have designed countless logos, graphic art, and UI mockups over the years.',
    },
    {
      name: 'UX design',
      tag: 'ux',
      proficiency: 9,
      description:
        'When I am making my apps, I always keep the user experience at the center of my process. I aim to create beautiful but also intuitive interfaces that pack a list of required features naturally into the viewport, with fluid animations and delightful interactions.',
    },
    {
      name: 'IoT',
      tag: 'iot',
      proficiency: 8,
      description:
        'In addition to programming, I also love smart home tech. I got my Home Assistant rig set up a couple of years ago and I have had a lot of fun using sensors and other devices to control my home automation system.',
    },
  ],
}

export const skillGroupLabels = {
  languages: 'Languages',
  tools: 'Tools & technologies',
  specializations: 'Practices',
} as const

export const allSkills = [...skills.languages, ...skills.tools, ...skills.specializations]

/**
 * Display names for every tag used by a project. Most map to a skill; the rest
 * are one-off technologies that never earned a spot on the skills list.
 */
const extraTagLabels: Record<string, string> = {
  bun: 'Bun',
  postgres: 'PostgreSQL',
  figma: 'Figma',
  gis: 'GIS',
  tailwind: 'Tailwind',
  mapbox: 'Mapbox',
  pwa: 'PWA',
  'web-bluetooth-api': 'Web Bluetooth',
  microcontrollers: 'Microcontrollers',
}

export function tagLabel(tag: string): string {
  return allSkills.find((skill) => skill.tag === tag)?.name ?? extraTagLabels[tag] ?? tag
}

/**
 * The tags worth showing in a cramped space. Nearly every project is tagged
 * html/css/js, so rank by rarity and surface what actually sets one apart.
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
