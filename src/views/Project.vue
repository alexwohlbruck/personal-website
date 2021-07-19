<template lang='pug'>
.work(:style='`background-color: ${project.color}`')
  
  .row.align-center.p-x-20.p-y-50
    
    //- Back button
    h3.m-x-20
      a(@click='$router.go(-1)') <

    //- Icon
    img.m-r-30(
      :src="require(`@/assets/svg/${project.icon}.svg`)"
      width='80'
    )

    //- Details
    .col
      h3(:class="darkText ? 'b' : 'w'") {{ project.title }}

      p.m-y-10 {{ project.description }}

      a(
        v-if='project.url'
        :href="`${project.url}`"
        target='_blank'
      ) Visit site

  //- Image carousel
  div
    img(
      v-for='(image, i) in project.images'
      :index='i'
      :src="require(`@/assets/portfolio/${project.name}/${image}`)"
      width='500' 
    )

</template>

<script>
export default {
  name: 'work',
  computed: {
    project() {
      return this.$store.getters.project(this.$route.params.name)
    },

    // Compute text color based on background
    darkText(){
      const hexcolor = this.project.color.replace("#", "");
      var r = parseInt(hexcolor.substr(0,2),16);
      var g = parseInt(hexcolor.substr(2,2),16);
      var b = parseInt(hexcolor.substr(4,2),16);
      var yiq = ((r*299)+(g*587)+(b*114))/1000;
      return yiq >= 128;
    }
  }
}
</script>

<style lang='scss'>
.work {
  height: 100%;
}
.w {
  color: white;
}
.b {
  color: black;
}
</style>