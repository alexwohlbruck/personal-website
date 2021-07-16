<template lang="pug">
  #intro
    h4.text-primary Hi, I'm
    h1.ma-0 Alex
    h1.ma-0 Wohlbruck,
    h4.text-primary
      | and I'm a {{ occupation }}
      span.cursor.accent
</template>

<script>
const occupations = [
  'web developer',
  'designer',
  'photographer',
  'pianist',
  'cat owner',
  'cheese enthusiast',
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
