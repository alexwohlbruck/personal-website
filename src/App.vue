<template lang='pug'>
  #app.flex.col
    navigation
    router-view
</template>

<script lang='ts'>
import Navigation from '@/components/Navigation.vue'

export default {
  name: 'App',
  components: { Navigation },
}
</script>

<style lang="scss">
 #app {
   width: 100%;
 }
</style>