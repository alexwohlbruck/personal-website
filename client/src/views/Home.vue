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

      section#contact.primary(ref='contact')
        contact

    .footnote
      p !!! This site is still under construction. Come back soon for more :)
</template>

<script>
// import { gsap } from 'gsap'
import { EventBus } from '@/event-bus'
import Navigation from '@/components/Navigation.vue'
import Jumbo from '@/views/Jumbo.vue'
import About from '@/views/About.vue'
import Work from '@/views/Work.vue'
import Contact from '@/views/Contact.vue'

let currentAnchor = ''

export default {
  name: 'Home',
  components: {
    Navigation,
    Jumbo,
    About,
    Work,
    Contact,
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

.footnote {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 1rem;
  text-align: center;
  font-style: italic;
  font-size: .8rem;
  font-weight: 300;
  color: white;
  opacity: .5;
}
</style>
