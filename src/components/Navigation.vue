<template lang="pug">
  #nav.row.justify-center
    h6.nav-item(
      v-for='link in links'
      :key='link.to'
      :class='link.class'
      v-scroll-to="{ el: `#${link.to}` }"
    )
      a(href='#') {{ link.name }}
</template>

<script lang="ts">
export default {
  name: 'navigation',
  data: () => ({
    links: [
      {
        name: 'Home',
        to: 'home',
        class: 'text-accent',
      },
      {
        name: 'About',
        to: 'about',
      },
      {
        name: 'Work',
        to: 'work',
      },
      {
        name: 'Contact',
        to: 'contact',
      },
    ],
  }),
}
</script>

<style lang="scss">
#nav {
  position: fixed;
  width: 100%;
}
.nav-item {
  display: inline;
  
  a {
    display: inline-block;
    padding: 50px;
  }
}

</style>
