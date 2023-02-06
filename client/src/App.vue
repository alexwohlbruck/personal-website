<template lang='pug'>
  #app.flex
    navigation
    transition(name='crossfade' mode='out-in' @after-leave="$root.$emit('triggerScroll')")
      router-view

</template>

<script>
import Navigation from '@/components/Navigation.vue'
import Flourish from '@/components/Flourish.vue'
import Jumbo from '@/views/Jumbo.vue'

export default {
  name: 'App',
  components: {
    Navigation,
    Jumbo,
    Flourish,
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