A maps and navigation app built on open data and open source software.
[OpenStreetMap](https://www.openstreetmap.org/) is the largest open map of the
world, and the apps built on it are mostly poor. Parchment is my attempt at the
missing piece: an OpenStreetMap client that is good enough for daily use. Run it
hosted, or run the whole stack on your own hardware.

<Figure
  project="parchment"
  file="main.png"
  alt="Parchment's globe view, with the Atlantic and labeled cities"
  caption="Zoom far enough out and the map becomes a globe. All of it is OpenStreetMap data, styled rather than licensed."
/>

Parchment depends on no single map provider. It defines a set of capabilities,
such as search, routing, transit data and tiles, and any provider can fill any of
them. In the end I built my own provider for the job. Then I split it into a
separate product: [Barrelman](/projects/barrelman), a commercial geospatial API
billed by usage.

Today Parchment runs on the web, iOS, Android and desktop from one codebase. It
covers search, directions, transit, saved places and offline regions. I keep a
devlog of how it got here and where it is going, starting with
[How I built a maps app on open data](/blog/building-parchment-on-open-data).
