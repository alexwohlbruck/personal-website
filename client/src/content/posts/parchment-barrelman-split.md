---
title: The subsystem that became a product
date: 2026-08-17
summary: The free APIs were not too expensive. They were unchangeable. Building my own geospatial engine split the architecture in two, and the half that holds no personal data turned out to be a business.
tags: [parchment, barrelman, maps, openstreetmap, architecture]
series: Parchment devlog
part: 4
---

I didn't set out to build a second product. Like the capabilities system in
[the last entry](/blog/parchment-provider-capabilities), Barrelman happened
because [Parchment](/projects/parchment) kept needing things I had no way to
provide.

## You get what you pay for

[Part two](/blog/where-parchment-started) was about rate limits and shared
instances. Those problems have obvious answers. The one that doesn't is simpler:
**I couldn't change any of it.**

Over and over I'd design a feature, then find that the API behind it didn't
support the thing and had no way for me to add it.

**Search**

- **Fuzzy matching**, so a typo still lands on the right place.
- **Acronyms**, so "UNCC" resolves to the University of North Carolina at
  Charlotte.
- **Search along a route**, so you can find a gas station without abandoning the
  trip.
- **Brand search**, so "Target" means the chain and not one random store.
- **Intersections**. "42nd & Broadway" is how people refer to a corner, and no
  geocoder I tried understood one.

**Routing**

- **Transit routing that shares a graph with point-to-point routing**, so a trip
  that walks, rides and walks again comes back as one result instead of three
  stitched together.

**Everything else**

- **Isochrones**, for how far you can get in twenty minutes.
- **Spatial queries**, for what contains this place and what it contains.
- **Tiles that include the things I actually wanted to draw.** No commercial tile
  server renders bicycle parking.

None of this is exotic. It's all ordinary work if you own the index and
impossible if you don't.

<Figure
  project="parchment"
  file="search.png"
  alt="Parchment's search palette, with saved places, category chips and recent results"
  caption="The search palette. Frequents, categories, recents, brands, and more are all supported in a unified API."
/>

## So I built the index

The first piece was **Pelias**, in May 2025. It's an open source geocoder that
builds a search index from an OSM extract. I pointed it at one city, then at
bigger ones.

That taught me what the work actually looks like. Import a big extract. Build the
indexes, keep them fresh, and answer fast enough that an autocomplete field feels
instant. It's a real system rather than a URL, and it was also the first thing in
this story I could change myself.

Then the problem from part two came back one level down. A planet-scale
geospatial API is not a homelab workload. Hundreds of gigabytes, hours of index
building, and a standing job to keep it current. I wasn't going to ask anyone to
run that to look up a coffee shop.

## Personal data and geographic data aren't the same thing

This is the part I'm most pleased with, and it took me way too long to see.

People self-host for two reasons: privacy and cost. So I asked which half of
Parchment those reasons actually apply to.

Privacy applies to your account, your saved places, your collections, your
location history. **It doesn't apply to a search index of the planet.** Street
geometry and shop opening hours are public facts. There's nothing of yours in
there to protect.

So the architecture splits along that line:

- **The Parchment server** holds everything personal. It stays small and
  self-hostable on modest hardware.
- **Barrelman** holds the world: search, tiles, routing and transit, all from one
  OSM import, centrally hosted.

You keep the half that's about you. I run the half that's about the planet, and
running it once for everyone is the only sane way to run it.

## It plugged straight in

This is where the capabilities rewrite paid off a second time.

Barrelman needed no special treatment inside Parchment. It's an integration that
fills capabilities, same as Nominatim or Geoapify. I wrote the adapters, filled
in the config, and the app treated my own backend as one more third party.

That meant it could take over one capability at a time instead of in one big
release:

| When | What moved |
|---|---|
| March 2026 | Place search |
| April 2026 | Vector tiles, on an [OpenMapTiles](https://openmaptiles.org/) schema |
| April 2026 | Routing |
| May 2026 | Transit routing, then departure boards |
| June 2026 | Geocoding, with the public endpoints kept as fallbacks |

Nothing above the adapter layer changed.

## Two things I didn't expect

### It's a business

[Mapbox](https://www.mapbox.com/), [Geoapify](https://www.geoapify.com/) and
[Google Maps Platform](https://mapsplatform.google.com/) all sell exactly this.
I built a competitor by accident, and it pays for the thing that produced it.

So Barrelman sells API access, priced on the same principle as the rest of the
project: **free for individuals, paid for enterprise.** One credit balance covers
every endpoint. It's a simple idea, and it could subsidize a consumer app I don't
want to have to sell.

<Figure
  project="barrelman"
  file="pricing.jpg"
  alt="Barrelman's pricing page, with four tiers and one shared credit balance"
  caption="Geocoding, routing, tiles and transit all draw on one balance. A free tier covers evaluation and personal use, and paid tiers start at $19."
/>

### It self-hosts after all

The other surprise came from my buddy Jackson Sippe. He wanted to use Parchment
in Colorado, and my staging server had a partial import that didn't reach that
far, so he asked me to stand up an instance covering it.

I started to do exactly that and then realized I had it backwards. I'd been
importing a single region on my own dev machine for months, because iterating
against a planet import is impractical. I'd been thinking of that as a
development shortcut. It was actually the deployment model, and Jackson could
just run his own Colorado instance.

So regions became a real feature. You name an area and Barrelman figures out what
to import from it: the OSM extract, the transit search area, the address files,
the census codes. Nobody has to assemble a list of data sources by hand.

<Figure
  post="parchment-barrelman-split"
  file="region-import.png"
  alt="Barrelman's new region dialog, with Colorado's boundary auto-filled and an editable bounding box"
  caption="Type a place name and the boundary catalog fills in the rest. The bounding box stays editable, since a state line isn't always the area you want."
/>

So a self-hoster imports the area they actually live in, which runs fine on
consumer hardware. Anything outside it falls back to the central Barrelman
instance.

And that fallback is where the two surprises meet. Out-of-region requests use the
same free quota every other developer account gets. Someone self-hosting Colorado
who occasionally routes across the country never pays me anything. If occasional
turns into steady traffic, they buy credits, and that's the business.

The line between free and paid gets drawn by actual usage instead of a plan tier,
which is what I always wanted. Full self-hosting for the data you use every day,
a shared service for the rest of the planet, and the same app on top of both.
That's the goal from part one, just reached by a route I didn't plan.

Next: [Where Parchment stands, and what is left](/blog/parchment-where-it-stands).
