<template lang="pug">
  .socials.col.align-flex-end(:class='{row}')
    a.social-link.align-center.m-y-20(
      v-for='(social, i) in socials'
      :key='i'
      :href='social.href'
      target='_blank'
      :class="{'col-reverse': row, 'row': !row }"
    )
      slide-transition(:delay='.1 * i' direction='right' onScroll)
        a.text.text-accent(:class='{absolute: row}') {{ social.text }}
        img(
          :class="{'m-l-15': !row, 'm-r-25': row}"
          :src='require(`@/assets/svg/${social.icon}.svg`)'
          width='30'
        )
</template>

<script>
import { contact } from '@/globals'
import SlideTransition from '@/components/transitions/SlideTransition.vue'

export default {
  name: 'socials',
  components: {
    SlideTransition,
  },
  props: {
    row: Boolean,
  },
  data: () => ({
    socials: [
      {
        text: contact.email,
        icon: 'at',
        href: contact.mailto(),
      },
      {
        text: 'LinkedIn',
        icon: 'linkedin',
        href: contact.linkedin,
      },
      {
        text: 'Github',
        icon: 'github',
        href: contact.github,
      },
      {
        text: 'Instagram',
        icon: 'instagram',
        href: contact.instagram,
      },
      {
        text: 'Spotify',
        icon: 'spotify',
        href: contact.spotify,
      },
      {
        text: 'Musescore',
        icon: 'musescore',
        href: contact.musescore,
      },
    ],
  }),
}
</script>

<style lang='scss'>
@import '@/styles/variables.scss';


.social-link {
  .text {
    opacity: 0;
    transform: translateX(10px);
    transition: all .2s ease-in-out;

    &.absolute {
      position: absolute;
      transform: translate(calc(50% - 25px), 40px);
    }

    @media (max-width: $mobile-breakpoint) {
      display: none;     
    }
  }

  &:hover {
    .text {
      opacity: 1;
      transform: translateX(0);

      &.absolute {
        transform: translate(calc(50% - 25px), 30px);
      }
    }
  }
}
</style>