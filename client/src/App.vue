<template lang='pug'>
  #app.flex
    navigation
    transition(name='crossfade' mode='out-in' @after-leave="$root.$emit('triggerScroll')")
      router-view
</template>

<script>
import Navigation from '@/components/Navigation.vue'

export default {
  name: 'App',
  components: {
    Navigation,
  },
  watch: {
    $route (to) {
      document.querySelector('html').className = ''
      document.querySelector('html').classList.add(to.meta.color)
    }
  }
}
</script>

<style lang="scss">
 #app {
   width: 100%;
 }
</style>
