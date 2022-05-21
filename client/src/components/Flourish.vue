<template lang="pug">

.flourish
  canvas(ref='canvas')
  
</template>

<script>
const UP = - Math.PI / 2        // TODO: Generalize this for any direction
const VEER_RIGHT  = Math.PI / 4 // Add 45 degrees to an angle
const VEER_LEFT = - Math.PI / 4 // Subtract 45 degrees from an angle

const ANIMATION_START_DELAY = 1000
const ANIMATION_RELOAD_DELAY = 500

const SEGMENT_LENGTH = 25
const SEGMENT_WIDTH = 5
const SEGMENT_SEPARATION = 10
const MAX_GROUPS = 1
const MAX_GROUP_COUNT = 1
const MIN_GROUP_SEPARATION = 400

const INITIAL_TERMINAL_PROBABILITY = .02
const INITIAL_SPLIT_PROBABILITY = .2
const INITIAL_CHANGE_DIRECTION_PROBABILITY = .15
const SPLIT_PROBABILITY_INCREMENT = -.02    // Decrease the probability of a split each time a split occurs
const TERMINAL_PROBABILITY_INCREMENT = .005 // Increase the probability of a terminal each time a terminal occurs

const initialParams = () => ({
  c: null,
  ctx: null,
  canvasWidth: 0,
  canvasHeight: 0,
  startTime: (new Date).getTime(),
  velocity: .1, // Velocity of movment
  /* 
    As the animation progresses,
    branches can either continue as normal, change direction, end, or split into two branches.
    - When continuing normally, the branch will appear as a line segment.
    - When changing direction, the branch will veer 45 degrees from the bias direction for a few iterations
      and then return to the bias direction. This should only happen occasionally.
    - When ending, the the branch will end with a circle attached to the end of the segment.
    - When splitting, the branch will split into two branches, and the split will be angled 45 degrees from the root branch.
      Splits can only happen when the branch is pointing in the same direction as the bias.
    - Lines should never be drawn on top of existing ones. If a line is about to be drawn on top of an existing line,
      it will veer 45 degrees to an area with free space. If there is no free space, the line will end.
  */
  branches: [],
  terminalProbability: INITIAL_TERMINAL_PROBABILITY,                // Probability of a branch ending
  splitProbability: INITIAL_SPLIT_PROBABILITY,                      // Probability of a branch splitting
  changeDirectionProbability: INITIAL_CHANGE_DIRECTION_PROBABILITY, // Probability of a branch changing direction
})

const newBranch = (x, y, direction) => ({
  position: {
    x,
    y,
  },
  direction,
  progress: 0
})

export default {
  name: 'Flourish',
  
  mounted() {
    setTimeout(() => {
      this.init()
    }, ANIMATION_START_DELAY)
  },

  props: {
    biasDirection: {
      type: Number,
      default: UP // Overall direction of movement
    },
    color: {
      type: String,
      default: '#65FFB7',
    },
    resizeTimeout: null,
  },

  data: (instance) => initialParams(),

  methods: {
    init() {
      const c = this.$refs.canvas
      const ctx = c.getContext('2d')
      this.c = c
      this.ctx = ctx
      this.resize()

      this.startEffect()

      // Watchers
      window.addEventListener('resize', () => {
        this.clear()
        clearTimeout(this.resizeTimeout)
        this.resizeTimeout = setTimeout(() => {
          this.reset()
        }, ANIMATION_RELOAD_DELAY)
      })
    },

    startEffect() {
      const numGroups = Math.floor(Math.random() * MAX_GROUPS) + 1

      const previousGroupPositions = []
      
      for (let i = 0; i < numGroups; i++) {
        const numBranches = Math.floor(Math.random() * MAX_GROUP_COUNT) + 1
        let groupPosition = Math.random() * this.canvasWidth
        
        // Prevent groups from being drawn on top of each other
        if (previousGroupPositions.length > 0) {
          const minDistance = Math.min(...previousGroupPositions.map(p => Math.abs(p - groupPosition)))
          if (minDistance < MIN_GROUP_SEPARATION) {
            groupPosition = previousGroupPositions[Math.floor(Math.random() * previousGroupPositions.length)]
          }
        }

        for (let j = 0; j < numBranches; j++) {
          this.branches.push({
            position: {
              x: (j * (SEGMENT_WIDTH + SEGMENT_SEPARATION)) + groupPosition,
              y: this.canvasHeight * 1,
            },
            direction: UP,
            progress: 0
          })
        }
      }

      this.draw()
    },

    // Draw new frame
    draw() {

      for (const [i, branch] of this.branches.entries()) {
        
        // Calculate overall movment vector
        this.calculateVelocity()

        const startX = branch.position.x
        const startY = branch.position.y
        const direction = branch.direction

        const isEqualToBias = direction == this.biasDirection
        const veerDirection = (Math.random() < .5 ? VEER_RIGHT : VEER_LEFT) 

        let ended = false
        // Determine if branch should end
        if (Math.random() < this.terminalProbability) {
          this.branches.splice(i, 1)
          this.terminalProbability += TERMINAL_PROBABILITY_INCREMENT
          ended = true
        }

        // Determine if branch should split
        else if (Math.random() < this.splitProbability) {
          // Choose a direction. Never stray more than 45 degress from bias direction
          const angleDelta = isEqualToBias ? veerDirection : (this.biasDirection - direction)

          this.branches.push(newBranch(startX, startY, direction + angleDelta))
          this.splitProbability += SPLIT_PROBABILITY_INCREMENT
        }

        // Determine if branch should change direction
        else if (isEqualToBias && Math.random() < this.changeDirectionProbability) {
          branch.direction += veerDirection
        }
        else if (!isEqualToBias && Math.random() < this.changeDirectionProbability * 2) {
          branch.direction = this.biasDirection
        }

        if (ended) {
          // Draw a white circle at the end of the segment
          this.drawEndSegment(startX, startY)
        }
        else {
          const endX = startX + Math.cos(direction) * SEGMENT_LENGTH
          const endY = startY + Math.sin(direction) * SEGMENT_LENGTH
          
          this.drawLineSegment(startX, startY, endX, endY)
  
          branch.position.x = endX
          branch.position.y = endY
        }
      }

      if (this.branches.length) {
        setTimeout(() => {
          window.requestAnimationFrame(this.draw)
        }, 700 * this.velocity)
      }
    },

    // Draw a line segment
    drawLineSegment(startX, startY, endX, endY) {
      this.ctx.beginPath()
      this.ctx.moveTo(startX, startY)
      this.ctx.lineTo(endX, endY)
      this.ctx.strokeStyle = this.color
      this.ctx.lineWidth = SEGMENT_WIDTH
      this.ctx.stroke()
    },

    // Draw the end cap for a line segment
    drawEndSegment(x, y) {
      this.ctx.beginPath()
      this.ctx.arc(x, y, SEGMENT_WIDTH, 0, 2 * Math.PI)
      this.ctx.fillStyle = this.color
      this.ctx.fill()
    },

    // Window has resized
    resize() {
      console.log('resize')
      this.canvasWidth = this.$refs.canvas.parentNode.offsetWidth
      this.canvasHeight = this.$refs.canvas.parentNode.offsetHeight
      this.c.width = this.canvasWidth
      this.c.height = this.canvasHeight
    },

    // Clear canvas
    clear() {
      this.ctx.clearRect(0,0, this.canvasWidth, this.canvasHeight)
    },

    reset() {
      Object.assign(this.$data, initialParams())
      this.init()
      this.startEffect()
    },

    // Resolve relative percentage position to canvas coordinates
    relativeToAbsolutePosition(x, y) {
      return [
        x * this.canvasWidth,
        y * this.canvasHeight,
      ]
    },

    // Calculate the speed of animation based on the time since reset
    calculateVelocity() {
      const now = (new Date).getTime()
      const elapsed = now - this.startTime
      const velocity = 5 / (elapsed + 1) // Slow down speed over time https://www.desmos.com/calculator/g70oacauyv
      return velocity
    },
  },
}

</script>

<style lang="scss">
.flourish {
  width: 100px;
  height: 100px;
  position: absolute;
  top: 0;
  width: 100%;
  height: 100%;
  z-index: -1;

  canvas {
    opacity: .1;
  }
}

</style>