<template lang="pug">
.spotify-playback.row.align-center(v-if='spot && spot.item')
  .album.shadow-2
    img(
      :src="spot.item.album.images[1].url"
      :class="{playing: spot.is_playing}"
    )
  .col.justify-center.p-l-15
    .row.align-center.m-b-5
      img.m-r-5(
        :src='require(`@/assets/svg/spotify.svg`)'
        width='20'
      )
      p.m-b-2 Listening to
    h5.m-b-5 {{ spot.item.name }}
    p
      span(v-for="(artist, i) in spot.item.artists")
        | {{ artist.name }}
        span(v-if="i != spot.item.artists.length - 1") ,&nbsp;
</template>

<script>
import { mapState } from "vuex";
export default {
  name: "spotifyPlayback",
  mounted() {
    this.$store.dispatch("getSpotifyPlaybackState");
  },
  computed: {
    ...mapState({
      spot: (state) => state.spotifyPlaybackState,
    }),
  },
};
</script>

<style lang="scss">
@keyframes rotating {
  from {
    -webkit-transform: rotate(0deg);
  }
  to {
    -webkit-transform: rotate(360deg);
  }
}
$album-size: 80px;

.spotify-playback {
  .album {
    border-radius: 50%;
    width: $album-size;
    height: $album-size;

    img {
      border-radius: 50%;
      width: $album-size;
      height: $album-size;
    }
    
    img.playing {
      animation: rotating 1.8s linear infinite;
    }
  }
}
</style>