<template lang="pug">
  .socials.col.align-flex-end(:class='{row}')
    router-link(
      v-for='(social, i) in socials'
      :key='i'
      to
      @click.native='navigate(social)'
      :class="{'col-reverse': row, 'row': !row }"
    )
      enter-transition(:delay='.1 * i + .1' direction='right' on-scroll)
        .social-link.row.align-center.m-y-20
          a.text.text-accent(:class='{absolute: row}') {{ social.text }}
          img(
            :class="{'m-l-15': !row, 'm-r-25': row}"
            :src='require(`@/assets/svg/${social.icon}.svg`)'
            width='30'
          )
</template>

<script>
import { contact } from '@/globals'
import EnterTransition from '@/components/transitions/EnterTransition.vue'

export default {
  name: 'socials',
  components: {
    EnterTransition,
  },
  props: {
    row: Boolean,
  },
  data: () => ({
    socials: [
      {
        text: 'Email',
        icon: 'at',
        to: {
          name: 'contact',
        },
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
        text: 'Twitter',
        icon: 'twitter',
        href: contact.twitter,
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
      {
        text: 'Strava',
        icon: 'strava',
        href: contact.strava,
      },
    ],
  }),
  methods: {
    navigate(social) {
      if (social.to) {
        this.$router.push(social.to)
      }
      if (social.href) {
        window.open(social.href, '_blank')
      }
    },
  },
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
      transform: translateY(40px);
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
        transform: translateY(30px);
      }
    }
  }
}
</style>