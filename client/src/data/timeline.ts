import type { TimelineEvent } from './types'

/** Most recent first. `from` is when it started, `to` is when it ended. */
export const timeline: TimelineEvent[] = [
  {
    from: new Date('October 1, 2025'),
    ongoing: true,
    title: 'Subway Builder',
    url: 'https://www.subwaybuilder.com/',
    description:
      'Software Engineer at Subway Builder, full-time and hybrid out of Manhattan.',
    icon: 'svg/subway-builder.svg',
  },
  {
    from: new Date('November 19, 2023'),
    ongoing: true,
    title: 'Parchment Maps',
    url: 'https://parchment.app',
    description:
      'Self-employed, designing and building Parchment, a mapping and navigation app made from open data and open source software.',
    icon: 'svg/parchment.svg',
    project: 'parchment',
  },
  {
    from: new Date('October 23, 2023'),
    to: new Date('October 1, 2025'),
    title: 'Spectrum Reach',
    url: 'https://www.spectrumreach.com/',
    description:
      "Associate Full Stack Developer at Spectrum Reach, Spectrum's marketing and advertising branch.",
    icon: 'svg/spectrum.svg',
  },
  {
    from: new Date('July 16, 2022'),
    to: new Date('August 2, 2023'),
    title: 'Xenial',
    url: 'https://www.xenial.com/',
    description:
      'Junior Full Stack Engineer at Xenial, a Charlotte-based restaurant and payments services company.',
    icon: 'svg/xenial.svg',
  },
  {
    from: new Date('December 16, 2020'),
    to: new Date('May 6, 2022'),
    title: 'Worxstr',
    url: 'https://worxstr.netlify.app',
    description:
      'Designed and developed the web frontend and mobile app for Worxstr, a digital labor management platform.',
    icon: 'svg/worxstr.svg',
    project: 'worxstr',
  },
  {
    from: new Date('May 1, 2019'),
    to: new Date('August 1, 2019'),
    title: 'PunchAlert',
    url: 'https://web.archive.org/web/20240415184240/https://www.punchalert.com/',
    description:
      'Worked on custom software suite integrations for the PunchAlert app using Python.',
    icon: 'svg/punch.svg',
  },
  {
    from: new Date('August 16, 2018'),
    to: new Date('May 7, 2022'),
    kind: 'education',
    title: 'Appalachian State',
    url: 'https://www.appstate.edu/',
    description:
      'Four years at Appalachian State University, finishing with a B.S. in computer science. Both PunchAlert stints happened while I was enrolled.',
    icon: 'svg/appstate.svg',
  },
  {
    from: new Date('May 1, 2018'),
    to: new Date('June 1, 2018'),
    title: 'PunchAlert',
    url: 'https://web.archive.org/web/20240415184240/https://www.punchalert.com/',
    description:
      'Interned writing a new front-end web console for internal use at the company using Vue.js.',
    icon: 'svg/punch.svg',
  },
  {
    from: new Date('August 18, 2014'),
    to: new Date('May 30, 2018'),
    kind: 'education',
    title: 'Myers Park High',
    description:
      'I started learning to code with some of my friends during high school when I went to Myers Park.',
    icon: 'svg/myerspark.svg',
  },
  {
    from: new Date('May 11, 2000'),
    kind: 'life',
    title: 'Birth',
    description: 'I was born in Charlotte, NC at the turn of the century.',
  },
]
