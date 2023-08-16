<template lang='pug'>
  .projects(:class='{centered}')
    
    router-link.project.m-b-15(
      v-for='(project, i) in projects'
      :key='i'
      :to="{ name: 'project', params: { name: project.name } }"
    )
      enter-transition(:delay='i * .04' direction='down' on-scroll :duration='.5')
        .flex.col.gap-10
          project-tile(:project='project')
          .m-r-10
            p(v-if='small') {{ project.title }}
            h6.m-b-0(v-else) {{ project.title }}
</template>

<script>
import ProjectTile from '@/components/ProjectTile.vue'
import EnterTransition from '@/components/transitions/EnterTransition.vue'

export default {
  name: 'projects',
  components: {
    ProjectTile,
    EnterTransition,
  },
  props: {
    projects: Array,
    small: Boolean,
    centered: Boolean,
  }
}
</script>

<style lang='scss'>

.projects {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
  grid-gap: 10px;

  &.centered {
    justify-items: center;
  }

  .project {
    width: 110px;
  }
}
</style>