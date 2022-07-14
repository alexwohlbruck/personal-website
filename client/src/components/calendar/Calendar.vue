<template lang="pug">
.calendar
  .days
    .filler
    .filler
    .day(v-for='day in days')
      p.caption {{ day.getDay() | weekday }}
      h6.m-b-0 {{ day.getDate() }}
      
  .content
    template(v-for='(hour, i) in hours')
      .time(:style='`grid-row:${(i+1) * 4}`') {{ hour }}
    .filler-col
    - var n = 3;
    while n < 8
      .col(style='grid-column:'+n++)
    .col(style='grid-column:'+n++).weekend
    .col(style='grid-column:'+n++).weekend
    
    - var n = 1
    while n < (24 * 4)
      .row(style='grid-row:'+n++)

    .event(v-for='event in eventsRelative' :style='`grid-column: ${event.col}; grid-row: ${event.row} / span ${event.span}`')
      | {{ event.summary || 'Busy' }}
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'

@Component({
  filters: {
    weekday(value) {
      return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][value]
    },
  }
})
export default class Calendar extends Vue {
  mounted() {
    this.$store.dispatch('getCalendarEvents')
  }

  // Get next 7 days from today
  get days() {
    const today = new Date()
    const days: any = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(today)
      day.setDate(today.getDate() + i)
      days.push(day)
    }
    return days
  }

  get hours() {
    const hours: any = []
    for (let i = 0; i < 24; i++) {
      const hour = i % 12 + 1
      const ampm = i < 12 ? 'AM' : 'PM'
      hours.push(`${hour} ${ampm}`)
    }
    return hours
  }

  // Translate event start and end times into grid positions
  get eventsRelative() {
    return this.$store.state.calendarEvents?.map(event => {
      
      const start = new Date(event.start)
      const end = new Date(event.end)
      const dayOfWeek = (new Date()).getDay()
      // Get event duration rounded to nearest 15 minutes in hour
      const duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 15))
      const col = (start.getDay() + dayOfWeek - 1) % 7 + 3
      const row = start.getHours() * 4 + Math.floor(start.getMinutes() / 15) + 1

      if (start.getDate() == 18) {
        console.log(start.getHours(), start.getMinutes(), duration, col, row)
      }

      return {
        col,
        row,
        span: duration,
        summary: event.summary,
      }
    })
  }
}
</script>

<style lang="scss">
@import '../../styles/variables.scss';

$days-height: 4em;
$time-width: 3.75em;
$time-height: 3em;
$grid-color: rgba($light, .5);
$calendar-template: $time-width 10px repeat(7, 1fr);
$current-time-color: #ea4335;

.calendar {

  width: 100%;
  display: grid;
  grid-template-rows: $days-height auto;
  max-height: 80vh;
  overflow-y: auto;
  border: $border-width solid $light;
  border-radius: $border-width;
  padding-bottom: 20px;
  background: rgba($primary, .85);

  .days {
    display: grid;
    place-content: center;
    text-align: center;
    grid-template-columns: $calendar-template;
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .content {
    display: grid;
    grid-template-columns: $calendar-template;
    grid-template-rows: repeat(96, $time-height / 4);
  }

  .time {
    grid-column: 1;
    text-align: right;
    align-self: end;
    font-size: 80%;
    position: relative;
    bottom: -1ex;
    padding-right: 9px;
  }

  .col {
    border-right: 1px solid $grid-color;
    grid-row: 1 / span 96;
    grid-column: span 1;
  }

  .filler-col {
    grid-row: 1 / -1;
    grid-column: 2;
    border-right: 1px solid $grid-color;
  }

  .row {
    grid-column: 2 / -1;
    
    &:nth-child(4n) {
      border-bottom: 1px solid $grid-color;
    }
  }

  .event {
    border-radius: 5px;
    padding: 5px;
    margin-right: 10px;
    font-weight: bold;
    font-size: 80%;
    background: $accent;
    color: $dark;
  }
}
</style>