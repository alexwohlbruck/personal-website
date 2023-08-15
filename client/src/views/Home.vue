<template lang="pug">
  section#home.full-height.justify-center(ref='home')
    flourish
    jumbo
</template>

<script>
import Flourish from '@/components/Flourish.vue'
import Jumbo from '@/views/Jumbo.vue'

export default {
  name: 'Home',
  components: {
    Flourish,
    Jumbo,
  },
}
</script>

<style lang="scss">
  #home {
    overflow-y: hidden;
  }
</style>