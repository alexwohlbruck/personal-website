<template lang='pug'>
  .projects.row
    
    router-link.project(
      v-for='(project, i) in projects'
      :index='i'
      :to="{ name: 'project', params: { name: project.name } }"
    )    
      .icon(:style='`background-color: ${project.color}`')
        img(:src='require(`@/assets/svg/${project.icon}.svg`)')

      h6 {{ project.title }}
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'projects',
  computed: {
    ...mapState(['projects']) 
  }
}
</script>

<style lang='scss'>
  
$tile-size: 110px;
$icon-size: 60%;
$tile-margin: #{$tile-size * .2};

.projects {
  flex-wrap: wrap;
}

.project {
  width: $tile-size;
  margin-right: $tile-margin;
  margin-bottom: $tile-margin;
  
  .icon {
    height: $tile-size;
    border-radius: 10px;
    justify-content: center;
    display: flex;
    align-items: center;
    margin-bottom: 15px;
  }
  
  img {
    width: $icon-size;
  }
}
</style>