<template lang="pug">
  .contact.container
    form(@submit.prevent='sendMessage').col
      .section
        h3 Contact me
        p.text-light You can reach me on these social platforms:
        socials(row)

      input(
        type='text'
        required
        placeholder='Your name'
        v-model='name'
      )
      input(
        type='email'
        required
        placeholder='Your email'
        v-model='email'
      )
      textarea(
        required
        v-model='message'
        rows="8"
        placeholder="Enter a message"
      )

      .row
        .spacer
        button(type='submit') Send message
</template>

<script>
import { sendMessage } from '@/store/actions'
import Socials from '@/components/Socials.vue'

export default {
  name: 'Contact',
  components: {
    Socials
  },
  data: () => ({
    name: '',
    email: '',
    message: ''
  }),
  methods: {
    async sendMessage() {
      // Validate email address
      const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)

      if (!emailValid) {
        alert("invalid email")
        return
      }

      await sendMessage(this.$store, {
        name: this.name,
        email: this.email,
        message: this.message,
      })
    },
  },
}
</script>
