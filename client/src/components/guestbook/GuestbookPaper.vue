<script setup lang="ts">
/**
 * The paper the marks sit on, and the definitions they draw with.
 *
 * Shared so that the card on the home page is looking at the same sheet as the
 * canvas: same grid at the same spacing, same drop shadow under a note, same
 * gradient on its folded corner. The ids are referenced by GuestbookMark, so
 * one of these has to be present wherever marks are drawn.
 */
defineProps<{ frame: { x: number; y: number; width: number; height: number } }>()
</script>

<template>
  <defs>
    <pattern id="guest-grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 16 20 H 24 M 20 16 V 24" stroke="#cfc2ae" stroke-width="0.8" />
    </pattern>
    <filter id="guest-shadow" x="-20%" y="-20%" width="140%" height="150%">
      <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#32170f" flood-opacity="0.22" />
    </filter>
    <linearGradient id="note-fold" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity="0.58" />
      <stop offset="0.58" stop-color="#fff" stop-opacity="0.18" />
      <stop offset="1" stop-color="#5c4024" stop-opacity="0.2" />
    </linearGradient>
  </defs>
  <rect :x="frame.x" :y="frame.y" :width="frame.width" :height="frame.height" fill="#f6f0e5" />
  <rect :x="frame.x" :y="frame.y" :width="frame.width" :height="frame.height" fill="url(#guest-grid)" />
</template>
