import type { TimelineEvent } from './types'

/** Most recent first. `start` is the later boundary; `end` the earlier one. */
export const timeline: TimelineEvent[] = [
  {
    start: new Date('October 23, 2023'),
    title: 'Spectrum Reach',
    description:
      "Associate Full Stack Developer at Spectrum Reach, Spectrum's marketing and advertising branch.",
    icon: 'svg/spectrum.svg',
  },
  {
    start: new Date('August 2, 2023'),
    end: new Date('July 16, 2022'),
    title: 'Xenial',
    description:
      'Junior Full Stack Engineer at Xenial, a Charlotte-based restaurant and payments services company.',
    icon: 'svg/xenial.svg',
  },
  {
    start: new Date('May 7, 2022'),
    title: 'Appalachian State',
    description: 'Graduated Appalachian State University, with a B.S. in computer science.',
    icon: 'svg/appstate.svg',
  },
  {
    start: new Date('May 6, 2022'),
    end: new Date('December 16, 2020'),
    title: 'Worxstr',
    description:
      'Designed and developed the web frontend and mobile app for Worxstr, a digital labor management platform.',
    icon: 'svg/worxstr.svg',
    project: 'worxstr',
  },
  {
    start: new Date('August 1, 2019'),
    end: new Date('May 1, 2019'),
    title: 'PunchAlert',
    description:
      'Worked on custom software suite integrations for the PunchAlert app using Python.',
    icon: 'svg/punch.svg',
  },
  {
    start: new Date('August 16, 2018'),
    title: 'Appalachian State',
    description:
      'Became an undergrad student at Appalachian State University, studying for a B.S. in computer science.',
    icon: 'svg/appstate.svg',
  },
  {
    start: new Date('June 1, 2018'),
    end: new Date('May 1, 2018'),
    title: 'PunchAlert',
    description:
      'Interned writing a new front-end web console for internal use at the company using Vue.js.',
    icon: 'svg/punch.svg',
  },
  {
    start: new Date('May 30, 2018'),
    end: new Date('August 18, 2014'),
    title: 'Myers Park High',
    description:
      'I started learning to code with some of my friends during high school when I went to Myers Park.',
    icon: 'svg/myerspark.svg',
  },
  {
    start: new Date('May 11, 2000'),
    title: 'Birth',
    description: 'I was born in Charlotte, NC at the turn of the century.',
  },
]
