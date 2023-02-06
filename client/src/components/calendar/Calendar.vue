<template lang="pug">
.calendar(ref='cal' @scroll='handleScroll')
  .days
    .filler
    .filler
    .day(
      v-for='(day, i) in days'
      :key='i'
      :class='{ border: scrolledDown }'
      :style='`transition-delay: ${i * 30}ms`'
    )
      p.caption {{ day.getDay() | weekday }}
      h6.m-b-0 {{ day.getDate() }}

  .current-time-marker(:style='`top: ${percentDayCompleted}%`')
      
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

<script>
import { Vue, Component } from 'vue-property-decorator'
import { MOBILE_BREAKPOINT } from '@/globals'

@Component({
  filters: {
    weekday(value) {
      return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][value]
    },
  }
})
export default class Calendar extends Vue {
  scrolledDown = false
  show2Days = false

  mounted() {
    this.$store.dispatch('getCalendarEvents')
    window.addEventListener('resize', this.handleResize)
    this.$refs.cal.scrollTop = 7 / 24 * this.$refs.cal.scrollHeight // Scroll to 7am
  }

  handleScroll(event) {
    console.log(event)
    this.scrolledDown = event.target.scrollTop !== 0
  }

  handleResize() {
    this.show2Days = window.innerWidth < MOBILE_BREAKPOINT
  }

  // Get next 7 days from today
  get days() {
    const today = new Date()
    const days = []
    const numDays = this.show2Days ? 2 : 7
    for (let i = 0; i < numDays; i++) {
      const day = new Date(today)
      day.setDate(today.getDate() + i)
      days.push(day)
    }
    return days
  }

  get hours() {
    const hours = []
    for (let i = 0; i < 24; i++) {
      const hour = i % 12 + 1
      let meridiem = i < 12  ? 'AM' : 'PM'
      if (i == 11) meridiem = 'PM' // For some cursed reason noon is 12PM
      if (i == 23) meridiem = 'AM' // Same with midnight
      hours.push(`${hour} ${meridiem}`)
    }
    return hours
  }

  // Translate event start and end times into grid positions
  get eventsRelative() {
    console.log('eventsRelative')
    return this.$store.state.calendarEvents
      .map(event => {
        const start = new Date(event.start)
        const end = new Date(event.end)
        // Get event duration rounded to nearest 15 minutes in hour
        const duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 15))

        // Calculate which column the event starts in depending on the day of the week
        const col = this.days.findIndex(day => day.getDay() === start.getDay())
        const row = start.getHours() * 4 + Math.floor(start.getMinutes() / 15) + 1

        if ((this.show2Days && col > 1) || col < 0) return null

        return {
          col: col + 3,
          row,
          span: duration,
          summary: event.summary,
        }
      })
      .filter(event => event) // Filter out null events
  }

  // Return decimal percentage between 0-100 of how much of the current day is passed
  get percentDayCompleted() {
    const now = new Date('2023-02-04 24:00')
    const startOfDay = new Date()
    startOfDay.setHours(0)
    startOfDay.setMinutes(0)
    startOfDay.setSeconds(0)
    startOfDay.setMilliseconds(0)
    const diff = now.getTime() - startOfDay.getTime()
    const millisecondsInDay = 24 * 60 * 60 * 1000
    console.log({now, startOfDay, diff, millisecondsInDay})
    return Math.round(diff / millisecondsInDay * 100)
  }
}
</script>

<style lang="scss">
@import '../../styles/variables.scss';

$days-height: 4em;
$time-width: 3.75em;
$time-height: 3em;
$grid-color: rgba($light, .5);
$grid-7d: $time-width 10px repeat(7, 1fr);
$grid-2d: $time-width 10px repeat(2, 1fr);
$current-time-color: #ea4335;

.calendar {

  width: 100%;
  display: grid;
  grid-template-rows: $days-height auto;
  max-height: 75vh;
  overflow-y: auto;
  border: $border-width solid $light;
  border-radius: $border-width;
  padding-bottom: 20px;
  background: rgba($primary, .85);

  @media (max-width: $mobile-breakpoint) {
    max-height: 65vh;
  }

  .days {
    display: grid;
    place-content: center;
    text-align: center;
    grid-template-columns: $grid-7d;
    position: sticky;
    top: 0;
    z-index: 10;

    .day {
      width: auto;
      margin: 0 auto;
      border: 0px solid;
      border-radius: 6px;
      padding: 5px 12px;
      background: #3a9cff;
      transition: all 0.2s ease-in-out;
      transform: translateY(0);
    }

    .day.border {
      border: #65ffb7 solid 3px;
      transform: translateY(10px);
    }
  }

  .content {
    display: grid;
    grid-template-columns: $grid-7d;
    grid-template-rows: repeat(24 * 4, $time-height / 4);
  }

  @media (max-width: $mobile-breakpoint) {
    .days, .content {
      grid-template-columns: $grid-2d;
    }
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
    border-width: 1px 1px 1px 0;
    border-color: $grid-color;
    border-style: solid;
    grid-row: 1 / span 96;
    grid-column: span 1;
  }

  .filler-col {
    grid-row: 1 / -1;
    grid-column: 2;
    border-right: 1px solid $grid-color;
  }

  .current-time-marker {
    display: none;
    grid-row: 1 / span 96;
    grid-column: 3 / auto;
    height: 3px;
    background-color: $accent;
    border-radius: 3px;
    position: absolute;
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