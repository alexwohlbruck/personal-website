<template lang="pug">
  .project-tile
    .fill.shadow-2(:style='`background-color: ${project.color}`')
      img(:src='require(`@/assets/${project.icon}`)')
</template>

<script>
export default {
  name: 'projectTile',
  props: {
    project: Object,
  }
}
</script>

<style lang="scss">

.project-tile {
  .fill {
    width: 100%;
    height: 0;
    padding-bottom: 100%;
    position: relative;
    border-radius: 10px;
    justify-content: center;
    display: flex;
    align-items: center;

    img {
      width: 50%;
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
    }
  }
}
</style>