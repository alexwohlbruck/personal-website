<template lang="pug">

.flourish
  canvas(ref='canvas')
  
</template>

<script>

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
  },

  data: (instance) => ({
    c: null,
    ctx: null,
    canvasWidth: 0,
    canvasHeight: 0,
    startTime: (new Date).getTime(),
    position: {
      x: instance.originX || .5,
      y: instance.originY || 1,
    },
    speed: {
      velocity: .1, // Velocity of movment
      direction: - Math.PI / 2, // Direction of movement in radians
    },
    mousePosition: {
      x: 0,
      y: 0,
    },
  }),

  methods: {
    init() {
      const c = this.$refs.canvas
      const ctx = c.getContext('2d')
      this.c = c
      this.ctx = ctx
      this.resize()
      this.draw()

      // Watchers
      window.addEventListener('resize', this.resize)
      window.addEventListener('mousemove', this.mouseMove)
    },

    // Draw new frame
    draw() {
      // Calculate new speed
      const velocity = this.calculateVelocity()
      const direction = this.calculateDirection()

      console.log(this.position.y)

      // Calculate new position
      const x = this.position.x + Math.cos(direction) * velocity
      const y = this.position.y + Math.sin(direction) * velocity
      this.position.x = x
      this.position.y = y
      
      const [absX, absY] = this.relativeToAbsolutePosition(x, y)

      // Draw 2x2 rect at current position
      this.ctx.fillStyle = '#fff'
      this.ctx.fillRect(absX - .5, absY - .5, 1, 1)
      
      setTimeout(() => {
        window.requestAnimationFrame(this.draw)
      }, 100)
    },

    // Window has resized
    resize() {
      this.canvasWidth = this.$refs.canvas.parentNode.offsetWidth
      this.canvasHeight = this.$refs.canvas.parentNode.offsetHeight
      this.c.width = this.canvasWidth
      this.c.height = this.canvasHeight
      this.clear()
    },

    mouseMove(e) {
      this.mousePosition.x = e.clientX
      this.mousePosition.y = e.clientY
      this.calculateDirection()
    },

    // Clear canvas
    clear() {
      this.ctx.clearRect(0,0, this.canvasWidth, this.canvasHeight)
      // TODO: Restart animation
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
      const velocity = 15 / (elapsed + 1) // https://www.desmos.com/calculator/g70oacauyv
      this.speed.velocity = velocity
      return velocity
    },

    calculateDirection() {
      const mouseX = this.mousePosition.x - this.c.offsetLeft
      const mouseY = this.mousePosition.y - this.c.offsetTop

      // Compute the new direction based on current position and mouse position
      const [posX, posY] = this.relativeToAbsolutePosition(this.position.x, this.position.y)
      const direction = Math.atan2(mouseY - posY, mouseX - posX)
      // Snap to 45 degree increments
      const snapped = Math.round(direction / (Math.PI / 4)) * (Math.PI / 4)
      this.speed.direction = snapped
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
    // width: 100%;
    // height: 100%;
  }
}

</style>