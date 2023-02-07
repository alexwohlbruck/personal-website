<template lang="pug">
.nav
  .left(v-if='mobile')
    hamburger-menu(:links='links')

  .center(v-else)
    .navbar.row
      router-link.nav-item(
        v-for='(link, i) in links'
        :key='i'
        :to='{ name: link.to }'
      )
        enter-transition(:delay='.1 * i + .3' direction='up')
          a.text-h6.link.p-y-20.p-x-20 {{ link.name }}
</template>

<script>
import { Vue, Component } from 'vue-property-decorator'
import EnterTransition from '@/components/transitions/EnterTransition.vue'
import HamburgerMenu from '@/components/HamburgerMenu.vue'

import { MOBILE_BREAKPOINT } from '@/globals'

@Component({
  components: {
    EnterTransition,
    HamburgerMenu,
  },
})
export default class Navigation extends Vue {
  mobile = 0
  links = [
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
      name: 'Social',
      to: 'social',
    },
    {
      name: 'Contact',
      to: 'contact',
    },
  ]

  mounted() {
    window.addEventListener('resize', this.onResize)
    this.onResize()
  }

  onResize() {
    this.mobile = window.innerWidth <= MOBILE_BREAKPOINT
  }
}
</script>

<style lang="scss">
@import '@/styles/variables.scss';

.nav {
  .left, .center {
    padding: 20px;
    position: fixed;
    top: 0;
    z-index: 5;
  }

  .left {
    left: 0;
  }

  .center {
    left: 50%;
    transform: translateX(-50%);
  }

  .hamburger-menu {
    margin-right: auto;
  }

  .navbar {
    .nav-item {
      display: inline;
      cursor: pointer;

      &.router-link-exact-active a {
        color: $accent;
      }

      &:hover .link {
        color: $white;
      }
    }
  }
}

</style>
