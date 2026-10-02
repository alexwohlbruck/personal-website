---
title: How Barrelman spun out of Parchment
date: 2026-08-17
summary: The APIs I depended on couldn't do a lot of what I wanted, so I started building my own backend for search, routing and map tiles. It ended up becoming a separate product with its own business model.
tags: [parchment, barrelman, maps, openstreetmap, architecture]
series: Parchment devlog
part: 4
---

I didn't set out to build a second product. Like the capabilities system in
[the last entry](/blog/parchment-provider-capabilities), Barrelman came about
because [Parchment](/projects/parchment) kept needing things I had no way to
provide.

## Limited by other people's APIs

Besides the rate limits from [part two](/blog/where-parchment-started), the
other problem with relying on public APIs was that **I couldn't change any of
them.**

Over and over I'd design a feature, then find out that the API behind it didn't
support what I needed, and there was no way for me to add it.

**Search**

- **Fuzzy matching**, so a typo still finds the right place.
- **Acronyms**, so "UNCC" finds the University of North Carolina at Charlotte.
- **Search along a route**, so you can find a gas station without leaving your
  trip.
- **Brand search**, so "Target" means the chain and not one random store.
- **Intersections**, since "42nd & Broadway" is how people describe a corner,
  and none of the geocoders I tried understood it.

**Routing**

- **Transit routing that uses the same graph as regular routing**, so a trip
  that walks, rides and walks again comes back as one result instead of three
  stitched together.

**Everything else**

- **Isochrones**, for how far you can get in twenty minutes.
- **Spatial queries**, for what contains a place and what it contains.
- **Tiles that include the things I actually wanted to draw.** No commercial tile
  server renders bicycle parking.

None of these are unusual features, but each one needs control over the search
index or the routing graph, which I didn't have.

<Figure
  project="parchment"
  file="search.png"
  alt="Parchment's search palette, with saved places, category chips and recent results"
  caption="The search palette. Saved places, categories, recent searches and brands all come from the same API."
/>

## Building my own index

The first piece was **Pelias**, in May 2025. It's an open source geocoder that
builds a search index from an OSM extract. I pointed it at one city, and then at
bigger ones.

Running it myself meant importing a big extract, building the indexes, keeping
them up to date, and answering queries fast enough that autocomplete feels
instant. It's a lot more involved than calling someone else's API, but it was
also the first part of Parchment's backend that I could change myself.

Then I ran into the same problem from part two again. A planet-scale geospatial
API is not something you run in a homelab. It's hundreds of gigabytes, hours of
index building, and an ongoing job to keep it current. I wasn't going to ask
anyone to run all that to look up a coffee shop.

## Splitting personal data from map data

This is the part I'm proudest of, and it took me way too long to figure out.

People self-host for two reasons: privacy and cost. So I asked which parts of
Parchment those reasons actually apply to.

Privacy applies to your account, your saved places, your collections and your
location history. **It doesn't apply to a search index of the planet.** Street
geometry and shop opening hours are public information, and none of it is about
you.

So I split the architecture along that line:

- **The Parchment server** holds everything personal. It stays small and can be
  self-hosted on modest hardware.
- **Barrelman** handles the map data: search, tiles, routing and transit, all
  from one OSM import, hosted centrally.

That way your personal data stays on your own server, and the heavy map data
runs once for everyone instead of every person hosting their own copy.

## Moving Parchment onto Barrelman

Because of the capabilities rewrite, Parchment didn't need any special handling
for Barrelman. It's just another integration that supports some capabilities,
like Nominatim or Geoapify. I wrote the adapters, filled in the config, and the
app treated my own backend the same as any third party.

That meant it could take over one capability at a time instead of all in one big
release:

| When | What moved |
|---|---|
| March 2026 | Place search |
| April 2026 | Vector tiles, on an [OpenMapTiles](https://openmaptiles.org/) schema |
| April 2026 | Routing |
| May 2026 | Transit routing, then departure boards |
| June 2026 | Geocoding, with the public endpoints kept as fallbacks |

None of the code above the adapters had to change.

## Two things I didn't expect

### Barrelman as a business

[Mapbox](https://www.mapbox.com/), [Geoapify](https://www.geoapify.com/) and
[Google Maps Platform](https://mapsplatform.google.com/) all sell this same kind
of service. Without really meaning to, I'd built a competitor, and it can help
pay for Parchment.

So Barrelman sells API access, priced on the same principle as the rest of the
project: **free for individuals, paid for enterprise.** One credit balance covers
every endpoint. It's a simple model, and it could fund a consumer app that I
never want to have to sell.

<Figure
  project="barrelman"
  file="pricing.jpg"
  alt="Barrelman's pricing page, with four tiers and one shared credit balance"
  caption="Geocoding, routing, tiles and transit all draw on one balance. A free tier covers evaluation and personal use, and paid tiers start at $19."
/>

### Self-hosting by region

The other surprise came from my buddy Jackson Sippe. He wanted to use Parchment
in Colorado, but my staging server only had a partial import that didn't cover
it, so he asked me to set up an instance that did.

I started to do that, and then realized I had it backwards. I'd been importing a
single region on my own dev machine for months, because working against a full
planet import is impractical. I'd thought of that as a shortcut for development,
but it worked just as well for deployment, so Jackson could run his own
Colorado instance.

So I made regions a real feature. You name an area and Barrelman figures out
what to import for it: the OSM extract, the transit search area, the address
files and the census codes. Nobody has to put together a list of data sources by
hand.

<Figure
  post="parchment-barrelman-split"
  file="region-import.png"
  alt="Barrelman's new region dialog, with Colorado's boundary auto-filled and an editable bounding box"
  caption="Type a place name and the boundary catalog fills in the rest. The bounding box stays editable, since a state line isn't always the area you want."
/>

That means a self-hoster can import just the area they live in, which runs fine
on consumer hardware. Anything outside that area falls back to the central
Barrelman instance.

Requests outside your region use the same free quota that every developer
account gets. Someone self-hosting Colorado who occasionally plans a route
across the country never pays me anything. If that turns into steady traffic,
they buy credits, and that's how Barrelman makes money.

I like that the line between free and paid is based on actual usage instead of
a plan tier. You can self-host the data you use every day, use a shared service
for the rest of the planet, and run the same app on top of both. That's what I
was going for in part one, I just got there in a way I didn't plan.

Next: [Where Parchment is today](/blog/parchment-where-it-stands).
