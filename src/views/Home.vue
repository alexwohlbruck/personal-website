<template lang="pug">
  div
    navigation
    .col.align-stretch
      section#home.justify-center(ref='home')
        jumbo
      
      section#about.primary(ref='about')
        about

      section#work(ref='work')
        work

      //- section#contact.primary(ref='contact')
      //-   p Contact
</template>

<script>
// import { gsap } from 'gsap'
import { EventBus } from '@/event-bus'
import Jumbo from '@/views/Jumbo.vue'
import About from '@/views/About.vue'
import Work from '@/views/Work.vue'
import Navigation from '@/components/Navigation.vue'

let currentAnchor = ''

export default {
  name: 'Home',
  components: {
    Jumbo,
    About,
    Work,
    Navigation,
  },
  mounted() {
    this.calculateAnchor()
    window.addEventListener('scroll', this.calculateAnchor)
  },
  methods: {
    calculateAnchor() {
      const { scrollY } = window

      for (const [key, value] of Object.entries(this.$refs)) {
        if (!value) return

        const top = value.offsetTop, midpoint = (top + (value.offsetHeight) * .8)

        if (scrollY <= midpoint) {
          if (currentAnchor != key) {
            currentAnchor = key
            EventBus.$emit('clicked', key)
          }
          return
        }
      }
    },
  },
}
</script>

<style lang="scss">
section {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>
