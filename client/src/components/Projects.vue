<template lang='pug'>
  .projects.row
    
    router-link.project.m-b-15(
      v-for='(project, i) in projects'
      :key='i'
      :to="{ name: 'project', params: { name: project.name } }"
      :class='{small}'
    )
      project-tile.m-r-15.m-b-15(:project='project')
      .m-r-10
        p(v-if='small') {{ project.title }}
        h6(v-else) {{ project.title }}
</template>

<script>
import ProjectTile from '@/components/ProjectTile.vue'

export default {
  name: 'projects',
  components: {
    ProjectTile
  },
  props: {
    projects: Array,
    small: Boolean,
  }
}
</script>

<style lang='scss'>

.projects {
  flex-wrap: wrap;
  
  .project {
    width: 120px;

    &.small {
      width: 100px;
    }
  }
}
</style>