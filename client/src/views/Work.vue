<template lang="pug">

section#work(ref='work')
  flourish
  flourish(placement='top')
  
  .work.col.container
    enter-transition(direction='down' :delay='.1' on-scroll)
      h3.m-b-50 My work

      h4.text-accent Things I've made
    projects.m-y-50(:projects='projects')

    h4.text-accent Experience
    timeline
    
</template>

<script>
import { mapState } from 'vuex'
import Flourish from '@/components/Flourish.vue'
import Timeline from '@/components/Timeline.vue'
import Projects from '@/components/Projects.vue'
import EnterTransition from '@/components/transitions/EnterTransition.vue'

export default {
  name: 'work',
  components: {
    Flourish,
    Timeline,
    Projects,
    EnterTransition,
  },
  computed: {
    ...mapState(['projects'])
  }
}
</script>
