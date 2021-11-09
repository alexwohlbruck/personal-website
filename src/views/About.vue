<template lang="pug">
.about.container
  .m-b-20
    img.profile-photo(:src='require(`@/assets/img/me.jpg`)')

  .m-b-40
    h3 About me
    p.text-light I love designing and developing websites and web applications. I have a passion for clean, elegant and modern designs. I am a self-taught front-end developer and I am always learning new things.

  h4 Skills
  p.text-light Here is a brief list of things I've learned and worked with. Hover or tap for more info.

  .m-y-10.row-mobile.justify-space-between
    .col
      h6 Programming languages
      ul.col
        li.p-y-5(
          v-for='(language, i) in skills.languages' :key='i'
          @mouseover='select(language)'
        )
          p.text-accent.pointer {{ language.name }}

    .col
      h6 Tools and technologies
      ul.col
        li.p-y-5(
          v-for='(tool, i) in skills.tools' :key='i'
          @mouseover='select(tool)'
        )
          p.text-accent.pointer {{ tool.name }}

    .col
      h6 High-level concepts
      ul.col
        li.p-y-5(
          v-for='(specialization, i) in skills.specializations' :key='i'
          @mouseover='select(specialization)'
        )
          p.text-accent.pointer {{ specialization.name }}
    
  .col.skill-info.p-a-15(v-if='selectedSkill')
    .row.m-b-10.align-center
      h5.m-r-25 {{ selectedSkill.name }}

      .col.m-t-10
        p.caption Proficiency
        .progress-linear.m-t-5
          .p(:class='`p${selectedSkill.proficiency * 10}`')

    p.text-light {{ selectedSkill.description }}

    //- TOOD: Add links to projects related to the selected skill

</template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'about',
  computed: {
    ...mapState(['skills']),
  },
  data: () => ({
    selectedSkill: null,
  }),
  methods: {
    select(skill) {
      this.selectedSkill = skill
    },
  },
  mounted() {
    this.select(this.skills.languages[0])
  }
}
</script>

<style lang="scss">
@import '@/styles/variables.scss';

$profile-photo-size: 150px;
$border-width: 5px;

.profile-photo {
  border-radius: 50%;
  border: 7px solid $primary;
  outline: $border-width solid $accent;
  margin: 10px 0;
  width: $profile-photo-size;
  height: $profile-photo-size;
}

.skill-info {
  border: $border-width solid $accent;
  border-radius: $border-width;
}

$progress-height: $border-width;
.progress-linear {
  width: 70px;
  height: $progress-height;
  border-radius: $progress-height / 2; 
  background-color: $dark;
  margin-bottom: 10px;
  
  .p {
    background-color: $accent;
    height: 100%;
    border-radius: $progress-height / 2;
    
    $progress-amounts: (10,20,30,40,50,60,70,80,90,100);
    @each $progress-amount in $progress-amounts {
      &.p#{$progress-amount} {
        width: #{$progress-amount * 1%};
      }
    }
  }
  
}

</style>
