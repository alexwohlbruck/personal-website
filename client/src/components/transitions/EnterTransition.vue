<template lang="pug">
div(ref='target')
  transition(:appear='!onScroll' @before-enter='beforeEnter' @enter='enter')
    div(v-visible='!onScroll || animate' ref='container')
      slot
</template>

<script>
import gsap from 'gsap'

export default {
  name: 'enterTransition',
  data: () => ({
    animate: false,
    afterStyle: {
      opacity: 1,
      transform: 'translate(0px, 0px)',
    }
  }),
  computed: {
    beforeStyle() {
      switch (this.transition) {
        case 'slide-fade': 
        default: 
          const sign = this.direction === 'left' || this.direction === 'up' ? '-' : ''
          const axis = this.direction === 'left' || this.direction === 'right' ? 'X' : 'Y'
          return {
            opacity: 0,
            transform: `translate${axis}(${sign}${this.shift}px)`
          }
      }
    },
  },
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
    transition: {
      type: String,
      default: 'slide-fade',
    },
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
      default: 15,
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
      for (const [key, value] of Object.entries(this.beforeStyle)) {
        el.style[key] = value
      }
    },

    enter(el, done) {
      const after = Object.keys(this.beforeStyle).reduce((obj, key) => {
        obj[key] = this.afterStyle[key]
        return obj
      }, {})

      gsap.to(el, {
        ...after,
        duration: this.duration,
        delay: .1 + this.delay,
        onComplete: done,
        ease: this.ease
      })
    },
  },
}
</script>