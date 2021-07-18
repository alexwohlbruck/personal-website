<template lang="pug">
.col.works

  .container
    h4 My work

    .timeline.col(:class='!mobile ? "align-center" : "align-flex-end"')
      .timeline-item.col.align-center(
        v-for='(event, i) in events'
        :index='i'
        )

        .segment
          .detail(:class='(i % 2 == 1) && (!mobile) ? "right" : "left"')
            .info
              h5.row.align-center
                img(
                  v-if='event.icon'
                  :src='require(`@/assets/svg/${event.icon}.svg`)'
                  width='40'
                  :class='`p-${(i % 2 == 1) && (!mobile) ? "l" : "r"}-15`'
                )
                span {{ event.title }}
                .divider

              p.m-y-20.text-light {{ event.description }}

              .date-inline.row.align-center.m-y-20
                div(v-if='event.end')
                  p.text-primary.caption {{ event.end | monthName }}
                  p.text-primary {{ event.end | year }}
                p.m-x-15.text-light(v-if='event.end') -
                div
                  p.text-primary.caption {{ event.start | monthName }}
                  p.text-primary {{ event.start | year }}

              a.text-accent(v-if='event.to') See more
              
            .date
              p.caption {{ event.start | monthName }}
              p {{ event.start | year }}
              
          .dot
        
        .line(v-if='!event.end')
        
        .segment
          //- If event has end date, add line and another dot
          .col.align-center(v-if='event.end')
            .line
            .detail(:class='(i % 2 == 1) && (!mobile) ? "right" : "left"')
              .date
                p.caption {{ event.end | monthName }}
                p {{ event.end | year }}
            .dot
        

        //- Place line after for spacing
        .line(v-if='i != events.length - 1')

</template>

<script>
const months = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]
const isToday = (date) => {
  const today = new Date()
  return (
    date.getDate() == today.getDate() &&
    date.getMonth() == today.getMonth() &&
    date.getFullYear() == today.getFullYear()
  )
}

export default {
  name: 'works',
  filters: {
    monthName(date) {
      if (isToday(date)) return ''
      return months[date.getMonth()]
    },
    year(date) {
      if (isToday(date)) return 'Today'
      return date.getFullYear()
    },
  },
  mounted() {
    window.onresize = () => {
      this.mobile = window.innerWidth <= 900
    }
  },
  data: () => ({
    mobile: window.innerWidth <= 900,
    events: [
      {
        start: new Date(),
        end: new Date('December 16, 2020'),
        title: 'Worxstr',
        description:
          'Designed and developed the web frontend and mobile app for Worxstr, a digital labor management platform.',
        icon: 'worxstr',
        to: {},
      },
      {
        start: new Date('August 1, 2019'),
        end: new Date('May 1, 2019'),
        title: 'PunchAlert',
        description:
          'Worked on custom software suite integrations for the PunchAlert app using Python.',
        icon: 'punch',
      },
      {
        start: new Date('August 16, 2018'),
        title: 'Appalachian State',
        description:
          'Became an undergrad student at Appalachian State University, studying for a B.S. in computer science.',
        icon: 'appstate',
      },
      {
        start: new Date('June 1, 2018'),
        end: new Date('May 1, 2018'),
        title: 'PunchAlert',
        description:
          'Interned writing a new front-end web console for internal use at the company using Vue.js.',
        icon: 'punch',
      },
      {
        start: new Date('May 30, 2018'),
        end: new Date('August 18, 2014'),
        title: 'Myers Park High',
        description:
          'I started learning to code with some of my friends during high school when I went to Myers Park.',
        icon: 'myerspark',
      },
      {
        start: new Date('May 11, 2000'),
        title: 'Birth',
        description: 'I was born in Charlotte, NC at the turn of the century.',
      },
    ],
  }),
}
</script>

<style lang="scss">
@import '@/styles/variables.scss';

$dot-size: 17px;
$line-height: 90px;
$segment-line-height: 120px;
$segment-color: $accent;
$spacing: 40px;

.timeline {
  padding: 100px 0;

  @media (max-width: $mobile-breakpoint) {
    // transform: translatex(50vw) translatex(-65px);
  }
}
.timeline-item {
  position: relative;

  .line {
    width: $dot-size * 0.5;
    height: $line-height;
    transform: scaleY(
      ($line-height + ($dot-size / 2)) / $line-height
    ); // Scale line to line up with center of dots
    background-color: $primary;
    border-radius: $dot-size;

    @media (max-width: $mobile-breakpoint) {
      height: #{$line-height * 1.3};
    }
  }
  .dot {
    position: relative;
    z-index: 2;
    width: $dot-size;
    height: $dot-size;
    border-radius: 50%;
    background-color: $white;
    border: ($dot-size / 3) solid $segment-color;
    box-sizing: border-box;
  }
  .info {
    position: absolute;
    width: calc(40vw - #{$spacing * 2});
    max-width: 600px;

    @media (max-width: $mobile-breakpoint) {
      width: calc(90vw - #{$spacing * 2});
    }

    h5 {
      white-space: nowrap;
    }

    .divider {
      width: 100%;
      height: 2px;
      border-radius: 2px;
      background: $primary;
      margin: 0 ($spacing / 2);
    }
  }
  .date {
    position: absolute;
    top: 0;
    @media (max-width: $mobile-breakpoint) {
      display: none;
    }
  }
  .date-inline {
    @media (min-width: $mobile-breakpoint) {
      display: none;
    }
  }
  .info,
  .date {
    transform: translateY(#{$dot-size / -2});
  }

  .detail {
    position: relative;

    &.left {
      .info {
        right: calc(100% + #{$spacing});
      }
      .date {
        left: calc(100% + #{$spacing});
      }
    }

    &.right {
      .info {
        left: calc(100% + #{$spacing});
        text-align: right;

        h5 {
          flex-direction: row-reverse;
        }
      }
      .date {
        right: calc(100% + #{$spacing});
      }
    }
  }

  .segment {
    display: flex;
    flex-direction: column;
    align-items: center;

    .line {
      background-color: $segment-color;
      height: $segment-line-height;
    }
  }
}
</style>
