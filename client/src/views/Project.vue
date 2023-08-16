<template lang="pug">
.work.col
  
  .container.p-y-20.p-b-50
    
    //- Details
    .col
      //- Back button
      //- TODO: Change this to portal component
      a.back.m-b-15(@click='goBack')
        img(
          :src='require(`@/assets/svg/arrow-left.svg`)'
          width='30'
        )

      .row.align-center.m-y-30
        .icon.m-r-30
          project-tile(:project='project')
          
        .col
          enter-transition
            h3.m-b-5.m-t-15
              | {{ project.title }}

          enter-transition(:delay='.2')
            h6.text-primary
              | {{ startAndEndAreSameYear ? project.start.toLocaleString('default', { month: 'long' }) : project.start.getFullYear() }}
              span.text-primary(v-if='project.end')
                | &nbsp;- {{ startAndEndAreSameYear ? project.end.toLocaleString('default', { month: 'long' }) : project.end.getFullYear() }}
                span.text-primary(v-if='startAndEndAreSameYear') &nbsp;{{ project.end.getFullYear() }}

      enter-transition(direction='up' :delay='.2')
        p.m-y-15 {{ project.description }}

      enter-transition(direction='up' :delay='.3')
        .row.wrap.caption
          a.text-primary(v-for='(tag, index) in project.tags')
            | {{ tag }}
            span(v-if='index != project.tags.length - 1') ,&nbsp;

      enter-transition(direction='up' :delay='.4')
        .m-y-15.row.gap-15
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

  .project-images(:style='`background-color: ${project.color}`' v-if='project.images')
    .carousel.p-y-50(ref='carousel')
      //- enter-transition(
      //-   direction='right'
      //-   :delay='.2 * i'
      //-   :shift='100'
      //-   :duration='1.2'
      //- )
      img.shadow-3(
        v-for='(image, i) in project.images'
        :key='i'
        @click='thumbClick($event, i)'
        :src="require(`@/assets/portfolio/${project.name}/${image}`)"
      )
    

  //- Shared element transition: used for animating the image when opening it in the preview
  img#set.shadow-6(
    v-if='project.images'
    style='visibility: hidden'
    ref='set'
    :src="require(`@/assets/portfolio/${project.name}/${project.images[viewerIndex]}`)"
  )

  transition(v-if='project.images' name='fade')
    .image-viewer(v-show='selectedImage' @click='closeImageViewer')
      button#close(@click='closeImageViewer') X
      button#next(@click.stop='next' v-if='canNext' :class="{bottom: showButtonsAtBottom}") Next
      button#prev(@click.stop='prev' v-if='canPrev' :class="{bottom: showButtonsAtBottom}") Prev

      img#preview.shadow-6(
        @click.stop='test'
        ref='preview'
        :src="require(`@/assets/portfolio/${project.name}/${project.images[viewerIndex]}`)"
      )
</template>

<script>
import HorizontalScroll from 'vue-horizontal-scroll'
import ProjectTile from '@/components/ProjectTile.vue'
import EnterTransition from '@/components/transitions/EnterTransition.vue'

const transitionDuration = 300

export default {
  name: 'work',
  components: {
    ProjectTile,
    HorizontalScroll,
    EnterTransition,
  },
  data: () => ({
    carouselIndex: 0,
    viewerIndex: 0,
    selectedImage: null,
    mounted: false,
    previewOffset: 0,
  }),
  async mounted() {
    this.mounted = true

    this.$refs.carousel.addEventListener('scroll', this.carouselScroll);

    setTimeout(() => {
      this.$refs.carousel.scrollTo({
      left: 0,
      behavior: 'instant',
    })}, 100)
  },
  computed: {
    project() {
      return this.$store.getters.project(this.$route.params.name)
    },
    canNext() {
      return this.viewerIndex < this.project.images.length - 1
    },
    canPrev() {
      return this.viewerIndex > 0
    },
    showButtonsAtBottom() {
      return this.previewOffset ? this.previewOffset < 80 : false
    },
    startAndEndAreSameYear() {
      if (!this.project.end) return false
      return this.project.start.getFullYear() === this.project.end.getFullYear()
    }
  },
  methods: {
    goBack() {
      this.$router.go(-1)
    },
    carouselScroll() {
      const carousel = this.$refs.carousel
      const carouselCenter = carousel.scrollLeft + carousel.offsetWidth / 2
      const images = this.$refs.carousel.children
      const closest = [...images].reduce((prev, curr) => {
        return (Math.abs(curr.offsetLeft + curr.offsetWidth / 2 - carouselCenter) < Math.abs(prev.offsetLeft + prev.offsetWidth / 2 - carouselCenter) ? curr : prev)
      })
      this.carouselIndex = [...images].indexOf(closest)
    },
    scrollToIndex(i) {
      const img = this.$refs.carousel.children[i]
      const imageCenter = img.offsetLeft + img.offsetWidth / 2
      this.$refs.carousel.scrollTo({
        left: imageCenter - window.innerWidth / 2,
        behavior: 'smooth',
      })
    },
    next() {
      if (this.canNext) {
        this.viewerIndex++
        this.scrollToIndex(this.viewerIndex)
        this.computePreviewOffset()
      }
    },
    prev() {
      if (this.canPrev) {
        this.viewerIndex--
        this.scrollToIndex(this.viewerIndex)
        this.computePreviewOffset()
      }
    },
    async computePreviewOffset() {
      await this.$nextTick()
      this.previewOffset = this.$refs.preview.offsetLeft
    },
    thumbClick(e, clickedIndex) {
      if (clickedIndex == this.carouselIndex) {
        this.openImageViewer(clickedIndex)
      } else {
        this.scrollToIndex(clickedIndex)
      }
    },
    keydown(e) {
      if (e.keyCode == 37) {
        this.prev()
      }
      if (e.keyCode == 39) {
        this.next()
      }
      if (e.keyCode == 27) {
        this.closeImageViewer()
      }
    },
    setBoundingRect(el, to) {
      const { width, height, x, y } = to.getBoundingClientRect()

      el.style.width = `${width}px`
      el.style.height = `${height}px`
      el.style.top = `${y}px`
      el.style.left = `${x}px`
    },
    async animateToBoundingRect(el, from, to) {

      // Hide the element and reset the transform values
      // Hiding prevents animation from activating
      const prevDisplayValue = el.style.display
      el.style.display = 'none'
      el.style.transform = 'translate(0,0) scale(1)'
      this.setBoundingRect(el, from)

      el.style.display = prevDisplayValue

      const { width, height, x, y } = to.getBoundingClientRect()
      const { width: oldWidth, height: oldHeight, x: oldX, y: oldY } = from.getBoundingClientRect()

      // Calculate relative values
      const translateX = x - oldX
      const translateY = y - oldY
      const scaleX = width / oldWidth
      const scaleY = height / oldHeight

      el.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scaleX}, ${scaleY})`
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
    async openImageViewer(index) {
      this.viewerIndex = index;
      this.selectedImage = {
        src: this.project.images[this.viewerIndex],
      }
      const thumb = this.$refs.carousel.children[this.viewerIndex]
      const preview = this.$refs.preview
      const set = this.$refs.set

      // Set visibilities
      this.hide(preview)
      await this.delay(1)
      this.show(set)

      // Animate SET
      this.animateToBoundingRect(set, thumb, preview)
      await this.delay(transitionDuration)

      // Reset visibilities
      this.show(preview)
      this.hide(set)

      this.computePreviewOffset()
    },
    async closeImageViewer() {
      const thumb = this.$refs.carousel.children[this.viewerIndex]
      const preview = this.$refs.preview
      const set = this.$refs.set

      // Set visibilities
      this.show(set)
      this.hide(preview)
      this.selectedImage = null

      // Animate SET
      this.animateToBoundingRect(set, preview, thumb)
      await this.delay(transitionDuration)

      // Reset visibilities
      this.hide(set)
    },
  },
}
</script>

<style lang="scss">
@import '@/styles/variables.scss';

$thumb-height: 45dvw;
$thumb-margin: 4dvw;
$thumb-radius: 10px;
$transition-duration: 300ms;
$transition: all $smooth-ease $transition-duration, visibility 0ms;

.work {

  min-height: 100%;

  .back {
    position: relative;
    z-index: 3;
    width: fit-content;
  }

  .icon {
    width: 90px;

    @media (min-width: $mobile-breakpoint) {
      width: 120px;
    }
  }

  .carousel {
    display: flex;
    overflow-x: scroll;
    overflow-y: visible;
    scroll-snap-type: x mandatory;

    height: $thumb-height;
    transition: $transition;
    gap: $thumb-margin;
    padding-left: 50%;
    padding-right: 3%;
    scrollbar-width: none;
    -ms-overflow-style: none;

    &::-webkit-scrollbar { /* WebKit */
      width: 0;
      height: 0;
    }

    img {
      height: auto;
      scroll-snap-align: center;
      max-width: 80dvw;

      border-radius: $thumb-radius;
      cursor: pointer;
      opacity: 1;
      transition: $transition;
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

    #prev, #next {
      &.bottom {
        bottom: 0;
        top: auto;
      }
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
  transition: transform $smooth-ease $transition-duration;
  position: fixed;
  border-radius: $thumb-radius;
  transform-origin: top left;
  transform: translate(0, 0) scale(1);
}

</style>
