---
title: The subsystem that became a product
date: 2026-08-17
summary: The free APIs were not too expensive. They were unchangeable. Building my own geospatial engine split the architecture in two, and the half that holds no personal data turned out to be a business.
tags: [parchment, barrelman, maps, openstreetmap, architecture]
series: Parchment devlog
part: 4
---

I did not set out to build a second product. Like the capabilities system in
[the last entry](/blog/parchment-provider-capabilities), Barrelman arrived
because [Parchment](/projects/parchment) kept asking for things I had no way to
provide.

## You get what you pay for

[Part two](/blog/where-parchment-started) was about rate limits and shared
instances. Those problems have obvious answers. The one that does not is
simpler: **I had no way to change any of it.**

Over and over I designed a feature, then found that the API behind it had no
support for the thing, and no way for me to add it.

**Search**

- **Fuzzy matching**, so a typo still lands on the right place.
- **Acronyms**, so "UNCC" resolves to the University of North Carolina at
  Charlotte.
- **Search along a route**, for finding a gas station without abandoning the trip.
- **Brand search**, so "Target" means the chain rather than one arbitrary store.
- **Intersections**. "42nd & Broadway" is how people name a corner, and no
  geocoder I tried understood one.

**Routing**

- **Transit routing that shares a graph with point-to-point routing.** One trip
  walks, rides and walks again as a single result, rather than three stitched
  together.

**Everything else**

- **Isochrones**, for how far you get in twenty minutes.
- **Spatial queries**, for what contains this place and what it contains.
- **Tiles that carry what I wanted to draw.** No commercial tile server renders
  bicycle parking.

None of these are exotic. Each one is ordinary work if you own the index, and
impossible if you do not.

<Figure
  project="parchment"
  file="search.png"
  alt="Parchment's search palette, with saved places, category chips and recent results"
  caption="The search palette. Frequents, categories, recents, brands, and more are all supported in a unified API."
/>

## So I built the index

The first piece was **Pelias**, in May 2025. It is an open source geocoder that builds
a search index from an OpenStreetMap extract. I pointed it at one city, then at
larger ones.

That taught me the shape of the work. Import a large extract. Build the indexes,
keep them fresh, and answer fast enough that an autocomplete field feels instant.
It is a real system, not a URL. It is also the first thing in this story that was
genuinely mine to change.

Then the problem from part two came back, one level down. A planet-scale
geospatial API is not a homelab workload. Hundreds of gigabytes, hours of index
building, and a standing job to keep it current. I was not going to ask anyone to
run that to look up a coffee shop.

## Personal data and geographic data are not the same thing

This is the part I am pleased with, and it took me way too long to see.

People self-host for two reasons: privacy and cost. So I asked which half of
Parchment those reasons actually apply to.

Privacy applies to your account, your saved places, your collections, your
location history. **It does not apply to a search index of the planet.** Street
geometry and shop opening hours are public facts. There is nothing of yours in
there to protect.

So the architecture splits along that line:

- **The Parchment server** holds everything personal. It stays small, and it
  stays self-hostable on modest hardware.
- **Barrelman** holds the world. Search, tiles, routing and transit, all from one
  OpenStreetMap import, centrally hosted.

You keep the half that is about you. I run the half that is about the planet, and
running it once for everybody is the only sane way to run it at all.

## It plugged straight in

Here is where the previous rewrite paid for itself twice over.

Barrelman needed no special treatment inside Parchment. It is an integration that
fills capabilities, exactly like Nominatim or Geoapify. I wrote the adapters,
filled in the configuration, and the app treated my own backend as one more third
party.

That let it take over one capability at a time rather than in one release:

| When | What moved |
|---|---|
| March 2026 | Place search |
| April 2026 | Vector tiles, on an [OpenMapTiles](https://openmaptiles.org/) schema |
| April 2026 | Routing |
| May 2026 | Transit routing, then departure boards |
| June 2026 | Geocoding, with the public endpoints kept as fallbacks |

Nothing above the adapter layer moved at all.

## Two things I did not expect

### It is a business

[Mapbox](https://www.mapbox.com/), [Geoapify](https://www.geoapify.com/) and
[Google Maps Platform](https://mapsplatform.google.com/) all sell exactly this.
I built a competitor by accident, and it pays for the thing that produced it.

So Barrelman sells API access, and the pricing follows the principle the whole
project runs on: **free for individuals, paid for enterprise.** One credit balance
covers every endpoint. It's a beautifully simple idea that could subsidize the consumer app I don't want to have to sell.

<Figure
  project="barrelman"
  file="pricing.jpg"
  alt="Barrelman's pricing page, with four tiers and one shared credit balance"
  caption="Geocoding, routing, tiles and transit all draw on one balance. A free tier covers evaluation and personal use, and paid tiers start at $19."
/>

### It self-hosts after all

The other surprise came from a friend. Jackson Sippe wanted to use Parchment in
Colorado, and my staging server carried a partial import that did not reach that
far. So he asked me to stand up an instance covering it.

I started to do exactly that, and then realized I had the shape of it backwards.
I had been importing a single region on my own development machine for months,
because iterating against a planet import is impractical. That is not a
development shortcut. That is the deployment model, and Jackson could just run
his own Colorado instance.

So regions became a real feature. You name an area, and Barrelman resolves what
to import from it: the OpenStreetMap extract, the transit search area, the
address files, the census codes. Nobody assembles a list of data sources by hand.

<Figure
  post="parchment-barrelman-split"
  file="region-import.png"
  alt="Barrelman's new region dialog, with Colorado's boundary auto-filled and an editable bounding box"
  caption="Type a place name and the boundary catalog fills in the rest. The bounding box stays editable, because a state line is not always the area you want."
/>

So a self-hoster imports the area they actually live in, which can run on modest consumer hardware. Anything outside it falls back to the
central Barrelman instance.

And that fallback is where the two surprises meet. Out-of-region requests draw on
the same free quota every other developer account gets. Somebody self-hosting
Colorado who occasionally routes across the country never pays me anything. When
that occasional turns into steady traffic, they buy credits, and that is the
business.

The line between free and paid ends up drawn by actual usage rather than by a
plan tier, which is the version of this I always wanted. Full self-hosting for
the data you use daily, a shared service for the rest of the planet, and the same
app on top of both. That is the goal from part one, reached by a route I did not
plan.

Next: [Where Parchment stands, and what is left](/blog/parchment-where-it-stands).
