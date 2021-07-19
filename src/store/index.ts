import Vue from 'vue'
import Vuex from 'vuex'
import * as getters from './getters'
import * as actions from './actions'
import mutations from './mutations'

Vue.use(Vuex)

const state = {
  projects: [
    {
      name: 'worxstr',
      title: 'Worxstr',
      color: '#18202d',
      icon: 'worxstr',
      description: 'Worxstr description.',
      url: 'https://worxstr.com',
      images: ['home.png']
    },
    {
      name: 'cat-facts',
      title: 'Cat Facts',
      color: '#03a9f4',
      icon: 'cat-facts',
      description: '',
    },
    {
      name: 'gp-wallpaper',
      title: 'Google Photos Wallpaper',
      color: '#ffffff',
      icon: 'gp-wallpaper',
      description: '',
    },
    {
      name: 'clicky',
      title: 'Clicky',
      color: '#0091ea',
      icon: 'clicky',
      description: '',
    },
    {
      name: 'jukebox',
      title: 'Jukebox',
      color: '#063547',
      icon: 'jukebox',
      description: '',
    },
  ],
  timeline: [
    {
      start: new Date(),
      end: new Date('December 16, 2020'),
      title: 'Worxstr',
      description:
        'Designed and developed the web frontend and mobile app for Worxstr, a digital labor management platform.',
      icon: 'worxstr',
      to: {
        name: 'project',
        params: {
          name: 'worxstr'
        }
      },
    },
    {
      start: new Date('August 1, 2019'),
      end: new Date('May 1, 2019'),
      title: 'PunchAlert',
      description:
        'Worked on custom software suite integrations for the PunchAlert app using Python.',
      icon: 'punch',
    },
    {
      start: new Date('August 16, 2018'),
      title: 'Appalachian State',
      description:
        'Became an undergrad student at Appalachian State University, studying for a B.S. in computer science.',
      icon: 'appstate',
    },
    {
      start: new Date('June 1, 2018'),
      end: new Date('May 1, 2018'),
      title: 'PunchAlert',
      description:
        'Interned writing a new front-end web console for internal use at the company using Vue.js.',
      icon: 'punch',
    },
    {
      start: new Date('May 30, 2018'),
      end: new Date('August 18, 2014'),
      title: 'Myers Park High',
      description:
        'I started learning to code with some of my friends during high school when I went to Myers Park.',
      icon: 'myerspark',
    },
    {
      start: new Date('May 11, 2000'),
      title: 'Birth',
      description: 'I was born in Charlotte, NC at the turn of the century.',
    },
  ]
}

export default new Vuex.Store({
  state,
  getters,
  actions,
  mutations
})