<template lang="pug">
  #intro.m-t-35
    enter-transition(direction='up' :delay='.2')
      h4.text-primary Hi, I'm

    enter-transition(direction='up' :delay='.3')
      h2 Alex
        br
        | Wohlbruck,
      
    enter-transition(direction='up' :delay='.4')
      h4.text-primary.line-2
        | and I'm a{{ occupation }}
        span.cursor.accent
</template>

<script>
import EnterTransition from '@/components/transitions/EnterTransition.vue'

function log(data) {
  console.log({log: data})
}

const occupations = [
  'web developer',
  'graphic designer',
  'photographer',
  'software engineer',
  'pianist',
  'cat owner',
  'urbanist',
  'cheese lover',
  'nerd',
  'musician',
  'environmentalist',
  'programmer',
  'designer',
  'coffee shop frequenter',
  'traveler',
  'cyclist',
  'techie',
  'problem solver',
]
// We don't include the shared letter 'a' since this part doesn't have to be retyped
const articles = {
  a: ' ',
  an: 'n ',
}
const typingSpeed = 60,
  readWait = 1500,
  emptyWait = 200

async function timeout(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export default {
  name: 'intro',
  components: {
    EnterTransition,
  },
  data: () => ({
    occupation: '',
    lastArticle: null,
  }),
  async mounted() {
    this.lastOccupation = this.occupation
    this.occupation = '  ' // Start with buffer to be backspaced

    for (let i = 0; true; i++) {
      await this.sequence(occupations[i % occupations.length])
    }
  },
  methods: {
    async backspace() {
      this.occupation = this.occupation.slice(0, -1)
    },

    async type(character) {
      this.occupation += character
    },

    article(word) {
      const isVowelWord = ['a', 'e', 'i', 'o', 'u'].includes(word[0])
      return isVowelWord ? articles.an : articles.a
    },

    async typeWord(word, backspace = false) {
      const charArray = word.split('')
      for (const character of charArray) {
        if (backspace) {
          await this.backspace()
        } else {
          await this.type(character)
        }
        await timeout(typingSpeed)
      }
    },

    async backspaceWord(word) {
      // Accept a number length to backspace
      if (typeof word === 'number') {
        word = '.'.repeat(word)
      }
      await this.typeWord(word, true)
    },

    async sequence(occupation) {
      const word = `${occupation}.`
      log(word)
      const article = this.article(occupation)
      const retypeArticle = this.article(this.lastOccupation) !== article
      const articleBackspaceCount = retypeArticle
        ? (article === articles.a ? 2 : 1)
        : 0

      await this.backspaceWord(this.lastOccupation.length + 1)
      await this.backspaceWord(articleBackspaceCount)
      await timeout(emptyWait)

      if (retypeArticle) await this.typeWord(article)
      await this.typeWord(word)
      await timeout(readWait)

      this.lastOccupation = occupation
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
