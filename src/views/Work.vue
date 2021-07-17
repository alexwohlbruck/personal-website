<template lang='pug'>
  .work
    p(style='transform: translateY(300px)') {{ $route.params.work.title }}
</template>

<script>
  export default {
    name: 'work',
  }
</script>