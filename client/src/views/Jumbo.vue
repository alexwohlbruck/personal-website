<template lang='pug'>
.jumbo.full-height.row.align-center.container
  intro
  .spacer
  socials
</template>

<script>
import Intro from '@/components/Intro.vue'
import Socials from '@/components/Socials.vue'

export default {
  name: 'jumbo',
  components: {
    Intro,
    Socials,
  },
}
</script>