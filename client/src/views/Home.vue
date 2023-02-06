<template lang="pug">
  section#home.justify-center(ref='home')
    flourish
    jumbo
</template>

<script>
import Navigation from '@/components/Navigation.vue'
import Flourish from '@/components/Flourish.vue'
import Jumbo from '@/views/Jumbo.vue'
import About from '@/views/About.vue'
import Work from '@/views/Work.vue'
import Contact from '@/views/Contact.vue'

export default {
  name: 'Home',
  components: {
    Navigation,
    Jumbo,
    About,
    Work,
    Contact,
    Flourish,
  },
}
</script>

<style lang="scss">
section {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 1;
}
</style>
