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
        .col
          h3.m-b-5.m-t-15(:class="darkText ? 'b' : 'w'") {{ project.title }}
          h6.text-primary
            | {{ project.start.getFullYear() }}
            span.text-primary(v-if='project.end')
              | &nbsp;- {{ project.end.getFullYear() }}

      p.m-y-15 {{ project.description }}

      p.caption
        a.text-primary(v-for='(tag, index) in project.tags')
          | {{ tag }}
          span(v-if='index != project.tags.length - 1') ,&nbsp;

      .m-y-15
        a.text-accent(
          v-if='project.url'
          :href="`${project.url}`"
          target='_blank'
        ) Visit site

        br

        a.text-accent(
          v-if='project.github'
          :href="`${project.github}`"
          target='_blank'
        ) View on GitHub
  
  .spacer

  .carousel.p-y-75(:style='`background-color: ${project.color}`')

    button(@click='carouselPrev') prev
    button(@click='carouselNext') next

    //- horizontal-scroll.container.scroll-x.p-y-75.row
    .thumbs-container(:style='`transform: translateX(${carouselOffset}`')
      img.thumb(
        v-for='(image, i) in project.images'
        :index='i'
        :src="require(`@/assets/portfolio/${project.name}/${image}`)"
        :class="{large: i == carouselIndex}"
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
  data: () => ({
    carouselIndex: 0,
  }),
  computed: {
    project() {
      return this.$store.getters.project(this.$route.params.name)
    },
    carouselOffset() {
      const thumbWidth = 50 // 50vw
      const margin = 10 // X margin between thumbs, 10vw
      const defaultOffset = 50 - thumbWidth / 2 
      const offset = defaultOffset - this.carouselIndex * (thumbWidth + margin)
      return `${offset}vw`
    }
  },
  methods: {
    carouselNext() {
      if (this.carouselIndex < this.project.images.length - 1) {
        this.carouselIndex++
      }
    },
    carouselPrev() {
      if (this.carouselIndex > 0) {
        this.carouselIndex--
      }
    },
  },
}
</script>

<style lang="scss">
@import '@/styles/variables.scss';

.work {
  // height: 100%;

  .icon {
    width: 90px;

    @media (min-width: $mobile-breakpoint) {
      width: 120px;
    }
  }

  $thumb-width: 50vw;
  $thumb-margin: 10vw;

  .carousel {

    overflow-x: hidden;
  }

  .thumbs-container {
    display: flex;
    flex-direction: row;
    align-items: center;
    width: 100%;
    transition: all cubic-bezier(.38,.01,.01,1) .4s;

    .thumb {
      width: $thumb-width;
      border-radius: 8px;
      margin-right: $thumb-margin;
      transition: all cubic-bezier(.38,.01,.01,1) .4s;

      &.large {
        transform: scale(1.2);
      }
    }
  }
}

</style>
