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
        name: 'JavaScript',
        proficiency: 10,
        description:
          'The first programming lanuage I learned, and the one I have most experience with. I have a love-hate relationship with JS, but TypeScript has come to save the day.',
      },
      {
        name: 'TypeScript',
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
      {
        name: 'Vue.js',
        proficiency: 10,
        description:
          'Vue has always been my favorite javascript framework since I first tried it after coming from Angular.js. It has been my framework of choice for most of my projects, including this website.',
      },
      {
        name: 'React',
        proficiency: 7,
        description:
          "I have used React in some open source contributions and I tried my hand with it a number of times. Although I have not used it for a major project, I am fairly familiar with it's paradigms and design patterns.",
      },
      {
        name: 'Node.js',
        proficiency: 10,
        description:
          'When I began learning web development, I started out with PHP, but quickly got annoyed with it. Node.js was my next choice and I love using it to this day. Usually my preferred language for my web backends.',
      },
      {
        name: 'Flutter',
        proficiency: 5,
        description:
          'Flutter has always fascinated me, and although I have not had the time yet to sink some good hours into learning it all, I have dabbled with Flutter in some hackathons I attended. Hoping to learn more soon.',
      },
      {
        name: 'Git',
        proficiency: 9,
        description:
          "Being an essential tool for programming teams, I am very familiar with the Git workflow, although some of it's more advanced commands are still out of my reach.",
      },
      {
        name: 'MongoDB',
        proficiency: 9,
        description:
          "MongoDB has been my favorite database to use since I came across it the first time. It gives me flexibility that SQL databases don't while still able to perform complex lookup and join features.",
      },
      {
        name: 'MySQL',
        proficiency: 7,
        description:
          "This is the type of SQL database I have used before. I am familiar and comfortable with basic relational database design and querying, though I haven't tried many of it's advanced features.",
      },
      {
        name: 'Firebase',
        proficiency: 8,
        description:
          "The Firebase suite has always been fun to work with with it's realtime database and plug-n-play libraries. Although it can be limiting sometimes, it is a very fun tool to use for my projects.",
      },
      {
        name: 'Photoshop',
        proficiency: 10,
        description:
          'I started playing around in Photoshop around when I was in middle school. Learning to use Photoshop is what got me interested in graphic design, and then later web design and programming. I have used this tool the longest out of everything else listed here.',
      },
      {
        name: 'Illustrator',
        proficiency: 9,
        description:
          'Shortly after learning to use Photoshop, I also began learning Illustrator for designing vector graphics. This has been an invaluable skill to this day for me when creating graphics and mockups for my website and app designs.',
      },
      {
        name: 'Adobe XD',
        proficiency: 8,
        description:
          'I began using XD along with Figma occasionally for UI mockups around when they were first released. I have come to love these tools since they provide much better features for UI prototyping than something like Illustrator.',
      },
    ],
    specializations: [
      {
        name: 'Client-side development',
        proficiency: 10,
        description:
          'This is what I do best. Front-end web development has always been what I have considered my best skill. Although I am always wanting to dive in to other areas of programming, this has always been my special power.',
      },
      {
        name: 'Server-side development',
        proficiency: 9,
        description:
          'The other half of web development, backend programming is also in my toolbelt by default. I have extensive experience programming web backends in Node.js, Python, and some PHP.',
      },
      {
        name: 'Cross-platform/hybrid apps',
        proficiency: 9,
        description:
          'In addition to messing around with Flutter occasionally, I have also shipped JavaScript-based mobile apps to iOS and Android using the Capacitor framework. Not only was I able to target multiple platforms with one codebase, but the native apps perform well and hardly feel out of place in their respective operating systems, even integrating with native system APIs.',
      },
      {
        name: 'Web API design',
        proficiency: 10,
        description:
          'I have had many runs at designing web APIs to have my client code communicate with a backend server. I am proficient in REST API concepts, as well as using Socket.io for real-time data communication. Check out my project Cat Facts, which has a public API for accessing random facts about cats and other animals.',
      },
      {
        name: 'Graphic design',
        proficiency: 9,
        description:
          'When I first learned Photoshop, it started my lifelong passion for graphic design. Before I learned to code, I wanted to major in it in college. I have designed countless logos, graphic art, and UI mockups over the years.',
      },
      {
        name: 'UX design',
        proficiency: 9,
        description:
          'When I am making my apps, I always keep the user experience at the center of my process. I aim to create beautiful but also intuitive interfaces that pack a list of required features naturally into the viewport, with fluid animations and delightful interactions.',
      },
      {
        name: 'IoT',
        proficiency: 8,
        description:
          'In addition to programming, I also love smart home tech. I got my Home Assistant rig set up a couple of years ago and I have had a lot of fun using sensors and other devices to control my home automation system.',
      },
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
