import Vue from 'vue'
import Vuex from 'vuex'
import * as getters from './getters'
import * as actions from './actions'
import mutations from './mutations'

Vue.use(Vuex)

const state = {
  skills: {
    languages: [
      {
        name: 'HTML',
        proficiency: 10,
        description:
          'I first started to learn to code with HTML, and it has been the backbone of most of my projects ever since. Although these days, I prefer to use tools like Pug and JSX to elevate my HTML capabilities.',
      },
      {
        name: 'CSS',
        proficiency: 9,
        description:
          'CSS has always been a fantastic yet deeply confusing tool for application design, but I have managed to get the hang of it by now. I designed this site using my own custom SCSS markup.',
      },
      {
        name: 'Javascript',
        proficiency: 10,
        description:
          'The first programming lanuage I learned, and the one I have most experience with. I have a love-hate relationship with JS, but TypeScript has come to save the day.',
      },
      {
        name: 'Typescript',
        proficiency: 8,
        description:
          'I was reluctant to get on board with TypeScript for a while, but ever since I started using it I have found it hard to go back. Some of the advanced language features are still unfamiliar territory for me, but I am learning all the time!',
      },
      {
        name: 'Python',
        proficiency: 8,
        description:
          "Although I never had any formal introduction to Python, it snuck into my life and workflows as I suspect it does to everyone else. We built the Worxstr backend using python, and although I wouldn't pick it again for a large-scale app, it will always be my favorite language for hacking around and trying new experiments.",
      },
      {
        name: 'Java',
        proficiency: 7,
        description:
          "Java is the language of choice at App State's computer science department for the introduction to programming. It followed us throughout our four years of classes, and is a solid language for me. I have not tried using it yet in any personal projects, but I am certainly aware now of all the design patterns it has to offer.",
      },
      {
        name: 'Dart',
        proficiency: 5,
        description:
          'I have been slow to learn the Dart language over the last few years, mostly out of the desire to learn cross-platform development with Flutter. I have high hopes for the Dart/Flutter platform, and soon I want to start a multi-platform project using it.',
      },
      {
        name: 'C++',
        proficiency: 5,
        description:
          'We learned C and C++ in our systems classes in university, which were not easy at all. What got me to dread the language less was a number of experiments I did with the Arduino and ESP8266 computer boards. Programming those is mainly what kickstarted my interest in IoT.',
      },
      {
        name: 'SQL',
        proficiency: 4,
        description:
          'I started using SQL when I first started learning web development, and every now and then it comes by me. Although given the choice, I usually use a NoSQL database like MongoDB or Firebase for my projects.',
      },
    ],
    tools: [
      { name: 'Vue.js' },
      { name: 'React' },
      { name: 'Node.js' },
      { name: 'Flutter' },
      { name: 'Git' },
      { name: 'MongoDB' },
      { name: 'MySQL' },
      { name: 'Firebase' },
      { name: 'Photoshop' },
      { name: 'Illustrator' },
      { name: 'Adobe XD' },
    ],
    specializations: [
      { name: 'Client-side development' },
      { name: 'Server-side development' },
      { name: 'Cross-platform apps' },
      { name: 'Hybrid apps' },
      { name: 'UX design' },
      { name: 'Graphic design' },
    ],
  },
  projects: [
    {
      name: 'worxstr',
      title: 'Worxstr',
      color: '#18202d',
      icon: 'worxstr',
      description:
        'Worxstr is a digital labor management and payments platform for temporary contract work. Since it was started, I have been designing and developing our website and mobile app. I developed our brand design guidelines and logo, and I am the frontend development lead on the project.',
      url: 'https://worxstr.com',
      showPreview: true,
      images: ['home.png', 'home.png', 'home.png'],
    },
    {
      name: 'cat-facts',
      title: 'Cat Facts',
      color: '#03a9f4',
      icon: 'cat-facts',
      description:
        'What started out as a fun prank texting friends random cat facts every day, turned into a wide-scale API that people around the world use in their pet projects. Here I host a database of facts about cats, dogs, and other animals. Facts are crowdsourced from users and voted on to elect the best facts.',
      url: 'https://cat-fact.herokuapp.com',
      showPreview: true,
    },
    {
      name: 'gp-wallpaper',
      title: 'Google Photos Wallpaper',
      color: '#ffffff',
      icon: 'gp-wallpaper',
      description:
        "This project was inspired by the personal photo slideshow on the Google Nest devices. This app uses the Google Photos API to retrieve a user's photo albums, changing their desktop wallpaper on a customized cycle.",
      url: 'https://github.com/alexwohlbruck/google-photos-wallpaper',
    },
    {
      name: 'clicky',
      title: 'Clicky',
      color: '#e91e63',
      icon: 'clicky',
      description:
        'In high school, sometimes I would play a game with classmates where one person would type a letter into a text box as fast as they can, and another person would backspace as fast as they can. The first person to fill the text box or delete all the letters wins. I decided to turn this into an online multiplayer game, and I called it Clicky.',
      url: 'https://clickygame.herokuapp.com/',
    },
    {
      name: 'jukebox',
      title: 'Jukebox',
      color: '#063547',
      icon: 'jukebox',
      description:
        'This app lets you stream music from your Spotify account for free by streaming the isolated audio from the Youtube-equivalent music videos. You can play and queue songs from your library, and the mp3 file will be streamed to the browser. It is no longer functional because of copyright issues and the YTDL dispute.',
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
          name: 'worxstr',
        },
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
  ],
}

export default new Vuex.Store({
  state,
  getters,
  actions,
  mutations,
})
