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
      description: 'Worxstr is a digital labor management and payments platform for temporary contract work. Since it was started, I have been designing and developing our website and mobile app. I developed our brand design guidelines and logo, and I am the frontend development lead on the project.',
      url: 'https://worxstr.com',
      showPreview: true,
      images: ['home.png', 'home.png', 'home.png']
    },
    {
      name: 'cat-facts',
      title: 'Cat Facts',
      color: '#03a9f4',
      icon: 'cat-facts',
      description: 'What started out as a fun prank texting friends random cat facts every day, turned into a wide-scale API that people around the world use in their pet projects. Here I host a database of facts about cats, dogs, and other animals. Facts are crowdsourced from users and voted on to elect the best facts.',
      url: 'https://cat-fact.herokuapp.com',
      showPreview: true,
    },
    {
      name: 'gp-wallpaper',
      title: 'Google Photos Wallpaper',
      color: '#ffffff',
      icon: 'gp-wallpaper',
      description: 'This project was inspired by the personal photo slideshow on the Google Nest devices. This app uses the Google Photos API to retrieve a user\'s photo albums, changing their desktop wallpaper on a customized cycle.',
      url: 'https://github.com/alexwohlbruck/google-photos-wallpaper',
    },
    {
      name: 'clicky',
      title: 'Clicky',
      color: '#e91e63',
      icon: 'clicky',
      description: 'In high school, sometimes I would play a game with classmates where one person would type a letter into a text box as fast as they can, and another person would backspace as fast as they can. The first person to fill the text box or delete all the letters wins. I decided to turn this into an online multiplayer game, and I called it Clicky.',
      url: 'https://clickygame.herokuapp.com/',
    },
    {
      name: 'jukebox',
      title: 'Jukebox',
      color: '#063547',
      icon: 'jukebox',
      description: 'This app lets you stream music from your Spotify account for free by streaming the isolated audio from the Youtube-equivalent music videos. You can play and queue songs from your library, and the mp3 file will be streamed to the browser. It is no longer functional because of copyright issues and the YTDL dispute.',
      url: 'https://github.com/alexwohlbruck/jukebox',
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