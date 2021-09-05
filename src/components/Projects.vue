<template lang='pug'>
  .projects.row
    
    router-link.project(
      v-for='(project, i) in projects'
      :index='i'
      :to="{ name: 'project', params: { name: project.name } }"
    )
      project-tile.m-r-15.m-b-15(:project='project')
      h6 {{ project.title }}
</template>

<script>
import { mapState } from 'vuex'
import ProjectTile from '@/components/ProjectTile.vue'

export default {
  name: 'projects',
  components: {
    ProjectTile
  },
  computed: {
    ...mapState(['projects']) 
  }
}
</script>

<style lang='scss'>

.projects {
  flex-wrap: wrap;
  
  .project {
    width: 110px;
  }
}
</style>