<template lang="pug">
.nav
  .left(v-if='mobile')
    hamburger-menu(:links='links' :delay='links.length * .1 + .2')

  .center(v-else)
    .navbar.row
      router-link.nav-item(
        v-for='(link, i) in links'
        :key='i'
        :to='{ name: link.to }'
      )
        enter-transition(:delay='.1 * i + .3' direction='up')
          a.text-h6.link.p-y-20.p-x-20 {{ link.name }}
  
  .right(
    @mouseenter='showLogout = true'
    @mouseleave='showLogout = false'
  )
    div(v-if='me && !showLogout')
      enter-transition(direction='up' :duration='.4')
        img.pfp(
          :src='me.pfp'
          width='25'
          height='25'
          referrerpolicy='no-referrer'
        )

    router-link(v-if='!me' :to='{ name: "signIn" }')
      enter-transition(:delay='links.length * .1 + .4' direction='up')
        button.icon.trigger-icon.p-a-0
          img(:src='require(`@/assets/svg/login.svg`)' width='25')
          
    router-link(v-if='me && showLogout' :to='{ name: "signOut" }')
      enter-transition(direction='up')
        button.icon.trigger-icon.p-a-0
          img(:src='require(`@/assets/svg/logout.svg`)' width='25')
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
  showLogout = false
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

  get me() {
    return this.$store.state.me
  }
}
</script>

<style lang="scss">
@import '@/styles/variables.scss';

.nav {
  .pfp {
    border-radius: 50%;
  }

  .left, .center, .right {
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

  .right {
    right: 0;
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
