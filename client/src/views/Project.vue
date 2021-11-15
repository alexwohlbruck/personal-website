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
        }"
      )
  

  //- Shared element transition: used for animating the image when opening it in the preview
  img#set.shadow-6(
    v-if='project.images'
    style='visibility: hidden'
    ref='set'
    :src="require(`@/assets/portfolio/${project.name}/${project.images[carouselIndex]}`)"
  )

  transition(v-if='project.images' name='fade')
    .image-viewer(v-show='selectedImage' @click='closeImageViewer')
      button#close(@click='closeImageViewer') X
      button#next(@click.stop='carouselNext' v-if='carouselCanNext') Next
      button#prev(@click.stop='carouselPrev' v-if='carouselCanPrev') Prev

      img#preview.shadow-6(
        @click.stop='test'
        ref='preview'
        :src="require(`@/assets/portfolio/${project.name}/${project.images[carouselIndex]}`)"
      )

    
</template>

<script>
import HorizontalScroll from 'vue-horizontal-scroll'
import ProjectTile from '@/components/ProjectTile.vue'

const transitionDuration = 300

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
  created() {
    window.addEventListener('keydown', this.keydown)
    if (this.$refs.thumbs)
      this.$refs.thumbs.addEventListener('wheel', e => console.log(e))
  },
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
    },
    carouselCanNext() {
      return this.carouselIndex < this.project.images.length - 1
    },
    carouselCanPrev() {
      return this.carouselIndex > 0
    },
  },
  methods: {
    test() {
      console.log('test')
    },
    carouselNext() {
      if (this.carouselCanNext) {
        this.carouselIndex++
      }
    },
    carouselPrev() {
      if (this.carouselCanPrev) {
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
    keydown(e) {
      if (e.keyCode == 37) {
        this.carouselPrev()
      }
      if (e.keyCode == 39) {
        this.carouselNext()
      }
      if (e.keyCode == 27) {
        this.closeImageViewer()
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
    async delay(duration) {
      return new Promise(resolve => setTimeout(resolve, duration))
    },
    async openImageViewer() {
      this.selectedImage = {
        src: this.project.images[this.carouselIndex],
      }
      const thumb = this.$refs.thumbs.children[this.carouselIndex]
      const preview = this.$refs.preview
      const set = this.$refs.set

      // Show shared element transition
      this.setBoundingRect(set, thumb.getBoundingClientRect())

      // Set visibilities
      this.hide(preview)
      this.show(set)
      await this.delay(1)

      // Animate SET
      this.setBoundingRect(set, preview.getBoundingClientRect())
      await this.delay(transitionDuration)

      // Reset visibilities
      this.show(preview)
      this.hide(set)
    },
    async closeImageViewer() {
      const thumb = this.$refs.thumbs.children[this.carouselIndex]
      const preview = this.$refs.preview
      const set = this.$refs.set

      // Set visibilities
      this.setBoundingRect(set, preview.getBoundingClientRect())
      this.show(set)
      await this.delay(10) // Wait for shared element transition to show
      this.hide(preview)
      this.selectedImage = null

      // Animate SET
      await this.delay(1)
      this.setBoundingRect(set, thumb.getBoundingClientRect())
      await this.delay(transitionDuration)

      // Reset visibilities
      this.hide(set)
    },
  },
}
</script>

<style lang="scss">
@import '@/styles/variables.scss';

$thumb-width: 40vw;
$thumb-margin: 8vw;
$thumb-radius: 10px;
$transition-duration: 300ms;
$transition: all $smooth-ease $transition-duration, visibility 0ms;

.work {
  .icon {
    width: 90px;

    @media (min-width: $mobile-breakpoint) {
      width: 120px;
    }
  }

  .carousel {
    overflow-x: hidden;
  }

  .thumbs-container {
    display: flex;
    flex-direction: row;
    align-items: center;
    width: 100%;
    transition: $transition;

    .thumb {
      width: $thumb-width;
      border-radius: 10px;
      margin-right: $thumb-margin;
      transition: $transition;
      opacity: 1;
      cursor: pointer;

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
    cursor: pointer;
    backdrop-filter: blur(8px);

    $margin: 10px;

    #close {
      position: fixed;
      margin: $margin;
      top: 0;
      right: 0;
    }

    #next {
      position: fixed;
      margin: $margin;
      top: 50%;
      transform: translateY(-50%);
      right: 0;
    }

    #prev {
      position: fixed;
      margin: $margin;
      top: 50%;
      transform: translateY(-50%);
      left: 0;
    }

    #close, #next, #prev {
      z-index: 10;
    }

    #preview {
      max-width: 90%;
      max-height: 90%;

      border-radius: $thumb-radius;
    }
  }
}

#set, #preview {
  z-index: 9;
  cursor: default;
}

#set {
  transition: $smooth-ease;
  position: fixed;
  border-radius: $thumb-radius;
}

</style>
