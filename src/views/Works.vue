<template lang="pug">
.col.works
  .container
    h2 My work
  
  .works-list.row.p-l-75.m-t-50
    router-link.work.m-r-50(
      v-for='(work, i) in portfolio'
      :key='i'
      :to="{ name: 'work', params: { name: work.name, work }}"
    )
      img(:src='require(`../assets/portfolio/${work.name}/thumb.png`)' width='300')
      
      h4.p-y-15.bold {{ work.title }}
      p.p-y-15 {{ work.description }}
      p.p-y-15.opacity-6 {{ work.date.start }} - {{ work.date.end }}
</template>

<script>
export default {
  name: 'works',
  data: () => ({
    portfolio: [
      {
        name: 'worxstr',
        title: 'Worxstr',
        description:
          'I am designing and developing the web frontend and mobile app for Worxstr, a labor management platform.',
        date: {
          start: 'Dec 2020',
          end: 'Present',
        },
        url: 'https://worxstr.com',
      },
      {
        name: 'worxstr',
        title: 'Worxstr',
        description:
          'I am designing and developing the web frontend and mobile app for Worxstr, a labor management platform.',
        date: {
          start: 'Dec 2020',
          end: 'Present',
        },
        url: 'https://worxstr.com',
      },
      {
        name: 'worxstr',
        title: 'Worxstr',
        description:
          'I am designing and developing the web frontend and mobile app for Worxstr, a labor management platform.',
        date: {
          start: 'Dec 2020',
          end: 'Present',
        },
        url: 'https://worxstr.com',
      },
      {
        name: 'worxstr',
        title: 'Worxstr',
        description:
          'I am designing and developing the web frontend and mobile app for Worxstr, a labor management platform.',
        date: {
          start: 'Dec 2020',
          end: 'Present',
        },
        url: 'https://worxstr.com',
      },
      {
        name: 'worxstr',
        title: 'Worxstr',
        description:
          'I am designing and developing the web frontend and mobile app for Worxstr, a labor management platform.',
        date: {
          start: 'Dec 2020',
          end: 'Present',
        },
        url: 'https://worxstr.com',
      },
    ],
  }),
}
</script>

<style lang="scss">
.works-list {
  overflow-x: scroll;
}

.work {
  img {
    border-radius: 5px;
  }
}
</style>
