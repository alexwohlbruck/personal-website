<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { usePreferredReducedMotion } from '@vueuse/core'
import { useTheme } from '@/composables/useTheme'
import { buildTopoField, TOPO } from '@/lib/topo-field'

/**
 * The hero's contour map, drawn live.
 *
 * The static sheet is a mask of traced paths (see lib/topo-field.ts). Here the
 * height field is handed to the GPU instead and contoured per pixel, which
 * means the map can be warped without the lines ever going soft: the terrain
 * bends, the ink stays one hairline wide because the line width is measured in
 * screen pixels after the bend.
 *
 * Two things push it around. Scrolling sends a swell through the terrain that
 * dies away when you stop, and the cursor raises the faintest rise, the way
 * contours crowd on a summit. Both are slow and have weight; the map should
 * look like ground that noticed you, not like a cursor effect. Pressing is
 * WashSplash's business, not the terrain's.
 *
 * If any of that is unwelcome — reduced motion, no WebGL2 — the element falls
 * back to the CSS mask and looks like the same map standing still.
 */

const VERT = `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() {
  // y down, so the shader can think in the same direction as the page.
  vUv = vec2(aPos.x * 0.5 + 0.5, 0.5 - aPos.y * 0.5);
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`

const FRAG = `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 outColor;

uniform vec2 uSize;         // element size, CSS px
uniform float uStroke;      // field units -> device px, for line weight
uniform vec2 uFieldScale;   // CSS px -> field uv, matching background-size: cover
uniform vec2 uFieldOffset;
uniform sampler2D uLattice;
uniform vec2 uRange;        // the field's min and max
uniform float uTotal;
uniform vec4 uInk;
uniform vec2 uPointer;      // CSS px, relative to the element
uniform float uHover;       // 0..1, how present the cursor is
uniform float uTime;        // seconds
uniform float uScroll;      // CSS px down the page
uniform float uFlow;        // 0..1, how fast the page is moving

const float LEVELS = ${TOPO.levels}.0;
const int BAND = 25;
const float CELLS[4] = float[4](3.0, 6.0, 12.0, 24.0);

float lattice(int octave, ivec2 c) {
  return texelFetch(uLattice, ivec2(c.x, octave * BAND + c.y), 0).r;
}

float quintic(float t) { return t * t * t * (t * (t * 6.0 - 15.0) + 10.0); }

/** Stacked value noise, each octave finer and quieter, rescaled to 0..1. */
float height(vec2 uv) {
  float sum = 0.0;
  float amp = 1.0;

  for (int i = 0; i < 4; i++) {
    float cells = CELLS[i];
    vec2 f = uv * cells;
    vec2 corner = clamp(floor(f), vec2(0.0), vec2(cells - 1.0));
    vec2 t = vec2(quintic(clamp(f.x - corner.x, 0.0, 1.0)), quintic(clamp(f.y - corner.y, 0.0, 1.0)));
    ivec2 c = ivec2(corner);

    float top = mix(lattice(i, c), lattice(i, c + ivec2(1, 0)), t.x);
    float bottom = mix(lattice(i, c + ivec2(0, 1)), lattice(i, c + ivec2(1, 1)), t.x);
    sum += mix(top, bottom, t.y) * amp;
    amp *= 0.5;
  }

  return ((sum / uTotal) - uRange.x) / (uRange.y - uRange.x);
}

/**
 * Where to read the terrain from, and how much to raise it. Displacement slides
 * the map sideways; lift moves it up and down, which is what makes contours
 * appear and close rather than just slither.
 */
vec2 disturb(vec2 p, out float lift) {
  vec2 shift = vec2(0.0);
  lift = 0.0;

  // The sheet is never quite still, but you should have to watch to notice.
  shift += vec2(sin(uTime * 0.08 + p.y * 0.004), cos(uTime * 0.065 + p.x * 0.0032)) * 2.5;

  // Scrolling sends a swell across the terrain, phase tied to the page so it
  // travels with the scroll rather than running on its own clock.
  float phase = uScroll * 0.005;
  shift.x += sin(p.y * 0.011 + phase) * 14.0 * uFlow;
  shift.y += cos(p.x * 0.008 - phase * 0.7) * 10.0 * uFlow;
  lift += sin(p.x * 0.005 + p.y * 0.0035 + phase) * 0.018 * uFlow;

  // The cursor is the faintest rise in the ground, a fraction of a contour
  // interval, with the lines around it barely nudged outward. The map should
  // seem to notice you without ever redrawing itself.
  vec2 toward = p - uPointer;
  float reach = length(toward);
  float falloff = exp(-(reach * reach) / (240.0 * 240.0));
  shift += (toward / max(reach, 1.0)) * falloff * uHover * 3.5;
  lift += falloff * uHover * 0.008;

  return shift;
}

void main() {
  vec2 p = vUv * uSize;

  float lift;
  vec2 shift = disturb(p, lift);

  // The map trails the page slightly, so it reads as ground under the copy.
  vec2 uv = (p + shift - vec2(0.0, uScroll * 0.06)) * uFieldScale + uFieldOffset;
  float h = height(uv) + lift;

  // Contours are the whole numbers of h * LEVELS. fwidth turns the distance to
  // the nearest one into a distance in pixels, which is what keeps the stroke
  // the same weight however hard the terrain is being bent.
  float t = h * LEVELS;
  float level = floor(t + 0.5);
  float dist = abs(t - level) / max(fwidth(t), 1e-6);

  // Every fifth line is an index contour, drawn heavier, as on a real map. The
  // weights are the traced sheet's, in its own units, so they have to come
  // through the same scaling the mask would have given them.
  bool heavy = mod(level, 5.0) < 0.5;
  float halfWidth = (heavy ? 2.2 : 1.1) * 0.5 * uStroke;
  float ink = (1.0 - smoothstep(halfWidth - 0.5, halfWidth + 0.5, dist)) * (heavy ? 1.0 : 0.62);
  if (level < 0.5 || level > LEVELS - 0.5) ink = 0.0;

  // The fade the CSS mask used: in by the top, gone before the page content.
  float fade = clamp(vUv.y / 0.18, 0.0, 1.0) * clamp((0.96 - vUv.y) / 0.41, 0.0, 1.0);

  float alpha = ink * fade * uInk.a;
  outColor = vec4(uInk.rgb * alpha, alpha);
}
`

const canvas = ref<HTMLCanvasElement | null>(null)
const unsupported = ref(false)
const reduced = usePreferredReducedMotion()
const { resolved } = useTheme()

const live = computed(() => !unsupported.value && reduced.value !== 'reduce')

/** Everything the running renderer owns, so teardown can let go of all of it. */
let gl: WebGL2RenderingContext | null = null
let program: WebGLProgram | null = null
let uniforms: Record<string, WebGLUniformLocation | null> = {}
let buffer: WebGLBuffer | null = null
let texture: WebGLTexture | null = null
let observer: ResizeObserver | null = null
let intersect: IntersectionObserver | null = null
let raf = 0

let size = { w: 0, h: 0, dpr: 1 }
let visible = true
let last = 0
let elapsed = 0

const pointer = { x: -9999, y: -9999, tx: -9999, ty: -9999, hover: 0, target: 0 }
const scroll = { y: 0, flow: 0 }

/**
 * The ink colour, straight out of the theme token. Painting it into a 1x1
 * canvas is the shortest honest way to turn an oklch string into the four
 * numbers a shader wants; the sentinel catches a browser that won't parse it.
 */
function readInk(el: HTMLElement): [number, number, number, number] {
  const token = getComputedStyle(el).getPropertyValue('--topo-ink').trim()
  const probe = document.createElement('canvas')
  probe.width = probe.height = 1
  const ctx = probe.getContext('2d', { willReadFrequently: true })
  if (!ctx || !token) return [0, 0, 0, 0.2]

  ctx.fillStyle = '#ff00ff'
  ctx.fillStyle = token
  if (ctx.fillStyle === '#ff00ff') return [0, 0, 0, 0.2]

  ctx.clearRect(0, 0, 1, 1)
  ctx.fillRect(0, 0, 1, 1)
  const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data
  return [r! / 255, g! / 255, b! / 255, a! / 255]
}

function compile(context: WebGL2RenderingContext, type: number, source: string) {
  const shader = context.createShader(type)!
  context.shaderSource(shader, source)
  context.compileShader(shader)
  if (!context.getShaderParameter(shader, context.COMPILE_STATUS)) {
    console.warn('topo field:', context.getShaderInfoLog(shader))
    context.deleteShader(shader)
    return null
  }
  return shader
}

function resize() {
  const el = canvas.value
  if (!el || !gl) return

  const rect = el.getBoundingClientRect()
  if (!rect.width || !rect.height) return

  // Cap the buffer so a wide hero on a dense screen doesn't ask for a fill rate
  // nobody has. Contours are thin, but they are the whole picture, so the last
  // resort is fewer device pixels rather than a cheaper shader.
  const budget = 3_200_000
  const area = rect.width * rect.height
  const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(budget / area)))

  size = { w: rect.width, h: rect.height, dpr }
  el.width = Math.round(rect.width * dpr)
  el.height = Math.round(rect.height * dpr)
  gl.viewport(0, 0, el.width, el.height)
}

function tick(now: number) {
  raf = requestAnimationFrame(tick)
  if (!gl || !program || !size.w) return

  const dt = last ? Math.min((now - last) / 1000, 0.05) : 0.016
  last = now
  elapsed += dt

  // The rise has weight: it trails a long way behind a moving cursor and takes
  // its time arriving, so the map reads as ground rather than a cursor effect.
  const follow = 1 - Math.exp(-dt * 2.2)
  pointer.x += (pointer.tx - pointer.x) * follow
  pointer.y += (pointer.ty - pointer.y) * follow
  pointer.hover += (pointer.target - pointer.hover) * (1 - Math.exp(-dt * 1.6))

  // Scroll energy: slow to build, slower to let go, which is what makes the
  // swell keep rolling for a while after the page has stopped.
  const y = window.scrollY
  const energy = Math.min(Math.abs(y - scroll.y) / 34, 1)
  scroll.y = y
  scroll.flow += (energy - scroll.flow) * (1 - Math.exp(-dt * (energy > scroll.flow ? 5 : 0.9)))

  // background-size: cover, worked out in field units: the shorter axis fills
  // and the longer one crops, centred across and pinned to the top.
  const scale = Math.max(size.w / TOPO.width, size.h / TOPO.height)
  const cropX = (TOPO.width - size.w / scale) / 2

  gl.uniform2f(uniforms.uSize!, size.w, size.h)
  gl.uniform1f(uniforms.uStroke!, scale * size.dpr)
  gl.uniform2f(uniforms.uFieldScale!, 1 / (scale * TOPO.width), 1 / (scale * TOPO.height))
  gl.uniform2f(uniforms.uFieldOffset!, cropX / TOPO.width, 0)
  gl.uniform2f(uniforms.uPointer!, pointer.x, pointer.y)
  gl.uniform1f(uniforms.uHover!, pointer.hover)
  gl.uniform1f(uniforms.uTime!, elapsed)
  gl.uniform1f(uniforms.uScroll!, y)
  gl.uniform1f(uniforms.uFlow!, scroll.flow)

  gl.clear(gl.COLOR_BUFFER_BIT)
  gl.drawArrays(gl.TRIANGLES, 0, 3)
}

function play() {
  if (raf || !visible || document.hidden || !gl) return
  last = 0
  raf = requestAnimationFrame(tick)
}

function pause() {
  cancelAnimationFrame(raf)
  raf = 0
}

function paintInk() {
  const el = canvas.value
  if (!gl || !program || !el) return
  gl.useProgram(program)
  gl.uniform4fv(uniforms.uInk!, readInk(el))
}

function onPointerMove(event: PointerEvent) {
  const el = canvas.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  pointer.tx = event.clientX - rect.left
  pointer.ty = event.clientY - rect.top

  const inside =
    pointer.tx > -60 &&
    pointer.ty > -60 &&
    pointer.tx < rect.width + 60 &&
    pointer.ty < rect.height + 60
  pointer.target = inside ? 1 : 0

  // A pointer that has never been near the map shouldn't drag a hill in from
  // the corner the first time it arrives.
  if (pointer.x < -1000) {
    pointer.x = pointer.tx
    pointer.y = pointer.ty
  }
}

/** The cursor left the window, so it left the map. */
function onPointerOut(event: PointerEvent) {
  if (!event.relatedTarget) pointer.target = 0
}

function onVisibility() {
  if (document.hidden) pause()
  else play()
}

/** A dropped context is not worth recovering from: hand the map back to CSS. */
function onContextLost(event: Event) {
  event.preventDefault()
  teardown()
  unsupported.value = true
}

function init() {
  const el = canvas.value
  if (!el) return

  const context = el.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: 'low-power',
  })
  if (!context) {
    unsupported.value = true
    return
  }

  const vertex = compile(context, context.VERTEX_SHADER, VERT)
  const fragment = compile(context, context.FRAGMENT_SHADER, FRAG)
  if (!vertex || !fragment) {
    unsupported.value = true
    return
  }

  program = context.createProgram()!
  context.attachShader(program, vertex)
  context.attachShader(program, fragment)
  context.linkProgram(program)
  context.deleteShader(vertex)
  context.deleteShader(fragment)
  if (!context.getProgramParameter(program, context.LINK_STATUS)) {
    console.warn('topo field:', context.getProgramInfoLog(program))
    unsupported.value = true
    program = null
    return
  }

  gl = context
  gl.useProgram(program)

  for (const name of [
    'uSize',
    'uStroke',
    'uFieldScale',
    'uFieldOffset',
    'uLattice',
    'uRange',
    'uTotal',
    'uInk',
    'uPointer',
    'uHover',
    'uTime',
    'uScroll',
    'uFlow',
  ]) {
    uniforms[name] = gl.getUniformLocation(program, name)
  }

  // One triangle big enough to cover the clip square. Cheaper than a quad and
  // there is no seam down the diagonal.
  buffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  const attribute = gl.getAttribLocation(program, 'aPos')
  gl.enableVertexAttribArray(attribute)
  gl.vertexAttribPointer(attribute, 2, gl.FLOAT, false, 0, 0)

  const field = buildTopoField()
  texture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.R32F,
    field.band,
    field.band * field.octaves,
    0,
    gl.RED,
    gl.FLOAT,
    field.lattice,
  )

  gl.uniform1i(uniforms.uLattice!, 0)
  gl.uniform2f(uniforms.uRange!, field.min, field.max)
  gl.uniform1f(uniforms.uTotal!, field.total)
  paintInk()

  gl.enable(gl.BLEND)
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
  gl.clearColor(0, 0, 0, 0)

  scroll.y = window.scrollY

  observer = new ResizeObserver(resize)
  observer.observe(el)
  resize()

  // Nothing to draw while the hero is off screen, and a hero is the first thing
  // you scroll past.
  intersect = new IntersectionObserver(
    ([entry]) => {
      visible = entry?.isIntersecting ?? true
      if (visible) play()
      else pause()
    },
    { rootMargin: '10% 0px' },
  )
  intersect.observe(el)

  el.addEventListener('webglcontextlost', onContextLost)
  window.addEventListener('pointermove', onPointerMove, { passive: true })
  window.addEventListener('pointerout', onPointerOut, { passive: true })
  document.addEventListener('visibilitychange', onVisibility)
  play()
}

function teardown() {
  pause()
  canvas.value?.removeEventListener('webglcontextlost', onContextLost)
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerout', onPointerOut)
  document.removeEventListener('visibilitychange', onVisibility)
  observer?.disconnect()
  intersect?.disconnect()
  observer = intersect = null

  if (gl) {
    gl.deleteProgram(program)
    gl.deleteBuffer(buffer)
    gl.deleteTexture(texture)
    gl.getExtension('WEBGL_lose_context')?.loseContext()
  }
  gl = null
  program = null
  buffer = null
  texture = null
  uniforms = {}
  elapsed = 0
}

onMounted(() => {
  if (live.value) init()
})

watch(live, async (on) => {
  if (!on) return teardown()
  await nextTick()
  init()
})

// The ink is a theme token, and the shader holds a copy of it. Post-flush, so
// the new value is already on the document element when we go looking for it.
watch(resolved, () => paintInk(), { flush: 'post' })

onBeforeUnmount(teardown)
</script>

<template>
  <canvas v-if="live" ref="canvas" class="topo-canvas" aria-hidden="true" />
  <span v-else class="topo" aria-hidden="true" />
</template>

<style scoped>
/**
 * Width comes from the utility classes on the element. A canvas is a replaced
 * element, so it would otherwise take its intrinsic 300x150 ratio rather than
 * the height its top and bottom offsets imply — and a scoped rule sits outside
 * Tailwind's layer, so anything set here would quietly beat the utility.
 */
.topo-canvas {
  display: block;
  height: 100%;
}
</style>
