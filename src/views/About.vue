<template lang="pug">
.about.container
  .section
    img.profile-photo(:src='require(`@/assets/img/me.jpg`)')

  .section
    h3 About me
    p.text-light I love designing and developing websites and web applications. I have a passion for clean, elegant and modern designs. I am a self-taught front-end developer and I am always learning new things.

  .section
    h4 Skills
    p.text-light Here is a brief list of things I've learned and worked with. Hover or tap for more info.

  .section.row-mobile.justify-space-between
    .col
      h6.m-b-0 Languages
      ul.col
        li.p-b-10(
          v-for='(language, i) in skills.languages' :key='i'
          @mouseover='select(language)'
        )
          p.text-accent.pointer {{ language.name }}

    .col
      h6.m-b-0 Tools and technologies
      ul.col
        li.p-b-10(
          v-for='(tool, i) in skills.tools' :key='i'
          @mouseover='select(tool)'
        )
          p.text-accent.pointer {{ tool.name }}

    .col
      h6.m-b-0 High-level concepts
      ul.col
        li.p-b-10(
          v-for='(specialization, i) in skills.specializations' :key='i'
          @mouseover='select(specialization)'
        )
          p.text-accent.pointer {{ specialization.name }}
    
  .col.skill-info.p-a-15(v-if='selectedSkill')
    .section-dense.row.align-center
      h5.m-r-25 {{ selectedSkill.name }}

      .col.m-b-5
        p.caption Proficiency
        .progress-linear.m-t-5
          .p(:class='`p${selectedSkill.proficiency * 10}`')

    .section-dense
      p.text-light {{ selectedSkill.description }}

    div(v-if='relatedProjects.length')
      h6 Related projects

      .row.related-projects
        router-link.project(
          v-for='(project, i) in relatedProjects'
          :key='i'
          :to="{ name: 'project', params: { name: project.name } }"
        )
          project-tile.m-r-15.m-b-15(:project='project')
          p.m-r-10 {{ project.title }}
      //- ul
      //-   li(v-for='(project, i) in relatedProjects' :key='i')
      //-     router-link.text-accent(:to="{ name: 'project', params: { name: project.name }}") {{ project.title }}

</template>

<script>
import { mapState } from 'vuex'
import ProjectTile from '@/components/ProjectTile'

export default {
  name: 'about',
  components: {
    ProjectTile,
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
    },
  },
  mounted() {
    this.select(this.skills.languages[0])
  },
}
</script>

<style lang="scss">
@import '@/styles/variables.scss';

$profile-photo-size: 150px;

.profile-photo {
  border-radius: 50%;
  border: 7px solid $primary;
  outline: $border-width solid $accent;
  width: $profile-photo-size;
  height: $profile-photo-size;
}

.skill-info {
  border: $border-width solid $accent;
  border-radius: $border-width;

  .project {
    width: 100px;
  }
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

    $progress-amounts: (10, 20, 30, 40, 50, 60, 70, 80, 90, 100);
    @each $progress-amount in $progress-amounts {
      &.p#{$progress-amount} {
        width: #{$progress-amount * 1%};
      }
    }
  }
}
</style>
