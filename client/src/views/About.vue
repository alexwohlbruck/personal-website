<template lang="pug">
.about.container
  .section
    img.profile-photo(:src='require(`@/assets/img/me.jpg`)')

  .section
    h3 About me
    p.text-light I love designing and developing websites and web applications. I have a passion for clean, elegant and modern designs. I am a self-taught front-end developer and I am always learning new things.

  .section
    h4 Skills
    p.text-light Here is a brief list of things I've learned and worked with. Click or tap for more info.

  .section.row-mobile.justify-space-between
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

    .section-dense
      p.text-light {{ selectedSkill.description }}

    div(v-if='relatedProjects.length')
      h6 Related projects

      projects(
        :projects='relatedProjects'
        small
      )

  .section
    h4 Social
    spotify-playback

  .section
    ig-grid
</template>

<script>
import { mapState } from 'vuex'
import { BREAKPOINT_SIZE } from '@/globals'
import Projects from '@/components/Projects'
import ProjectTile from '@/components/ProjectTile'
import ProgressLinear from '@/components/ProgressLinear'
import SpotifyPlayback from '@/components/SpotifyPlayback'
import IgGrid from '@/components/IgGrid'

export default {
  name: 'about',
  components: {
    ProjectTile,
    Projects,
    ProgressLinear,
    SpotifyPlayback,
    IgGrid,
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
    selectedSkill: null,
  }),
  methods: {
    select(skill) {
      this.selectedSkill = skill
      if (window.innerWidth <= BREAKPOINT_SIZE) {
        this.$scrollTo('#skill-info', { offset: -150 })
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
