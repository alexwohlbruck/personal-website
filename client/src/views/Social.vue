<template lang="pug">

section#social.primary(ref='social')
  flourish(color='#CEF1FF')

  #social.container
    .section
      enter-transition(direction='up' on-scroll)
        h3 Follow me
        p.text-light You can reach me on these social platforms:
        socials.m-y-25(row)

    .section
      enter-transition(direction='up' on-scroll)
        spotify-playback

    .section
      ig-grid
</template>

<script>
import { Vue, Component } from 'vue-property-decorator'
import SpotifyPlayback from '@/components/SpotifyPlayback'
import IgGrid from '@/components/IgGrid'
import Socials from '@/components/Socials.vue'
import EnterTransition from '@/components/transitions/EnterTransition'

@Component({
  components: {
    EnterTransition,
    SpotifyPlayback,
    IgGrid,
    Socials,
  }
})
export default class Social extends Vue {
}
</script>