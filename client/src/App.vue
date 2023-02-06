<template lang='pug'>
  #app.flex.color
    transition(name='crossfade' mode='out-in' @after-leave="$root.$emit('triggerScroll')")
      div
        navigation
        .col.align-stretch
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
}
</script>

<style lang="scss">
 #app {
   width: 100%;
 }
</style>