<template lang="pug">
div(ref='target')
  transition(:appear='!onScroll' @before-enter='beforeEnter' @enter='enter')
    div(v-visible='!onScroll || animate' ref='container')
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
      default: 30,
    },
    duration: {
      type: Number,
      default: 1,
    },
    onScroll: {
      type: Boolean,
      default: false,
    },
    ease: {
      type: String,
      default: 'power4.out',
    },
  },
  methods: {
    beforeEnter(el) {
      const sign = this.direction === 'left' || this.direction === 'up' ? '-' : ''
      const axis = this.direction === 'left' || this.direction === 'right' ? 'X' : 'Y'
      el.style.transform = `translate${axis}(${sign}${this.shift}px)`
      console.log(el.style.transform)
      el.style.opacity = 0
    },

    enter(el, done) {
      gsap.to(el, {
        opacity: 1,
        transform: 'translate(0px, 0px)',
        duration: this.duration,
        delay: .1 + this.delay,
        onComplete: done,
        ease: this.ease
      })
    },
  },
}
</script>