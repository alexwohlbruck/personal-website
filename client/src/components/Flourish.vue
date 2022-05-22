<template lang="pug">

.flourish
  canvas(ref='canvas')
  
</template>

<script>

const DEBUG = false

// Useful math constants
const UP = 'u'
const DOWN = 'd'
const LEFT = 'l'
const RIGHT = 'r'
const UP_LEFT = 'ul'
const UP_RIGHT = 'ur'
const DOWN_LEFT = 'dl'
const DOWN_RIGHT = 'dr'

// Timing constants
const ANIMATION_START_DELAY = 1000
const ANIMATION_RELOAD_DELAY = 500

// Graphical constants
const SEGMENT_WIDTH = 5         // Width of a segment in pixels
const SEGMENT_SEPARATION = 10   // Number of cells between segments
const MIN_GROUP_SEPARATION = 10 // Minimum number of cells between groups
const MAX_GROUP_COUNT = 20
const MAX_GROUPS = Math.floor(window.innerWidth / (MIN_GROUP_SEPARATION * SEGMENT_SEPARATION)) + 1

// Probabilities
const INITIAL_TERMINAL_PROBABILITY = .01
const INITIAL_SPLIT_PROBABILITY = .2
const INITIAL_CHANGE_DIRECTION_PROBABILITY = .15
const INITIAL_REVERT_DIRECTION_PROBABILITY = .5
const SPLIT_PROBABILITY_INCREMENT = -.02    // Decrease the probability of a split each time a split occurs
const TERMINAL_PROBABILITY_INCREMENT = .001 // Increase the probability of a terminal each time a terminal occurs

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
      The canvas will be divided into a grid of cells that can each remember if a line has been drawn on it.
  */
  branches: {},
  grid: null, // Will be populated with a 2D array of booleans
  gridWidth: 0,
  gridHeight: 0,
  terminalProbability: INITIAL_TERMINAL_PROBABILITY,                // Probability of a branch ending
  splitProbability: INITIAL_SPLIT_PROBABILITY,                      // Probability of a branch splitting
  changeDirectionProbability: INITIAL_CHANGE_DIRECTION_PROBABILITY, // Probability of a branch changing direction
  revertDirectionProbability: INITIAL_REVERT_DIRECTION_PROBABILITY, // Probability of a branch reverting back to the bias direction (Effects the overall spread of the tree)
})

const newBranch = (x, y, direction) => ({
  position: {
    x,
    y,
  },
  direction,
  wasDeflected: false, // If a branch had to change direction because of a collision, this flag will be used to revert direction asap
})

export default {
  name: 'Flourish',
  
  mounted() {
    setTimeout(() => {
      this.init()
    }, ANIMATION_START_DELAY)

    if (DEBUG) {
      this.$refs.canvas.style.opacity = 1
    }
  },

  props: {
    biasDirection: {
      type: String,
      default: UP // Overall direction of movement
    },
    color: {
      type: String,
      default: '#3A9CFF',
    },
    resizeTimeout: null,
  },

  data: () => initialParams(),

  methods: {
    init() {
      const c = this.$refs.canvas
      const ctx = c.getContext('2d')
      this.c = c
      this.ctx = ctx
      this.resize()

      this.generateBranches()

      // Watchers
      window.addEventListener('resize', () => {
        this.clear()
        clearTimeout(this.resizeTimeout)
        this.resizeTimeout = setTimeout(() => {
          this.reset()
        }, ANIMATION_RELOAD_DELAY)
      })
    },

    generateBranches() {
      const numGroups = Math.floor(Math.random() * MAX_GROUPS) + 1
      const previousGroupPositions = []

      console.log(numGroups)

      for (let i = 0; i < numGroups; i++) {
        const numBranches = Math.floor(Math.random() * MAX_GROUP_COUNT) + 1
        let groupPosition = Math.floor(Math.random() * this.gridWidth)
        
        // Prevent groups from being drawn on top of each other
        if (previousGroupPositions.length > 0) {
          const minDistance = Math.min(...previousGroupPositions.map(p => Math.abs(p - groupPosition)))
          if (minDistance < MIN_GROUP_SEPARATION) {
            groupPosition = previousGroupPositions[Math.floor(Math.random() * previousGroupPositions.length)]
          }
        }

        for (let j = 0; j < numBranches; j++) {
          const x = groupPosition + j
          const y = this.gridHeight - 1
          this.addBranch(x, y, UP)
        }
      }

      this.draw()
    },

    // Draw new frame
    draw() {

      for (const [id, branch] of Object.entries(this.branches)) {
        
        const isEqualToBias = branch.direction == this.biasDirection
        const veerDirection = (Math.random() < .5 ? UP_RIGHT : UP_LEFT) // Randomly choose a potential veer direction

        
        // Determine if branch should end
        if (isEqualToBias && Math.random() < this.terminalProbability) {
          this.endBranch(id)
          break
        }

        // Determine if branch should split
        else if (isEqualToBias && Math.random() < this.splitProbability) {
          this.splitBranch(id, veerDirection)
        }

        // Determine if branch should change direction
        else if (isEqualToBias && Math.random() < this.changeDirectionProbability) {
          this.changeBranchDirection(id, veerDirection, false)
        }

        else if (branch.wasDeflected) {
          this.changeBranchDirection(id, this.biasDirection, false)
          branch.wasDeflected = false
        }

        // Determine if branch should revert to bias direction
        else if (!isEqualToBias && Math.random() < this.revertDirectionProbability) {
          this.changeBranchDirection(id, this.biasDirection)
        }

        this.continueBranch(id)
      }

      if (Object.keys(this.branches).length > 0) {
        setTimeout(() => {
          window.requestAnimationFrame(this.draw)
        }, 2 * this.calculateVelocity())
      }
    },

    addBranch(x, y, direction) {
      const id = (new Date()).getTime() + Math.floor(Math.random() * 100000)
      this.branches[id] = newBranch(x, y, direction)
    },

    // Terminate a branch
    endBranch(id) {
      const branch = this.branches[id]
      if (!branch) return
      const { x, y } = branch.position
      this.drawEndSegment(x, y)
      delete this.branches[id]
      this.terminalProbability += TERMINAL_PROBABILITY_INCREMENT
    },

    // Split a branch
    splitBranch(id, direction) {
      const x = this.branches[id].position.x
      const y = this.branches[id].position.y
      const noSpace = this.offsetCellWasVisited(x, y, direction)

      if (noSpace) {
        return
      }

      this.addBranch(x, y, direction)
      this.splitProbability += SPLIT_PROBABILITY_INCREMENT
    },

    changeBranchDirection(id, direction, updateProbability = true) {
      this.branches[id].direction = direction
      if (updateProbability) {
        this.changeDirectionProbability += TERMINAL_PROBABILITY_INCREMENT
      }
    },

    continueBranch(id) {

      let { direction } = this.branches[id]
      const { position } = this.branches[id]
      const { x: startX, y: startY } = position
      
      // If the cell was already visited, try other directions.
      // If no directions work, end the branch
      if (this.offsetCellWasVisited(startX, startY, direction)) {
        
        // Try the other two directions
        const isEqualToBias = direction == this.biasDirection
        const otherDirections = isEqualToBias ? [UP_LEFT, UP_RIGHT] : [this.biasDirection]

        if (isEqualToBias) {
          this.branches[id].wasDeflected = true
        }

        let foundNewDirection = false
        for (const otherDirection of otherDirections) {
          if (!this.offsetCellWasVisited(startX, startY, otherDirection)) {
            direction = otherDirection
            foundNewDirection = true
            break
          }
        }

        if (!foundNewDirection) {
          return this.endBranch(id)
        }
      }

      // Prevent intersections
      // If there is a branch to the left and the direction is UP_LEFT, or the same but to the right, stop the branch
      if (
        (direction === UP_LEFT && this.offsetCellWasVisited(startX, startY, LEFT)) ||
        (direction === UP_RIGHT && this.offsetCellWasVisited(startX, startY, RIGHT))
      ) {
        this.endBranch(id)
        return
      }

      const offset = this.directionToGridOffset(direction)
      const endX = startX + offset[0]
      const endY = startY + offset[1]

      // If out of bounds, don't continue
      if (endX < 0 || endX >= this.gridWidth || endY < 0 || endY >= this.gridHeight) {
        this.endBranch(id)
        return
      }

      this.drawLineSegment(startX, startY, endX, endY)

      position.x = endX
      position.y = endY
    },

    // Draw a line segment
    drawLineSegment(startX, startY, endX, endY) {
      const halfCellSize = this.gridCellSize / 2
      const canvasStartX = startX * this.gridCellSize + halfCellSize
      const canvasStartY = startY * this.gridCellSize + halfCellSize
      const canvasEndX = endX * this.gridCellSize + halfCellSize
      const canvasEndY = endY * this.gridCellSize + halfCellSize

      // Draw segment
      this.ctx.beginPath()
      this.ctx.moveTo(canvasStartX, canvasStartY)
      this.ctx.lineTo(canvasEndX, canvasEndY)
      this.ctx.strokeStyle = this.color
      this.ctx.lineWidth = SEGMENT_WIDTH
      this.ctx.stroke()

      // Draw circular cap at endpoint
      this.ctx.beginPath()
      this.ctx.arc(canvasEndX, canvasEndY, SEGMENT_WIDTH / 2, 0, 2 * Math.PI)
      this.ctx.fillStyle = this.color
      this.ctx.fill()

      this.setCellVisited(endX, endY)
    },

    // Draw the end cap for a line segment
    drawEndSegment(x, y) {
      const halfCellSize = this.gridCellSize / 2
      const canvasX = x * this.gridCellSize + halfCellSize
      const canvasY = y * this.gridCellSize + halfCellSize

      this.ctx.beginPath()
      this.ctx.arc(canvasX, canvasY, SEGMENT_WIDTH, 0, 2 * Math.PI)
      this.ctx.fillStyle = this.color
      this.ctx.fill()
    },

    // Draw grid cells to canvas with borders
    drawGrid(gridWidth, gridHeight, gridCellSize) {
      for (let i = 0; i < gridWidth; i++) {
        for (let j = 0; j < gridHeight; j++) {
          this.ctx.beginPath()
          this.ctx.rect(i * gridCellSize, j * gridCellSize, gridCellSize, gridCellSize)
          this.ctx.strokeStyle = '#fff'
          this.ctx.lineWidth = .03
          this.ctx.stroke()
        }
      }
    },

    setCellVisited(x, y) {
      if (this.cellDoesntExist(x, y)) return
      this.grid[x][y] = true
      
      // Color in cell if it was visited
      if (DEBUG) {
        this.ctx.beginPath()
        this.ctx.rect(x * this.gridCellSize, y * this.gridCellSize, this.gridCellSize, this.gridCellSize)
        this.ctx.fillStyle = 'rgba(255, 0, 0, .3)'
        this.ctx.fill()
      }
    },

    cellWasVisited(x, y) {
      if (this.cellDoesntExist(x, y)) return false
      return this.grid[x][y]
    },

    // Take a cell and direction and find out if the cell in that direction was visited already
    offsetCellWasVisited(x, y, direction) {
      const offset = this.directionToGridOffset(direction)
      const newX = x + offset[0]
      const newY = y + offset[1]
      return this.cellWasVisited(newX, newY)
    },


    cellDoesntExist(x, y) {
      return x < 0 || x >= this.gridWidth || y < 0 || y >= this.gridHeight
    },

    // Window has resized
    resize() {
      this.canvasWidth = this.$refs.canvas.parentNode.offsetWidth
      this.canvasHeight = this.$refs.canvas.parentNode.offsetHeight
      this.c.width = this.canvasWidth
      this.c.height = this.canvasHeight

      const gridCellSize = SEGMENT_WIDTH + SEGMENT_SEPARATION
      const gridWidth = Math.ceil(this.canvasWidth / gridCellSize) + 1
      const gridHeight = Math.ceil(this.canvasHeight / gridCellSize) + 1

      this.gridCellSize = gridCellSize
      this.gridWidth = gridWidth
      this.gridHeight = gridHeight

      this.grid = []
      for (let i = 0; i < gridWidth; i++) {
        this.grid[i] = []
        for (let j = 0; j < gridHeight; j++) {
          this.grid[i][j] = false
        }
      }

      if (DEBUG) {
        this.drawGrid(gridWidth, gridHeight, gridCellSize)
      }
    },

    // Clear canvas
    clear() {
      this.ctx.clearRect(0,0, this.canvasWidth, this.canvasHeight)
    },

    reset() {
      Object.assign(this.$data, initialParams())
      this.init()
      this.generateBranches()
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
      const velocity = (elapsed / 500) ** 2 // Slow down speed over time https://www.desmos.com/calculator/g70oacauyv
      return velocity
    },
    
    // Take a direction string and return a tuple of x and y offset values
    // Ex. UP => [0, -1]
    //     DOWN_RIGHT => [1, 1]
    directionToGridOffset(direction) {
      switch (direction) {
        case UP:
          return [0, -1]
        case UP_RIGHT:
          return [1, -1]
        case RIGHT:
          return [1, 0]
        case DOWN_RIGHT:
          return [1, 1]
        case DOWN:
          return [0, 1]
        case DOWN_LEFT:
          return [-1, 1]
        case LEFT:
          return [-1, 0]
        case UP_LEFT:
          return [-1, -1]
        default:
          return [0, 0]
      }
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