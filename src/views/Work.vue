<template lang="pug">
.work.col.container
  h3.m-b-50 My work

  h4.text-accent Stuff I've made
  projects.m-y-50

  h4.text-accent Experience
  timeline
    
</template>

<script>
import Timeline from '@/components/Timeline.vue'
import Projects from '@/components/Projects.vue'

export default {
  name: 'work',
  components: {
    Timeline,
    Projects,
  },
}
</script>
