<template lang="pug">
.availability
  h5 My availability

  calendar
  p.caption.m-t-5.text-light * Events are displayed in your local time zone, {{timezone}}

</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import Calendar from '@/components/calendar/Calendar.vue'

@Component({
  components: {
    Calendar,
  },
})
export default class Availability extends Vue {
  get timezone() {
    const match = (new Date()).toString()?.match(/([A-Z]+[\+-][0-9]+.*)/)
    return match ? match[1] : 'UTC'
  }
}
</script>