<template lang='pug'>
.jumbo.full-height.row.align-center.container
  intro.left
  socials.right
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

<style lang='scss'>
.jumbo {
  .left {
    flex: 4;
  }
  .right {
    flex: 1;
  }
}
</style>