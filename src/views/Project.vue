<template lang="pug">
.work.col
  
  .container.p-y-50
    
    //- Details
    .col
      //- Back button
      a.m-b-15(@click='$router.go(-1)')
        img(
          :src='require(`@/assets/svg/arrow-left.svg`)'
          width='30'
        )

      .row.align-center.m-y-15
        .icon.m-r-30
          project-tile(:project='project')
        h3(:class="darkText ? 'b' : 'w'") {{ project.title }}

      p.m-y-15 {{ project.description }}

      p.caption
        a.text-accent(v-for='(tag, index) in project.tags')
          | {{ tag }}
          span(v-if='index != project.tags.length - 1') ,&nbsp;

      a.text-accent.m-y-15(
        v-if='project.url'
        :href="`${project.url}`"
        target='_blank'
      ) Visit site
  
  .spacer

    //- Image thumbs
  div(:style='`background-color: ${project.color}`')
    horizontal-scroll.container.scroll-x.p-y-75.row
      img.thumb(
        v-for='(image, i) in project.images'
        :index='i'
        :src="require(`@/assets/portfolio/${project.name}/${image}`)"
      )
    


</template>

<script>
import HorizontalScroll from 'vue-horizontal-scroll'
import ProjectTile from '@/components/ProjectTile.vue'

export default {
  name: 'work',
  components: {
    ProjectTile,
    HorizontalScroll,
  },
  computed: {
    project() {
      return this.$store.getters.project(this.$route.params.name)
    },
  },
}
</script>

<style lang="scss">
@import '@/styles/variables.scss';

.work {
  height: 100%;

  .icon {
    width: 90px;

    @media (min-width: $mobile-breakpoint) {
      width: 120px;
    }
  }

  .thumb {
    height: 35vh;
    border-radius: 8px;
    margin-right: 30px;
  }
}

</style>
