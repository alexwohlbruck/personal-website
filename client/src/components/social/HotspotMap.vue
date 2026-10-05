<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import type { GeoJSONSource, Map as MapLibreMap } from 'maplibre-gl'
import type { OpenStreetMapHotspot } from '@/data/types'
import { useTheme } from '@/composables/useTheme'

const props = defineProps<{
  hotspots: OpenStreetMapHotspot[]
  /** The opening view frames these rather than every stray edit abroad. */
  frame: { lat: number; lon: number }[]
  /** A place to fly to. Null shows every hotspot. */
  focus: { lat: number; lon: number } | null
}>()

const STYLES = {
  light: 'https://tiles.openfreemap.org/styles/positron',
  dark: 'https://tiles.openfreemap.org/styles/dark',
}

// Density stops, haze to core: a thin marine wash for one-off edits, warming
// through amber to the site's rust where the edits pile up. Everything below
// the first stop is clear, so scattered one-off edits don't show at all.
const RAMPS: Record<'light' | 'dark', [number, string][]> = {
  light: [
    [0, 'rgba(70, 140, 165, 0)'],
    [0.18, 'rgba(70, 140, 165, 0)'],
    [0.28, 'rgba(70, 140, 165, 0.35)'],
    [0.36, 'rgba(46, 128, 150, 0.8)'],
    [0.45, '#3e9a96'],
    [0.62, '#e2b155'],
    [0.8, '#d8693b'],
    [1, '#9c2c1c'],
  ],
  dark: [
    [0, 'rgba(90, 170, 195, 0)'],
    [0.18, 'rgba(90, 170, 195, 0)'],
    [0.28, 'rgba(90, 170, 195, 0.32)'],
    [0.36, 'rgba(84, 176, 196, 0.75)'],
    [0.45, '#5cc4b4'],
    [0.62, '#f2c46b'],
    [0.8, '#f08a55'],
    [1, '#ffe2c4'],
  ],
}

/** Push the base map back so the heat is the first thing you see: lighter
 * lines and fills, quieter labels. */
function muteBasemap(instance: MapLibreMap) {
  for (const layer of instance.getStyle().layers) {
    if (layer.id.startsWith('hotspots')) continue
    if (layer.type === 'line') instance.setPaintProperty(layer.id, 'line-opacity', 0.45)
    if (layer.type === 'fill') instance.setPaintProperty(layer.id, 'fill-opacity', 0.55)
    if (layer.type === 'symbol') {
      instance.setPaintProperty(layer.id, 'text-opacity', 0.55)
      instance.setPaintProperty(layer.id, 'icon-opacity', 0.4)
    }
  }
}

const { resolved } = useTheme()
const container = ref<HTMLDivElement>()
const map = shallowRef<MapLibreMap>()

function geojson() {
  return {
    type: 'FeatureCollection' as const,
    features: props.hotspots.map(([lat, lon, count]) => ({
      type: 'Feature' as const,
      properties: { count },
      geometry: { type: 'Point' as const, coordinates: [lon, lat] },
    })),
  }
}

function addLayers(instance: MapLibreMap) {
  const ramp = RAMPS[resolved.value].flat()
  muteBasemap(instance)
  const max = Math.max(...props.hotspots.map(([, , count]) => count), 1)

  instance.addSource('hotspots', { type: 'geojson', data: geojson() })
  instance.addLayer({
    id: 'hotspots-heat',
    type: 'heatmap',
    source: 'hotspots',
    paint: {
      // Square-root weighting: the busiest blocks still dominate, and a lone
      // edit on a trip (about a tenth of the top bin's weight) stays below
      // the ramp's transparent floor unless it has neighbours.
      'heatmap-weight': ['sqrt', ['/', ['get', 'count'], max]],
      // Points sit about 100 m apart. The radius has to keep growing with
      // zoom or the bins separate into a visible lattice up close.
      'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 2, 0.6, 10, 1, 13, 2, 15, 3],
      'heatmap-radius': ['interpolate', ['exponential', 2], ['zoom'], 2, 4, 10, 10, 15, 48],
      'heatmap-opacity': 0.9,
      'heatmap-color': ['interpolate', ['linear'], ['heatmap-density'], ...ramp] as never,
    },
  })
}

function fitAll(instance: MapLibreMap, animate = true) {
  const points = props.frame.length
    ? props.frame
    : props.hotspots.map(([lat, lon]) => ({ lat, lon }))
  if (!points.length) return
  const lats = points.map((spot) => spot.lat)
  const lons = points.map((spot) => spot.lon)
  instance.fitBounds(
    [
      [Math.min(...lons), Math.min(...lats)],
      [Math.max(...lons), Math.max(...lats)],
    ],
    { padding: 40, maxZoom: 11, animate },
  )
}

onMounted(async () => {
  const [maplibregl, { default: workerUrl }] = await Promise.all([
    import('maplibre-gl'),
    // MapLibre looks for its worker beside its own module, which is not where
    // Vite puts either file. Bundle the worker separately and hand it over.
    import('maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'),
    import('maplibre-gl/dist/maplibre-gl.css'),
  ])
  if (!container.value) return
  maplibregl.setWorkerUrl(workerUrl)

  const instance = new maplibregl.Map({
    container: container.value,
    style: STYLES[resolved.value],
    center: [-77, 38],
    zoom: 3,
    attributionControl: { compact: true },
    // Any closer and the ~100 m bins pull apart into separate blobs.
    maxZoom: 13,
  })
  instance.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')
  instance.on('style.load', () => addLayers(instance))
  fitAll(instance, false)
  map.value = instance
})

watch(resolved, (theme) => map.value?.setStyle(STYLES[theme], { diff: false }))

watch(
  () => props.hotspots,
  () => (map.value?.getSource('hotspots') as GeoJSONSource | undefined)?.setData(geojson()),
)

watch(
  () => props.focus,
  (place) => {
    if (!map.value) return
    if (!place) fitAll(map.value)
    else
      map.value.flyTo({
        center: [place.lon, place.lat],
        zoom: 11,
        duration: 1400,
      })
  },
)

onBeforeUnmount(() => map.value?.remove())
</script>

<template>
  <div ref="container" class="hotspot-map size-full" />
</template>

<style scoped>
/* overflow: hidden on the card is not enough in Safari: the WebGL canvas gets
   its own compositing layer and paints square corners over the rounding. */
/* MapLibre forces position/overflow on these, and the canvas is a GPU layer
   that can ignore an ancestor's rounding, so every level gets the radius and
   the mask (the classic WebKit fix for clipped composited layers). */
.hotspot-map,
.hotspot-map :deep(.maplibregl-canvas-container),
.hotspot-map :deep(canvas) {
  border-radius: 0.875rem;
}

.hotspot-map {
  overflow: hidden;
  clip-path: inset(0 round 0.875rem);
  -webkit-mask-image: -webkit-radial-gradient(white, black);
  mask-image: radial-gradient(white, black);
}

.hotspot-map :deep(.maplibregl-ctrl-attrib) {
  font-size: 10px;
}
</style>
