<template lang="pug">
.spotify-playback.row.align-center(v-if="spot && spot.item")
  .album.shadow-2
    img(
      :src="spot.item.album.images[1].url",
      :class="{ playing: spot.is_playing }"
    )
  .col.justify-center.m-l-15.m-t-15
    .row.align-center.m-b-5
      img.m-r-5(:src="require(`@/assets/svg/spotify.svg`)", width="18")
      a.caption.m-b-2(:href="contact.spotify", target="_blank") Check out my Spotify

    h5.m-b-0
      a.alt(:href="spot.item.external_urls.spotify", target="_blank") {{ spot.item.name }}
    p.caption.m-b-5
      a.alt(
        v-for="(artist, i) in spot.item.artists",
        :key="i",
        :href="spot.item.artists[i].external_urls.spotify",
        target="_blank"
      )
        | {{ artist.name }}
        span(v-if="i != spot.item.artists.length - 1") ,&nbsp;

    progress-linear(
      :value="spot.progress_ms + playbackProgress",
      :max="spot.item.duration_ms"
    )
</template>

<script>
import { mapState } from "vuex";
import ProgressLinear from "@/components/ProgressLinear";
import { contact } from "@/globals";

export default {
  name: "spotifyPlayback",
  components: {
    ProgressLinear,
  },
  data: () => ({
    playbackProgress: 0,
    contact,
  }),
  mounted() {
    this.$store.dispatch("getSpotifyPlaybackState");
    this.$nextTick(function () {
      window.setInterval(() => {
        if (this.spot && this.spot.is_playing) {
          this.playbackProgress += 1000;
        }
      }, 1000);
    });
  },
  computed: {
    ...mapState({
      spot: (state) => state.spotifyPlaybackState,
    }),
  },
  watch: {
    spot: {
      handler(newVal) {
        if (newVal.is_playing) {
          this.playbackProgress = 0;
        }
      },
    },
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
$album-size: 95px;

.spotify-playback {
  .album {
    border-radius: 50%;
    width: $album-size;
    height: $album-size;

    clip-path: path('M 48 47 m -69 0 a 69 69 0 1 0 138 0 a 69 69 0 1 0 -138 0 z M 48 47 m -6 0 a 6 6 0 0 1 12 0 a 6 6 0 0 1 -12 0 z');
    

    img {
      border-radius: 50%;
      width: $album-size;
      height: $album-size;
    }

    img.playing {
      animation: rotating 4s linear infinite;
    }
  }
}
</style>