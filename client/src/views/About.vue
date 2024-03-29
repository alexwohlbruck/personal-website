<template lang="pug">

section#about.primary(ref='about')
  flourish(color='#CEF1FF')

  .about.container
    .section
      img.profile-photo(:src='require(`@/assets/img/me.jpg`)')

    enter-transition(direction='up' on-scroll)
      .section
        h3 About me
        p.text-light I love designing and developing websites and web applications. I have a passion for clean, elegant and modern designs. I am a self-taught front-end developer and I am always learning new things.

    enter-transition(direction='up' on-scroll :delay='.1')
      .section
        h4 Skills
        p.text-light Here is a brief list of things I've learned and worked with. Click or tap for more info.

    .section.row-mobile.justify-space-between
      enter-transition(on-scroll :delay='.3')
        .col
          h6.m-b-0 Languages
          ul.col
            li.p-b-10(
              v-for='(language, i) in skills.languages' :key='i'
              @click='select(language)'
            )
              p.pointer(
                :class="selectedSkill && language.tag == selectedSkill.tag ? 'text-accent' : 'text-white'"
              ) {{ language.name }}

      enter-transition(on-scroll :delay='.5')
        .col
          h6.m-b-0 Tools and technologies
          ul.col
            li.p-b-10(
              v-for='(tool, i) in skills.tools' :key='i'
              @click='select(tool)'
            )
              p.pointer(
                :class="selectedSkill && tool.tag == selectedSkill.tag ? 'text-accent' : 'text-white'"
              ) {{ tool.name }}

      enter-transition(on-scroll :delay='.7')
          .col
            h6.m-b-0 High-level concepts
            ul.col
              li.p-b-10(
                v-for='(specialization, i) in skills.specializations' :key='i'
                @click='select(specialization)'
              )
                p.pointer(
                  :class="selectedSkill && specialization.tag == selectedSkill.tag ? 'text-accent' : 'text-white'"
                ) {{ specialization.name }}
      
    .section#skill-info.col.p-a-25(v-if='selectedSkill')
      .section-dense.row.align-center
        h5.m-r-25 {{ selectedSkill.name }}

        .col.m-b-5
          p.caption Proficiency
          progress-linear(
            :value='selectedSkill.proficiency'
            :max='10'
          )

      //- .section-dense
      //-   p.text-light {{ selectedSkill.description }}

      div(v-if='relatedProjects.length')
        h6 Related projects

        projects(
          :projects='relatedProjects'
          small
        )
</template>

<script>
import { mapState } from 'vuex'
import { MOBILE_BREAKPOINT } from '@/globals'
import Flourish from '@/components/Flourish.vue'
import Projects from '@/components/Projects'
import ProjectTile from '@/components/ProjectTile'
import ProgressLinear from '@/components/ProgressLinear'
import EnterTransition from '@/components/transitions/EnterTransition'

export default {
  name: 'about',
  components: {
    Flourish,
    ProjectTile,
    Projects,
    ProgressLinear,
    EnterTransition,
  },
  computed: {
    ...mapState(['skills']),
    relatedProjects() {
      return this.$store.state.projects.filter((project) =>
        project.tags.includes(this.selectedSkill.tag)
      )
    },
  },
  data: () => ({
    selectedSkill: null
  }),
  mounted() {
    this.select(this.skills.languages[0])
  },
  methods: {
    select(skill) {
      this.selectedSkill = skill
      if (window.innerWidth <= MOBILE_BREAKPOINT) {
        // TODO:
        // this.$scrollTo('#skill-info', { offset: -150 })
      }
    },
  },
}
</script>

<style lang="scss">
@import '@/styles/variables.scss';

$profile-photo-size: 150px;

.profile-photo {
  border-radius: 50%;
  border: $border-width solid $accent;
  width: $profile-photo-size;
  height: $profile-photo-size;
}

#skill-info {
  border: $border-width solid $accent;
  border-radius: $border-width;
}
</style>
