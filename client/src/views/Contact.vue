<template lang="pug">
section#contact.primary(ref='contact')
  flourish(color='#CEF1FF')
  
  .contact.container
    form(@submit.prevent='sendMessage').col
      .section
        h3 Contact me
        p.text-light You can reach me on these social platforms:
        socials(row)

      p.text-light.m-b-15 Or send me a message:
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
    
      availability#availability
</template>

<script>
import { sendMessage } from '@/store/actions'
import Flourish from '@/components/Flourish.vue'
import Socials from '@/components/Socials.vue'
import Availability from '@/components/Availability.vue'

export default {
  name: 'Contact',
  components: {
    Flourish,
    Socials,
    Availability,
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
        this.$toasted.show('Invalid email.')
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
