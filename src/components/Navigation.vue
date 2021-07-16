<template lang="pug">
  #nav.row.justify-center
    router-link.nav-item(
      v-for='link in links'
      :key='link.to'
      :to='link.to'
    )
      h6 {{ link.name }}
</template>

<script lang="ts">
export default {
  name: 'navigation',
  data: () => ({
    links: [
      {
        name: 'Home',
        to: '#home',
      },
      {
        name: 'About',
        to: '#about',
      },
      {
        name: 'Work',
        to: '#work',
      },
      {
        name: 'Contact',
        to: '#contact',
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
  margin: 50px;
}
</style>
