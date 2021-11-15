<template lang="pug">
.ig-grid
  .row.align-center.m-b-20
    img.m-r-10(:src="require(`@/assets/svg/instagram.svg`)", width="25")
    h5.m-b-0 Latest photos
  .grid
    a.thumb.shadow-2(
      v-for="(thumb, i) in igGrid",
      :key="i",
      :style="{ backgroundImage: 'url(' + thumb.media_url + ')' }",
      :href="thumb.permalink",
      target="_blank"
    )
</template>

<script>
export default {
  name: "IgGrid",
  mounted() {
    this.$store.dispatch("getIgGrid");
  },
  computed: {
    igGrid() {
      return this.$store.state.igGrid?.slice(0, 10);
    },
  },
};
</script>

<style lang="scss">
@import "@/styles/variables.scss";
$gap: 10px;

.ig-grid {
  .grid {
    display: grid;
    gap: $gap;
    grid-template-columns: auto auto auto auto auto;

    @media screen and (min-width: $mobile-breakpoint) and (max-width: $tablet-breakpoint) {
      grid-template-columns: auto auto auto auto;
      // Show 8 images
      .thumb:nth-child(n + 9) {
        display: none;
      }
    }

    @media screen and (max-width: $mobile-breakpoint) {
      grid-template-columns: auto auto auto;
      // Show 9 images
      .thumb:nth-child(n + 10) {
        display: none;
      }
    }


    .thumb {
      border-radius: 10px;
      background-size: cover;
      background-position: center;
      background-color: rgba(255, 255, 255, 0.8);
      aspect-ratio: 1;
      object-fit: contain;
    }
  }
}
</style>