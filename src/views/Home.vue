<template lang="pug">
  #home.flex.row.justify-center
    .section.flex.row.align-center
      .col
        h4.text-primary Hi, I'm
        h1.ma-0 Alex
        h1.ma-0 Wohlbruck.
        h4.text-primary I'm a web developer.

      .spacer

      .col
        a.social-link(href='' v-for='social in socials' :key='social')
          img(:src='require(`@/assets/svg/${social.name}.svg`)' width='30')
</template>

<script>
export default {
  name: 'Home',
  data: () => ({
    socials: [
      {
        name: 'at',
        href: 'mailto:alexwohlbruck@gmail.com'
      },
      {
        name: 'linkedin',
        href: 'https://linkedin.com/in/alexwohlbruck'
      },
      {
        name: 'github',
        href: 'https://github.com/alexwohlbruck'
      },
      {
        name: 'instagram',
        href: 'https://instagram.com/alexwohlbruck'
      },
    ],
  }),
}
</script>

<style lang="scss">
.section {
  height: 100vh;
  width: 80%;
  max-width: 1200px;
}

.social-link {
  margin: 10px 0;
}
</style>
