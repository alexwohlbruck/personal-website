<script setup lang="ts">
import {
  cachedDrawingPath,
  itemTransform,
  stickyCreasePath,
  stickyFill,
  stickyFoldPath,
  stickyPath,
  stickyTextStyle,
  textStyle,
  type GuestbookItem,
} from '@/lib/guestbook'

/**
 * One mark, drawn the one way marks are drawn.
 *
 * The canvas and the card on the home page both render through this, so the
 * preview is a smaller view of the same board rather than an impression of it.
 * Nothing here knows about selection, tools or saving: it takes a mark and
 * draws it. What the canvas adds on top — a grab target for thin strokes, a
 * text editor in place of the text — comes in through `grab` and the slot.
 */
withDefaults(
  defineProps<{
    item: GuestbookItem
    /**
     * How wide a stroke is to hit, as opposed to how wide it looks. Pointer
     * events on a path only land on the stroke itself, and a one pixel line at
     * low zoom is a target nobody can hit with a finger. Left out on the home
     * page, where there is nothing to hit.
     */
    grab?: number
    /** Show the slot in place of the text body, for editing it in place. */
    editing?: boolean
  }>(),
  { grab: 0, editing: false },
)
</script>

<template>
  <g :opacity="item.draft ? 0.82 : 1" :transform="itemTransform(item)">
    <template v-if="item.kind === 'drawing'">
      <!-- Invisible and a little fatter, so a thin line can still be grabbed. -->
      <path
        v-if="grab"
        :d="cachedDrawingPath(item.points)"
        fill="none"
        stroke="transparent"
        :stroke-width="grab"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        :d="cachedDrawingPath(item.points)"
        fill="none"
        :stroke="item.color"
        :stroke-width="item.width"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="mark-ink"
      />
    </template>

    <template v-else-if="item.kind === 'text'">
      <foreignObject :x="item.x" :y="item.y" :width="item.width" :height="item.height">
        <slot v-if="editing" />
        <div v-else class="canvas-display canvas-text-display" :style="textStyle(item)">{{ item.text }}</div>
      </foreignObject>
    </template>

    <template v-else-if="item.kind === 'sticky'">
      <path :d="stickyPath(item)" :fill="stickyFill[item.color]" filter="url(#guest-shadow)" />
      <path :d="stickyFoldPath(item)" fill="url(#note-fold)" />
      <path :d="stickyCreasePath(item)" fill="none" stroke="#5c4024" stroke-opacity="0.18" stroke-width="1.5" />
      <foreignObject :x="item.x + 14" :y="item.y + 15" :width="item.width - 28" :height="item.height - 28">
        <slot v-if="editing" />
        <div v-else class="canvas-display sticky-copy" :style="stickyTextStyle(item)">{{ item.text }}</div>
      </foreignObject>
    </template>

    <text
      v-else-if="item.kind === 'emoji'"
      :x="item.x"
      :y="item.y"
      :font-size="item.size"
      text-anchor="middle"
      dominant-baseline="central"
    >{{ item.emoji }}</text>

    <g v-else-if="item.kind === 'image'">
      <rect :x="item.x - 6" :y="item.y - 6" :width="item.width + 12" :height="item.height + 12" rx="5" fill="#fffdf7" filter="url(#guest-shadow)" />
      <!-- The stamp stands in until the upload itself has been fetched. -->
      <image
        :href="item.src ?? item.thumb"
        :x="item.x"
        :y="item.y"
        :width="item.width"
        :height="item.height"
        preserveAspectRatio="xMidYMid meet"
      />
    </g>
  </g>
</template>

<style scoped>
.mark-ink { pointer-events: none; }
.canvas-display {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  margin: 0;
  border: 0;
  background: transparent;
  outline: 0;
  overflow: hidden;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.canvas-text-display { padding: 3px; line-height: 1.12; white-space: pre; overflow-wrap: normal; }
.sticky-copy { padding: 2px; line-height: 1.35; }
</style>
