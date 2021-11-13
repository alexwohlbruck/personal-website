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
          h3.m-b-5.m-t-15 {{ project.title }}
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

  .carousel.p-y-75(:style='`background-color: ${project.color}`' v-if='project.images')

    //- horizontal-scroll.container.scroll-x.p-y-75.row
    .thumbs-container(:style='`transform: translateX(${carouselOffset}`' ref='thumbs')
      img.thumb(
        v-for='(image, i) in project.images'
        :index='i'
        :src="require(`@/assets/portfolio/${project.name}/${image}`)"
        @click='thumbClick($event, i)'
        :class="{\
          large: i == carouselIndex,\
          'shadow-6': i == carouselIndex,\
          'shadow-3': i != carouselIndex,\
          hidden: i == carouselIndex && selectedImage,\
        }"
      )
  
  .image-viewer(v-show='selectedImage')
    button#close(@click='selectedImage = null') Close
    //- Shared element transition: used for animating the image when opening it in the preview
    img#set(
      ref='set'
      :src="require(`@/assets/portfolio/${project.name}/${project.images[carouselIndex]}`)"
    )

    img#preview(
      ref='preview'
      :src="require(`@/assets/portfolio/${project.name}/${project.images[carouselIndex]}`)"
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
    selectedImage: null,
  }),
  computed: {
    project() {
      return this.$store.getters.project(this.$route.params.name)
    },
    carouselOffset() {
      const thumbWidth = 40
      const margin = 8 // X margin between thumbs
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
    thumbClick(e, clickedIndex) {
      if (clickedIndex == this.carouselIndex) {
        this.openImageViewer()
      }
      if (clickedIndex == this.carouselIndex + 1) {
        this.carouselNext()
      }
      if (clickedIndex == this.carouselIndex - 1) {
        this.carouselPrev()
      }
    },
    setBoundingRect(el, rect) {
      const { width, height, x, y } = rect
      el.style.width = `${width}px`
      el.style.height = `${height}px`
      el.style.top = `${y}px`
      el.style.left = `${x}px`
    },
    show(el) {
      el.style.visibility = 'visible'
    },
    hide(el) {
      el.style.visibility = 'hidden'
    },
    openImageViewer() {
      this.selectedImage = {
        src: this.project.images[this.carouselIndex],
      }
      const thumb = this.$refs.thumbs.children[this.carouselIndex]
      const preview = this.$refs.preview
      const set = this.$refs.set

      this.show(set)
      this.hide(preview)

      this.setBoundingRect(set, thumb.getBoundingClientRect())
      setTimeout(() => {
        this.setBoundingRect(set, preview.getBoundingClientRect())

        setTimeout(() => {
          this.show(preview)
          this.hide(set)
        }, 1000)
      }, 1)
    }
  },
}
</script>

<style lang="scss">
@import '@/styles/variables.scss';

.work {
  .icon {
    width: 90px;

    @media (min-width: $mobile-breakpoint) {
      width: 120px;
    }
  }

  $thumb-width: 40vw;
  $thumb-margin: 8vw;
  $thumb-radius: 10px;
  $smooth-ease: all cubic-bezier(.38,.01,.01,1) .4s;

  .carousel {
    overflow-x: hidden;
  }

  .thumbs-container {
    display: flex;
    flex-direction: row;
    align-items: center;
    width: 100%;
    transition: $smooth-ease;

    .thumb {
      width: $thumb-width;
      border-radius: 10px;
      margin-right: $thumb-margin;
      transition: $smooth-ease;
      cursor: pointer;

      &.hidden {
        opacity: 0;
      }

      &.large {
        transform: scale(1.2);
      }
    }
  }

  .image-viewer {
    position: fixed;
    width: 100%;
    height: 100%;
    background-color: rgba(0,0,0,.4);
    display: flex;
    align-items: center;
    justify-content: center;

    #close {
      position: fixed;
      margin: 10px;
      top: 0;
      right: 0;
    }

    #set {
      transition: $smooth-ease;
      position: fixed;
      max-width: 100vw;
      max-height: 100vh;
      border-radius: $thumb-radius;
    }

    #preview {
      max-width: 90%;
      max-height: 90%;

      border-radius: $thumb-radius;
    }
  }
}

</style>
