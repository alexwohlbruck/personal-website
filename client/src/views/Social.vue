<template lang="pug">

section#social.primary(ref='social')
  flourish(color='#CEF1FF' placement='top')

  #social.container
    .section
      enter-transition(direction='up' on-scroll)
        h3 Follow me
        p.text-light You can reach me on these social platforms:
        socials(row)

    .section
      enter-transition(direction='up' on-scroll)
        spotify-playback

    .section
      ig-grid
</template>

<script>
import { Vue, Component } from 'vue-property-decorator'
import EnterTransition from '@/components/transitions/EnterTransition'
import Flourish from '@/components/Flourish' 
import SpotifyPlayback from '@/components/SpotifyPlayback'
import IgGrid from '@/components/IgGrid'
import Socials from '@/components/Socials.vue'

@Component({
  components: {
    EnterTransition,
    Flourish,
    SpotifyPlayback,
    IgGrid,
    Socials,
  }
})
export default class Social extends Vue {
}
</script>