<template lang="pug">

.flourish
  canvas(ref='canvas')
  
</template>

<script>
const SEGMENT_LENGTH = 25
const SEGMENT_WIDTH = 5
const SEGMENT_SEPARATION = 10
const MAX_GROUPS = 4
const MAX_GROUP_COUNT = 7
const MIN_GROUP_SEPARATION = 400

const initialParams = () => ({
  c: null,
  ctx: null,
  canvasWidth: 0,
  canvasHeight: 0,
  startTime: (new Date).getTime(),
  mousePosition: {
    x: 0,
    y: 0,
  },
  velocity: .1, // Velocity of movment
  biasDirection: - Math.PI / 2, // Direction of bias
  /* 
    As the animation progresses,
    branches can either continue as normal, change direction, end, or split into two branches.
    When continuing, the branch will appear as a line segment.
    When ending, the the branch will end with a circle attached to the end of the segment.
    When splitting, the branch will split into two branches, and the split will be angled 45 degrees from the root branch.
    The split direction is based on the current direction that follows the mouse pointer.
    Lines should never be drawn on top of existing ones. That is going to be a fun problem to solve :)
  */
  branches: [],
  terminationProbability: .02, // Probability of a branch ending
  splitProbability: .2, // Probability of a branch splitting
  changeDirectionProbability: .15, // Probability of a branch changing direction
})

export default {
  name: 'Flourish',
  
  mounted() {
    setTimeout(() => {
      this.init()
    }, 1000)
  },

  props: {
    // Originating position in x direction
    originX: {
      type: Number,
      default: .5,
    },
    // Originating position in y direction
    originY: {
      type: Number,
      default: 1,
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
        }, 500)
      })
      window.addEventListener('mousemove', this.mouseMove)
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
            direction: -Math.PI / 2,
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
        this.calculateDirection(branch.position)

        const startX = branch.position.x
        const startY = branch.position.y
        const direction = branch.direction

        
        const isEqualToBias = direction == this.biasDirection
        const randomDelta = (Math.random() < .5 ? Math.PI / 4 : -Math.PI / 4) 

        let ended = false
        // Determine if branch should end
        if (Math.random() < this.terminationProbability) {
          this.branches.splice(i, 1)
          this.terminationProbability += .005
          ended = true
        }

        // Determine if branch should split
        else if (Math.random() < this.splitProbability) {
          // Choose a direction. Never stray more than 45 degress from bias direction
          const angleDelta = isEqualToBias ? randomDelta : (this.biasDirection - direction)

          this.branches.push({
            position: {
              x: startX,
              y: startY,
            },
            direction: direction + angleDelta,
            progress: 0
          })
          this.splitProbability -= .02
        }

        // Determine if branch should change direction
        else if (isEqualToBias && Math.random() < this.changeDirectionProbability) {
          branch.direction += randomDelta
        }
        else if (!isEqualToBias && Math.random() < this.changeDirectionProbability * 2) {
          branch.direction = this.biasDirection
        }

        if (ended) {
          // Draw a white circle at the end of the segment
          this.ctx.beginPath()
          this.ctx.arc(startX, startY, SEGMENT_WIDTH, 0, 2 * Math.PI)
          this.ctx.fillStyle = this.color
          this.ctx.fill()
        }
        else {
          const endX = startX + Math.cos(direction) * SEGMENT_LENGTH
          const endY = startY + Math.sin(direction) * SEGMENT_LENGTH
  
          // Draw a 5px white line segment in the direction of the branch
          this.ctx.beginPath()
          this.ctx.moveTo(startX, startY)
          this.ctx.lineTo(endX, endY)
          this.ctx.strokeStyle = this.color
          this.ctx.lineWidth = SEGMENT_WIDTH
          this.ctx.stroke()
  
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

    // Window has resized
    resize() {
      console.log('resize')
      this.canvasWidth = this.$refs.canvas.parentNode.offsetWidth
      this.canvasHeight = this.$refs.canvas.parentNode.offsetHeight
      this.c.width = this.canvasWidth
      this.c.height = this.canvasHeight
    },

    mouseMove(e) {
      this.mousePosition.x = e.clientX
      this.mousePosition.y = e.clientY
      // this.calculateDirection()
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

    calculateDirection({ x, y }) {
      const mouseX = this.mousePosition.x - this.c.offsetLeft
      const mouseY = this.mousePosition.y - this.c.offsetTop

      // Compute the new direction based on current position and mouse position
      const direction = Math.atan2(mouseY - y, mouseX - x)
      // Snap to 45 degree increments
      const snapped = Math.floor(direction / (Math.PI / 4)) * (Math.PI / 4)
      return snapped
    }
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