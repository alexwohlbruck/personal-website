<template lang="pug">
.ig-grid
  .row.align-center.m-b-20
    img.m-r-10(:src="require(`@/assets/svg/instagram.svg`)" width='25')
    h5.m-b-0 Latest photos
  .grid
    .thumb.shadow-2(
      v-for="(thumb, i) in igGrid",
      :key="i",
      :style="{ backgroundImage: 'url(' + thumb.media_url + ')' }"
    )
</template>

<script>
import { mapState } from "vuex";

export default {
  name: "IgGrid",
  mounted() {
    this.$store.dispatch("getIgGrid");
  },
  computed: {
    ...mapState(["igGrid"]),
  },
};
</script>

<style lang="scss">
@import "@/styles/variables.scss";
$thumbSize: 150px;

.ig-grid {
  .grid {
    display: grid;
    gap: 10px;
    grid-template-columns: auto auto auto;

    @media screen and (min-width: $mobile-breakpoint) {
      grid-template-columns: auto auto auto auto;
    }
    @media screen and (min-width: $tablet-breakpoint) {
      grid-template-columns: auto auto auto auto auto;
    }

    .thumb {
      // width: $thumbSize;
      border-radius: 10px;
      background-size: cover;
      background-position: center;
      background-color: rgba(255, 255, 255, 0.8);
      aspect-ratio: 1;
      /*
      "contain" to see full original image with eventual empty space
      "cover" to fill empty space with truncating
      "fill" to stretch
    */
      object-fit: contain;
    }
  }
}
</style>