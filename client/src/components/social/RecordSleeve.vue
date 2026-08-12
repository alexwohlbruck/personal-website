<script setup lang="ts">
/**
 * An album cover as the sleeve it came in, with the record itself sitting
 * behind it and its outer edge showing past the right side.
 *
 * The spin has to be legible from a crescent a few pixels wide, and concentric
 * grooves look identical at every angle, so the thing that actually reads as
 * rotation is the conic sheen sweeping across them. The grooves are texture;
 * the highlight is the motion.
 *
 * How far the record is pulled out doubles as the play indicator: it slides
 * proud of the sleeve while something is playing and tucks back in when it
 * stops, so the state is visible even before the label underneath is read.
 */
withDefaults(
  defineProps<{
    artwork?: string
    alt?: string
    /** Edge length of the sleeve in px. Everything else is a ratio of it. */
    size?: number
    playing?: boolean
  }>(),
  { artwork: undefined, alt: '', size: 96, playing: false },
)
</script>

<template>
  <span class="sleeve" :class="playing && 'is-playing'" :style="{ '--cover': `${size}px` }">
    <span class="slot" aria-hidden="true">
      <span class="disc">
        <span class="grooves" />
        <span class="sheen" />
        <span class="label" :style="artwork && { backgroundImage: `url(${artwork})` }" />
        <span class="hole" />
      </span>
    </span>

    <span class="cover">
      <img v-if="artwork" :src="artwork" :alt="alt" />
      <span v-else class="blank" />
      <slot />
    </span>
  </span>
</template>

<style scoped>
.sleeve {
  /* How far the record clears the sleeve, as a fraction of the sleeve. */
  --peek: 0.17;
  --disc: calc(var(--cover) * 0.94);

  position: relative;
  display: block;
  flex-shrink: 0;
  width: calc(var(--cover) * (1 + var(--peek)));
  height: var(--cover);
}

.sleeve.is-playing {
  --peek: 0.34;
}

/* Positioning and rotation are kept on separate elements: the slot holds the
   record where it belongs, the disc inside it is free to own `transform`. */
.slot {
  position: absolute;
  top: 50%;
  left: calc(var(--cover) * (1 + var(--peek)) - var(--disc));
  width: var(--disc);
  height: var(--disc);
  margin-top: calc(var(--disc) / -2);
  transition: left 0.7s var(--ease-out-quint);
}

.disc {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background:
    /* A worn ring near the edge, where a stylus spends the least time. */
    radial-gradient(circle at 50% 50%, transparent 0 78%, oklch(100% 0 0 / 0.05) 82%, transparent 86%),
    var(--vinyl);
  box-shadow:
    0 0 0 1px oklch(0% 0 0 / 0.5),
    inset 0 0 0 1px oklch(100% 0 0 / 0.07),
    var(--shadow-2);
  animation: spin-slow 4s linear infinite;
  animation-play-state: paused;
}

.is-playing .disc {
  animation-play-state: running;
}

.grooves {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  /* Lands close to a pixel per groove at the sizes this is used at, which is
     fine: at the point they alias into a sheet they still read as vinyl. */
  background: repeating-radial-gradient(
    circle at 50% 50%,
    oklch(100% 0 0 / 0.055) 0 1px,
    transparent 1px 3px
  );
  mask-image: radial-gradient(circle at 50% 50%, transparent 0 26%, #000 30%);
}

/* The only asymmetric thing on the record, and so the only reason the spin is
   visible at all. Two opposed highlights, as a light source would give. */
.sheen {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: conic-gradient(
    from 210deg,
    transparent 0deg,
    oklch(100% 0 0 / 0.14) 26deg,
    transparent 62deg,
    transparent 180deg,
    oklch(100% 0 0 / 0.09) 206deg,
    transparent 242deg,
    transparent 360deg
  );
  mask-image: radial-gradient(circle at 50% 50%, transparent 0 28%, #000 34%);
}

.label {
  position: absolute;
  inset: 27%;
  border-radius: 50%;
  background-color: var(--accent-solid);
  background-size: cover;
  background-position: center;
  box-shadow: inset 0 0 0 1px oklch(0% 0 0 / 0.3);
}

.hole {
  position: absolute;
  inset: 47.5%;
  border-radius: 50%;
  background: var(--paper);
  box-shadow: inset 0 0 0 1px oklch(0% 0 0 / 0.35);
}

.cover {
  position: absolute;
  inset: 0 auto 0 0;
  display: block;
  width: var(--cover);
  overflow: hidden;
  /* Square but for the spine, like the real thing. */
  border-radius: 2px 5px 5px 2px;
  box-shadow: var(--sheen), var(--tile-ring), var(--shadow-2);
}

.cover img,
.blank {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.blank {
  background: var(--paper-sunk);
}

/* A record is black on any paper. In the dark theme that is nearly the page
   colour, so it gets lifted just far enough to keep an edge. */
.sleeve {
  --vinyl: radial-gradient(circle at 34% 26%, oklch(24% 0.008 40), oklch(13% 0.006 40) 72%);
}

[data-theme='dark'] .sleeve {
  --vinyl: radial-gradient(circle at 34% 26%, oklch(31% 0.01 40), oklch(19% 0.008 40) 72%);
}

@media (prefers-reduced-motion: reduce) {
  .slot {
    transition: none;
  }
}
</style>
