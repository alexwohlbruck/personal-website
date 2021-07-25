<template lang="pug">
  .socials.col.align-flex-end
    a.social-link.row.align-center.m-y-20(
      v-for='(social, i) in socials'
      :key='i'
      :href='social.href'
      target='_blank'
    )
      a.text.text-accent {{ social.text }}
      img.m-l-15(
        :src='require(`@/assets/svg/${social.icon}.svg`)'
        width='30'
      )
</template>

<script>
export default {
  name: 'socials',
  data: () => ({
    socials: [
      {
        text: 'alexwohlbruck@gmail.com',
        icon: 'at',
        href: 'mailto:alexwohlbruck@gmail.com',
      },
      {
        text: 'LinkedIn',
        icon: 'linkedin',
        href: 'https://linkedin.com/in/alexwohlbruck',
      },
      {
        text: 'Github',
        icon: 'github',
        href: 'https://github.com/alexwohlbruck',
      },
      {
        text: 'Instagram',
        icon: 'instagram',
        href: 'https://instagram.com/alexwohlbruck',
      },
      {
        text: 'Spotify',
        icon: 'spotify',
        href: 'https://open.spotify.com/user/alexwohlbruck',
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

    @media (max-width: $mobile-breakpoint) {
      display: none;     
    }
  }

  &:hover {
    .text {
      opacity: 1;
      transform: translateX(0);
    }
  }
}
</style>