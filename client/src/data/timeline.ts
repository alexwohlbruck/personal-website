import type { TimelineEvent } from './types'

/** Most recent first. `from` is when it started, `to` is when it ended. */
export const timeline: TimelineEvent[] = [
  {
    from: new Date('October 1, 2025'),
    ongoing: true,
    title: 'Subway Builder',
    description:
      'Software Engineer at Subway Builder, full-time and hybrid out of Manhattan.',
    icon: 'svg/subway-builder.svg',
  },
  {
    from: new Date('November 19, 2023'),
    ongoing: true,
    title: 'Parchment Maps',
    description:
      'Self-employed, designing and building Parchment, a mapping and navigation app made from open data and open source software.',
    icon: 'svg/parchment.svg',
    project: 'parchment',
  },
  {
    from: new Date('October 23, 2023'),
    to: new Date('October 1, 2025'),
    title: 'Spectrum Reach',
    description:
      "Associate Full Stack Developer at Spectrum Reach, Spectrum's marketing and advertising branch.",
    icon: 'svg/spectrum.svg',
  },
  {
    from: new Date('July 16, 2022'),
    to: new Date('August 2, 2023'),
    title: 'Xenial',
    description:
      'Junior Full Stack Engineer at Xenial, a Charlotte-based restaurant and payments services company.',
    icon: 'svg/xenial.svg',
  },
  {
    from: new Date('May 7, 2022'),
    title: 'Appalachian State',
    description: 'Graduated Appalachian State University, with a B.S. in computer science.',
    icon: 'svg/appstate.svg',
  },
  {
    from: new Date('December 16, 2020'),
    to: new Date('May 6, 2022'),
    title: 'Worxstr',
    description:
      'Designed and developed the web frontend and mobile app for Worxstr, a digital labor management platform.',
    icon: 'svg/worxstr.svg',
    project: 'worxstr',
  },
  {
    from: new Date('May 1, 2019'),
    to: new Date('August 1, 2019'),
    title: 'PunchAlert',
    description:
      'Worked on custom software suite integrations for the PunchAlert app using Python.',
    icon: 'svg/punch.svg',
  },
  {
    from: new Date('August 16, 2018'),
    title: 'Appalachian State',
    description:
      'Became an undergrad student at Appalachian State University, studying for a B.S. in computer science.',
    icon: 'svg/appstate.svg',
  },
  {
    from: new Date('May 1, 2018'),
    to: new Date('June 1, 2018'),
    title: 'PunchAlert',
    description:
      'Interned writing a new front-end web console for internal use at the company using Vue.js.',
    icon: 'svg/punch.svg',
  },
  {
    from: new Date('August 18, 2014'),
    to: new Date('May 30, 2018'),
    title: 'Myers Park High',
    description:
      'I started learning to code with some of my friends during high school when I went to Myers Park.',
    icon: 'svg/myerspark.svg',
  },
  {
    from: new Date('May 11, 2000'),
    title: 'Birth',
    description: 'I was born in Charlotte, NC at the turn of the century.',
  },
]
