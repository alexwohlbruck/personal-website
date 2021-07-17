<template lang="pug">
  #intro
    h4.text-primary Hi, I'm
    h1 Alex
    h1 Wohlbruck,
    h4.text-primary
      | and I'm a {{ occupation }}
      span.cursor.accent
</template>

<script>
const occupations = [
  'web developer',
  'graphic designer',
  'photographer',
  'software engineer',
  'pianist',
  'cat owner',
  'cheese enthusiast',
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
