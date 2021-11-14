<template lang="pug">
  .contact.container
    .col
      .section
        h3 Contact me
        p.text-light You can reach me on these social platforms:
        socials(row)
     
      textarea(
        v-model='message'
        rows="8"
        placeholder="Enter a message"
      )

      .row.m-t-20
        .section-dense
          p.caption.text-light This just opens your email client lol. I don't care if you're a robot.
        .spacer
        button(@click='openEmailClient') Send message
</template>

<script>
import { contact } from '@/globals'
import Socials from '@/components/Socials.vue'

export default {
  name: 'Contact',
  components: {
    Socials
  },
  data: () => ({
    message: ''
  }),
  methods: {
    openEmailClient() {
      window.open(contact.mailto(this.message))
    },
  },
}
</script>
