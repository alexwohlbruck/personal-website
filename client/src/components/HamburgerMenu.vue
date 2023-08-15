f<template lang="pug">
.hamburger-menu(v-if='!$route.meta.secondaryNav')
  button.icon.trigger-icon.p-a-0
    img(:src='require(`@/assets/svg/menu.svg`)' width='25' @click='openMenu')
    
  Transition(name='fade')
    .menu.col(v-if='menuOpen')
      button.icon.p-a-0.m-a-20
        img(:src='require(`@/assets/svg/close.svg`)' width='25' @click='closeMenu')

      .col.gap-15.align-center.justify-center.flex-1
        router-link.nav-item(
          v-for='(link, i) in links'
          :key='i'
          :to='{ name: link.to }'
          :class='{"text-accent": $router.currentRoute.name === link.to}'
        )
          Transition(name='fade' mode='out-in')
            h5(v-if='menuOpen' @click='closeMenuDelay')
              a.link(:to='{ name: link.to }') {{ link.name }}

</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'

@Component
export default class HamburgerMenu extends Vue {

  @Prop({ type: Array, required: true }) links!: any[]

  menuOpen: boolean = false

  openMenu() {
    this.menuOpen = true
  }

  closeMenu() {
    this.menuOpen = false
  }

  closeMenuDelay() {
    setTimeout(() => {
      this.closeMenu()
    }, 100)
  }
}
</script>

<style lang="scss">
@import '@/styles/variables.scss';
  
.hamburger-menu {
  width: 100px;

  .menu {
    position: fixed;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
    z-index: 3;

    background-color: $dark;
    border-right: 2px solid $accent;

    .nav-item.router-link-exact-active a {
      color: $accent;
    }
  }
}



</style>