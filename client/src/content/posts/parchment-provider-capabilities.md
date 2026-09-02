---
title: Turning map providers into an interface
date: 2026-08-17
summary: Parchment stopped asking which service to call and started asking which job needs doing. The idea came from Home Assistant, and it changed how every feature after it got designed.
tags: [parchment, maps, openstreetmap, architecture]
series: Parchment devlog
part: 3
---

By spring 2025, [Parchment](/projects/parchment) talked to a handful of external
services and knew every one of them by name in application code. Adding another
meant touching search, place detail, and the merge logic between them.

The work was annoying, but the hesitation was worse. Every provider choice felt
permanent. I put off picking a routing engine for months because picking one
seemed to mean living with all of its quirks forever.

## The idea came from my house

I run [Home Assistant](https://www.home-assistant.io/) on my homelab, and it
solves this exact problem so well that I'd stopped noticing it.

Home Assistant doesn't know about Hue bulbs or Zigbee switches. It knows about
**lights**. An integration tells it that some device is a light, and from then on
every dashboard, automation and voice command works on the light. The brand stops
mattering. Swap the hardware and nothing above it moves.

Parchment needed the same thing for maps.

## Capabilities

So Parchment stopped defining a geocoder, a router and a tile server, and started
defining a list of **capabilities**. A capability is one job a map needs done:

```ts
export enum IntegrationCapabilityId {
  SEARCH = 'search',
  AUTOCOMPLETE = 'autocomplete',
  GEOCODING = 'geocoding',
  PLACE_INFO = 'placeInfo',
  ROUTING = 'routing',
  TRANSIT_ROUTING = 'transitRouting',
  STREET_VIEW = 'streetView',
  TILE_SERVER = 'tileServer',
  // and a dozen more
}
```

There are twenty-two of them now. An integration declares which ones it can fill,
and the app asks for the capability instead of the vendor. `routing` resolves to
whatever integration is configured for that job.

<Figure
  project="parchment"
  file="integrations.png"
  alt="Parchment's integrations settings, with a card for each provider"
  caption="Each card lists the capabilities that provider can fill. The badges say whether it runs in the cloud or on your own hardware, and whether it answered last time we asked."
/>

## One file per provider

The other half is translation, and it's smaller than it sounds. Each integration
ships an **adapter**, and the adapter has one job: turn that provider's response
into Parchment's own types.

There's one `Place` type in the app. It has geometry, an address, opening hours,
transit details, relations to parent and child places, and per-field attribution.
Every adapter produces that, whatever it got back from the provider:

```ts
import type {
  Place,
  PlaceGeometry,
  Address,
  AttributedValue,
  OpeningHours,
  TransitStopInfo,
} from '../../../types/place.types'
```

`AttributedValue` is the interesting one. A place page often merges a name from
[OpenStreetMap](https://www.openstreetmap.org/), a photo from
[Wikimedia Commons](https://commons.wikimedia.org/) and a rating from a
commercial provider. Each field credits its own source, since attribution belongs
to the value rather than the whole page.

That's the entire contract. A new provider is a declaration of what it can do
plus one file that speaks its dialect, and nothing above that file has to know
which provider it's talking to.

## What it actually changed

I expected cleaner code. What I got was a different way of designing features.

Choosing a routing engine stopped feeling like a commitment.
[Valhalla](https://valhalla.github.io/valhalla/) and
[GraphHopper](https://www.graphhopper.com/) are each good at different things,
and I no longer had to be right about which one to use. Trying the other is a
settings change and an adapter instead of a rewrite.

Several providers can answer at once. Search doesn't pick a winner; it asks every
integration that fills `search` and merges the results into one list. A place
found by one source and described better by another shows up as a single entry.

And I now design features against capabilities. I ask which capability a feature
needs instead of which service to sign up for. If nothing fills that capability
yet, the feature degrades instead of breaking, and it turns on the day something
does.

The rewrite took about three weeks and landed as one merge at the end of May
2025.

Next: [The subsystem that became a product](/blog/parchment-barrelman-split).
