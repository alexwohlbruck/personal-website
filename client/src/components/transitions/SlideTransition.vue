<template lang="pug">
  transition(appear @before-enter='beforeEnter' @enter='enter')
    slot
</template>

<script>
import gsap from 'gsap'

export default {
  name: '',
  props: {
    delay: {
      type: Number,
      default: 0,
    },
    direction: {
      type: String,
      default: 'left',
    },
    shift: {
      type: Number,
      default: 10,
    },
    duration: {
      type: Number,
      default: 1,
    },
  },
  methods: {
    beforeEnter(el) {
      el.style.opacity = 0

      const sign = this.direction === 'left' ? '-' : ''
      el.style.transform = `translatex(${sign}${this.shift}px)`
    },

    enter(el, done) {
      console.log('enter')
      gsap.to(el, {
        opacity: 1,
        transform: 'translateY(0px)',
        duration: this.duration,
        delay: .1 + this.delay,
        onComplete: done,
        ease: 'power4.out'
      })
    },
  },
}
</script>