<template lang="pug">
.ig-grid
  enter-transition(direction='up' on-scroll :delay='.1')
    a.row.align-center.m-b-20(:href='contact.instagram' target='_blank')
      img.m-r-10(:src="require(`@/assets/svg/instagram.svg`)", width="25")
      .col
        h5.m-b-0
          a.alt Latest photos
        a.caption.text-light Follow me on Instagram

  .grid
    a(
      v-for="(thumb, i) in igGrid"
      :key="i"
      :href="thumb.permalink"
      target="_blank"
    )
      enter-transition(:delay='.12 * i + .2' direction='right' on-scroll)
        .thumb.shadow-2(:style="{ backgroundImage: 'url(' + thumb.media_url + ')' }")
</template>

<script>
import { contact } from '@/globals'
import EnterTransition from '@/components/transitions/EnterTransition.vue'

export default {
  name: "IgGrid",
  components: {
    EnterTransition,
  },
  mounted() {
    this.$store.dispatch("getIgGrid");
  },
  data: () => ({
    contact,
  }),
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
      aspect-ratio: 1;
      object-fit: contain;
      transition: transform $smooth-ease 300ms;
      position: relative;
      z-index: 1;

      &:hover {
        z-index: 2;
        transform: scale(1.09);
      }
    }
  }
}
</style>