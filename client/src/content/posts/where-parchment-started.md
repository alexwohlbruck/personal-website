---
title: Where Parchment started
date: 2026-08-17
summary: The goal was a maps app that is private, self-hostable and free, built on open data. The free public endpoints were not a shortcut around that goal. They were the goal.
tags: [parchment, maps, openstreetmap, architecture]
series: Parchment devlog
part: 2
---

I wanted a maps app of my own.

Private, so it does not keep a record of everywhere I go. Self-hostable, so it
does not stop working the day a company changes its terms. Free, and built on
open data, so anyone else can run the same thing without asking me.

That was the whole brief for [Parchment](/projects/parchment) in November 2023,
and it has not changed since.

## Free was the goal

OpenStreetMap supplies the data. What I did not expect was the rest of it. An
entire ecosystem of open source services reads that data, and most of them run
as free public endpoints that anyone can call.

So the first version of Parchment was a Vue app, a thin server, and a list of
other people's URLs.

That was not a compromise. Every one of those services is open source, and every
one of them can be self-hosted. Building on them was the goal working as
intended: the map, the software and the infrastructure all open, and none of it
mine to gatekeep.

## The first version was other people's layers

The earliest working demo was simply a Mapbox basemap with open data
drawn over it. [CyclOSM](https://www.cyclosm.org/) supplied cycle
infrastructure. [Transitland](https://www.transit.land/) supplied transit lines.
I wrote none of it, and it already looked like something worth using.

<Figure
  post="where-parchment-started"
  file="cycle-layers.jpg"
  alt="Charlotte at night, with cycle routes traced in green over a dark basemap"
  caption="Charlotte's cycle network from CyclOSM, over a dark Mapbox basemap. The picker toggles each overlay, which is the first thing that made this feel like an app rather than a map."
/>

Transit was the same idea with a different source. Transitland publishes the
route geometries, so drawing a subway map became a styling problem rather than a
data problem.

<Figure
  post="where-parchment-started"
  file="transit-layers.jpg"
  alt="Lower Manhattan in 3D, with colored subway lines running through the buildings"
  caption="Lower Manhattan with Transitland's subway lines over Mapbox's 3D buildings. The sidebar is most of the navigation Parchment still has."
/>

None of this is impressive engineering. It is four services in a trench coat.
But it answered the only question that mattered then, which is whether an
OpenStreetMap client was worth building at all.

So I continued, and built the rest of a maps app one feature at a time.
Search, directions, transit, place detail, weather. Each one had an open service
behind it already, and each one was free to call.

## What each service did

**[Mapbox](https://www.mapbox.com/)** drew the basemap. It is the one commercial
name in the list, and it earned the place. Rendering a legible world basemap is
genuinely hard, and I was not going to win that fight in month one.

**[CyclOSM](https://www.cyclosm.org/)** supplied cycle infrastructure as a tile
layer, from the first month.

**[Overpass](https://overpass-api.de/)** answered "what is near this point". It
queries live OpenStreetMap data with
[its own query language](https://wiki.openstreetmap.org/wiki/Overpass_API), so a
request for every cafe in view is a few lines. Category browse ran on it.

**[Valhalla](https://valhalla.github.io/valhalla/)** drew the routes from
December 2024, a year after the first commit.

That is a working maps app, and almost none of it is proprietary.

### Except for search

Everything above is a layer or a lookup. Place search is neither, and it was the
one job with no free answer I liked.

So the search field ran on a mock implementation for a long time. The command
palette worked. Fuzzy matching over shortcuts worked. Typing a street name
returned fixtures. Real autocomplete did not arrive until April 2025, seventeen
months after the first commit.

That is a long time to ship an app with a pretend search box. It is also the
clearest marker of where the borrowed stack ran out, and everything after this
follows from it.

## Where a shared instance runs out

Nothing here broke because it was free. It broke because a service everyone
shares is not the same thing as a service you run.

### Whose infrastructure is it

Volunteers run these instances on donated hardware, and their usage policies ask
for restraint. Nominatim's
[policy](https://operations.osmfoundation.org/policies/nominatim/) allows about
one request per second and no bulk work. A maps app with an autocomplete field
breaks that on every keystroke. I treated a community resource as my own
infrastructure.

The fix was not obvious, because two of my goals pulled against each other. Free
to use excluded a paid API. Self-hostable meant the person running it owns the
whole stack. But a planet-wide OpenStreetMap extract runs to hundreds of
gigabytes. The search and routing indexes over it take hours to build, and they
go stale. Nobody installs all of that to find a bike rack.

So I answered it a different way. **Parchment ships with no credentials of its
own.** Every integration asks the person running it for a key, and each of these
services offers a free developer account. A free tier is sized for one person,
and one person is exactly the load. That held for two years.

### Every service had its own shape

A place from Overpass looks nothing like a place from a geocoder. One is a raw
OpenStreetMap element carrying a bag of tags. The other is an addressed result
with a hierarchy above it. They disagree about what a place even is, and every
provider I added disagreed in a new way.

So the code that consumed them grew a branch for each. Anything that merged
results from two services had to normalize both first, in whatever function
happened to need it.

<Callout kind="warning" title="The real cost of this">

The waste was not the extra code. It was that the shape of every provider leaked
upward into the app.

A component that renders a place knew, somewhere in its history, which service
that place came from. Adding a provider meant touching everything that read a
place. That is the tax that made the next rewrite unavoidable.

</Callout>

### One outage removed one feature

When Overpass was slow, category browse was slow. When the routing demo server
was busy, directions were busy. There was no second option for anything.

For a personal project that is survivable. For an app I wanted people to trust
with directions, it was not.

## Where that left me

By spring 2025 Parchment did most of what I wanted, and it still had no opinion
of its own about anything. Every provider I added left its fingerprints on every
component that read a place.

The borrowed stack was never the mistake. Free and open is still the goal, and
those services are the reason there was anything to look at in month two. What
had to change was the way the app talked to them.

That is what the next entry is about:
[Turning map providers into an interface](/blog/parchment-provider-capabilities).
