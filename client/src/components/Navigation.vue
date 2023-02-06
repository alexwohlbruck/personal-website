<template lang="pug">
  #nav.row.justify-center
    router-link.nav-item(
      v-for='(link, i) in links'
      :key='i'
      :to='{ name: link.to }'
    )
      enter-transition(:delay='.1 * i + .3' direction='up')
        h6
          a.p-y-20.p-x-20(href='' :class="`${link.to == currentAnchor ? 'text-accent' : ''}`") {{ link.name }}
      
</template>

<script>
import { EventBus } from '@/event-bus'
import EnterTransition from '@/components/transitions/EnterTransition.vue'

export default {
  name: 'navigation',
  components: {
    EnterTransition,
  },
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
        name: 'My work',
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
@import '@/styles/variables.scss';

#nav {
  position: fixed;
  width: 100%;
  z-index: 2;

  // &:before {
  //   content: '';
  //   position: absolute;
  //   z-index: -1;
  //   top: 0;
  //   left: 0;
  //   width: 100%;
  //   height: 300%;
  //   background-color: $dark;
  //   -webkit-mask-image: -webkit-gradient(linear, center 35%, center bottom, 
  //   from(rgba(0,0,0,1)), to(rgba(0,0,0,0)));
  // }
}
.nav-item {
  display: inline;
  cursor: pointer;

  &:hover {
    a {
      color: $white;
    }
  }
  
  a {
    display: inline-block;
  }
}

</style>
