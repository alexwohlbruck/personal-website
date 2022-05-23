<template lang='pug'>
  #app.flex.color
    transition(name='crossfade' mode='out-in' @after-leave="$root.$emit('triggerScroll')")
      router-view
</template>

<script lang='ts'>
export default {
  name: 'App',
}
</script>

<style lang="scss">
 #app {
   width: 100%;
 }
</style>