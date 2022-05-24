<template lang="pug">
  #intro
    slide-transition(direction='up' :delay='.2')
      h4.text-primary Hi, I'm

    slide-transition(direction='up' :delay='.3')
      h2 Alex
        br
        | Wohlbruck,
      
    slide-transition(direction='up' :delay='.4')
      h4.text-primary.line-2
        | and I'm a {{ occupation }}
        span.cursor.accent
</template>

<script>
import SlideTransition from '@/components/transitions/SlideTransition.vue'

const occupations = [
  'web developer',
  'graphic designer',
  'photographer',
  'software engineer',
  'student',
  'pianist',
  'cat owner',
  'cheese lover',
  'techie',
]
const typingSpeed = 60,
  readWait = 1500,
  emptyWait = 200

async function timeout(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export default {
  name: 'intro',
  components: {
    SlideTransition,
  },
  async mounted() {
    for (let i = 0; true; i++) {
      await this.writeWord(occupations[i % occupations.length])
    }
  },
  data: () => ({
    occupation: '',
  }),
  methods: {
    async backspace() {
      this.occupation = this.occupation.slice(0, -1)
    },
    async type(character) {
      this.occupation += character
    },
    async writeWord(word) {
      const arr = (word + '.').split('')

      // Type characters
      for (const character of arr) {
        this.type(character)
        await timeout(typingSpeed)
      }

      // Wait so user can read
      await timeout(readWait)

      // Backspace characters
      for (const character of arr) {
        this.backspace()
        await timeout(typingSpeed)
      }

      await timeout(emptyWait)
    },
  },
}
</script>

<style lang="scss">
$cursor-width: 3.5px;

.cursor {
  margin: 0 5px;
  width: $cursor-width;
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
    width: $cursor-width;
    transform: translateX(-1px);
  }
  100% {
    opacity: 0;
    width: 1px;
    transform: translateX(0);
  }
}

.line-2 {
  height: 2em;
}

</style>
