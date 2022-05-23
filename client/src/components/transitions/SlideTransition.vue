<template lang="pug">
div(ref='target')
  transition(appear @before-enter='beforeEnter' @enter='enter')
    div(v-if='!onScroll || animate')
      slot
</template>

<script>
import gsap from 'gsap'

export default {
  name: '',
  data: () => ({
    animate: false,
  }),
  mounted() {
    // If onScroll is set, only play the animation when the item is in view
    if (this.onScroll) {
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.animate = true
            observer.unobserve(this.$refs.target)
          }
        })
      })
      observer.observe(this.$refs.target)
    }    
  },
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
    onScroll: {
      type: Boolean,
      default: false,
    },
  },
  methods: {
    beforeEnter(el) {
      el.style.opacity = 0

      const sign = this.direction === 'left' || this.direction === 'up' ? '-' : ''
      const axis = this.direction === 'left' || this.direction === 'right' ? 'X' : 'Y'
      el.style.transform = `translate${axis}(${sign}${this.shift}px)`
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