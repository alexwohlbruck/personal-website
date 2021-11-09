<template lang="pug">
.about.container
  .m-b-20
    img.profile-photo(:src='require(`@/assets/img/me.jpg`)')

  .m-b-40
    h3.text-dark About me
    p I love designing and developing websites and web applications. I have a passion for clean, elegant and modern designs. I am a self-taught front-end developer and I am always learning new things.

  h4.text-accent Skills
  p Here is a brief list of things I've learned and worked with.

  .m-y-10.row.justify-space-between
    ul.col
      li(
        v-for='(language, i) in skills.languages' :key='i'
        @mouseover='select(language)'
      )
        h6.text-accent.pointer {{ language.name }}

    ul.col
      li(
        v-for='(tool, i) in skills.tools' :key='i'
        @mouseover='select(tool)'
      )
        h6.text-accent.pointer {{ tool.name }}

    ul.col
      li(
        v-for='(specialization, i) in skills.specializations' :key='i'
        @mouseover='select(specialization)'
      )
        h6.text-accent.pointer {{ specialization.name }}
  
  .col.skill-info.p-a-15(v-if='selectedSkill')
    .row.m-b-10.align-center
      h5.text-accent.m-r-25 {{ selectedSkill.name }}

      .col.m-t-10
        p.caption Proficiency
        .progress-linear.m-t-5
          .p(:class='`p${selectedSkill.proficiency * 10}`')

    p {{ selectedSkill.description }}

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
