<template lang="pug">
  .col.align-center
    section#home.row.align-center(ref='home')
      intro
      .spacer
      socials
    
    section#about(ref='about')
      p About

    section#work(ref='work')
      p My work

    section#contact(ref='contact')
      p Contact
</template>

<script>
// import { gsap } from 'gsap'
import { EventBus } from '@/event-bus'
import Intro from '@/components/Intro.vue'
import Socials from '@/components/Socials.vue'

let currentAnchor = ''

export default {
  name: 'Home',
  components: {
    Intro,
    Socials,
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

        const top = value.offsetTop, midpoint = (top + (value.offsetHeight) / 2)

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
  height: 100vh;
  width: 80%;
  max-width: 1200px;
}

.cursor {
  margin: 0 5px;
  width: 3px;
  display: inline-block;
  height: 1.1em;
  position: relative;
  top: 0.2em;
  animation: blink 1s infinite;
}
@keyframes blink {
  0% {
    opacity: 0;
    width: 1px;
    transform: translateX(0);
  }
  50% {
    opacity: 1;
    width: 3px;
    transform: translateX(-1px);
  }
  100% {
    opacity: 0;
    width: 1px;
    transform: translateX(0);
  }
}
</style>
