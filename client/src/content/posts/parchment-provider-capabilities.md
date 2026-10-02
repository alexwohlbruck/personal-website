---
title: Making map providers swappable
date: 2026-08-17
summary: Parchment's code used to reference every map service by name, which made changing anything painful. I borrowed the way Home Assistant handles devices, and now switching providers doesn't mean rewriting features.
tags: [parchment, maps, openstreetmap, architecture]
series: Parchment devlog
part: 3
---

By spring 2025, [Parchment](/projects/parchment) talked to a handful of external
services, and the application code referred to every one of them by name. Adding
another meant changing search, the place details page, and the logic that merged
results between them.

That setup also made decisions harder, since every provider choice felt
permanent. I put off picking a routing engine for months because I thought I'd
be stuck with all of its quirks forever.

## Borrowing an idea from Home Assistant

I run [Home Assistant](https://www.home-assistant.io/) on my homelab, and it
handles this exact problem so well that I'd stopped noticing it.

Home Assistant doesn't care about Hue bulbs or Zigbee switches specifically. It
cares about **lights**. An integration tells it that some device is a light, and
from then on every dashboard, automation and voice command treats it as a light,
whatever the brand. You can swap the hardware without changing anything that
uses it.

I wanted the same thing for Parchment.

## Capabilities

So instead of defining a geocoder, a router and a tile server, I defined a list
of **capabilities**. A capability is one job that a maps app needs done:

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

There are twenty-two of them now. Each integration declares which capabilities it
supports, and the app asks for a capability instead of a specific vendor. A
request for `routing` goes to whichever integration is configured to handle it.

<Figure
  project="parchment"
  file="integrations.png"
  alt="Parchment's integrations settings, with a card for each provider"
  caption="Each card lists the capabilities that provider supports. The badges show whether it runs in the cloud or on your own hardware, and whether it responded the last time it was called."
/>

## Adapters

The other half is converting each provider's data, and that turned out to be
less work than I expected. Each integration includes an **adapter** that turns
the provider's response into Parchment's own types.

There's one `Place` type in the app. It has geometry, an address, opening hours,
transit details, links to parent and child places, and attribution for each
field. Every adapter returns that, no matter what the provider sent back:

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

`AttributedValue` handles attribution. A place page often combines a name from
[OpenStreetMap](https://www.openstreetmap.org/), a photo from
[Wikimedia Commons](https://commons.wikimedia.org/) and a rating from a
commercial provider, and each of those fields credits its own source.

So adding a new provider only takes a list of what it supports and one adapter
file, and nothing else in the app needs to know which provider it's using.

## What it changed

The code got a lot cleaner, and it also changed how I design features.

Choosing a routing engine stopped feeling like a big commitment.
[Valhalla](https://valhalla.github.io/valhalla/) and
[GraphHopper](https://www.graphhopper.com/) are each good at different things,
and I didn't have to get the choice right the first time. Switching is a
settings change and a new adapter instead of a rewrite.

Several providers can also answer at once. Search sends the query to every
integration that supports `search` and merges the results into one list. If one
source finds a place and another has better details for it, it shows up as a
single result.

And now when I plan a feature, I start by asking which capability it needs
instead of which service to sign up for. If nothing supports that capability yet,
the feature is just unavailable instead of broken, and it starts working as soon
as an integration supports it.

The rewrite took about three weeks and was merged all at once at the end of May
2025.

Next: [How Barrelman spun out of Parchment](/blog/parchment-barrelman-split).
