---
title: Where Parchment started
date: 2026-08-17
summary: The goal was a maps app that is private, self-hostable and free, built on open data. The free public endpoints were not a shortcut around that goal. They were the goal.
tags: [parchment, maps, openstreetmap, architecture]
series: Parchment devlog
part: 2
---

I wanted a maps app of my own.

Private, so it doesn't keep a record of everywhere I go. Self-hostable, so it
doesn't stop working the day some company changes its terms. Free and built on
open data, so anyone else can run the same thing without asking me.

That was the whole brief for [Parchment](/projects/parchment) in November 2023
and it hasn't changed.

## Free was the goal

I knew I wanted OpenStreetMap for the data, but I had no idea how to get from
that to a user interface. After some digging I found there's a whole ecosystem of
open source services that read OSM data, and most of them run free public
endpoints anyone can call.

So the first version of Parchment was a Vue app, a thin server, and a list of
URLs pointing at other people's services.

I don't think of that as a compromise. Every one of those services is open source
and every one can be self-hosted. Building on them was the plan working: the map,
the software and the infrastructure were all open, and none of it was mine to
gatekeep.

## The first version was other people's layers

The earliest working demo was a Mapbox basemap with open data drawn over it.
[CyclOSM](https://www.cyclosm.org/) supplied the cycle infrastructure and
[Transitland](https://www.transit.land/) supplied the transit lines. I wrote none
of it and it already looked like something I'd use.

<Figure
  post="where-parchment-started"
  file="cycle-layers.jpg"
  alt="Charlotte at night, with cycle routes traced in green over a dark basemap"
  caption="Charlotte's cycle network from CyclOSM over a dark Mapbox basemap. The picker toggles each overlay, and being able to do that was the first thing that made it feel like an app rather than a map."
/>

Transit was the same idea with a different source. Transitland publishes route
geometries, so drawing a subway map was a styling problem rather than a data
problem. I ended up taking that idea a lot further [later](/projects/portolan).

<Figure
  post="where-parchment-started"
  file="transit-layers.jpg"
  alt="Lower Manhattan in 3D, with colored subway lines running through the buildings"
  caption="Lower Manhattan with Transitland's subway lines over Mapbox's 3D buildings. The sidebar is still most of Parchment's navigation."
/>

None of this was impressive engineering. It was four services glued together. But
it answered the only question that mattered at the time, which was whether an
OpenStreetMap client was worth building at all.

So I kept going and built out the rest of a maps app one feature at a time.
Search, directions, transit, place details, weather. Each one already had an open
service behind it, and each one was free to call.

## What each service did

**[Mapbox](https://www.mapbox.com/)** drew the basemap. It's the one commercial
name on the list and I don't regret it. Rendering a legible world basemap is
hard, and I wasn't going to win that fight in month one.

**[CyclOSM](https://www.cyclosm.org/)** supplied cycle infrastructure as a tile
layer, from the first month.

**[Overpass](https://overpass-api.de/)** answered "what's near this point". It
queries live OSM data with
[its own query language](https://wiki.openstreetmap.org/wiki/Overpass_API), so
asking for every cafe in view is a few lines. Category browse ran on it.

**[Valhalla](https://valhalla.github.io/valhalla/)** drew the routes, starting
December 2024, a year after the first commit.

That's a working maps app with almost nothing proprietary in it.

### Except for search

Everything above is a layer or a lookup. Place search is neither, and it was the
one job where I couldn't find a free answer I liked.

So the search field ran on a mock implementation for a long time. The command
palette worked. Fuzzy matching over shortcuts worked. Typing a street name
returned fixtures. Real autocomplete didn't show up until April 2025, seventeen
months after the first commit.

That's a long time to ship an app with a fake search box. It's also where the
borrowed stack most obviously ran out, and everything after this follows from it.

## Where a shared instance runs out

The trouble had nothing to do with the services being free. It's that a service
everybody shares behaves differently from one you run yourself.

### Whose infrastructure is it

Volunteers run these instances on donated hardware, and their usage policies ask
you to go easy. Nominatim's
[policy](https://operations.osmfoundation.org/policies/nominatim/) allows roughly
one request per second and no bulk work. A maps app with an autocomplete field
blows through that on every keystroke. I'd been treating a community resource
like it was my own infrastructure.

The fix wasn't obvious, because two of my goals pulled against each other. Free
to use ruled out a paid API. Self-hostable meant whoever runs it owns the whole
stack. But a planet-wide OSM extract is hundreds of gigabytes, the search and
routing indexes over it take hours to build, and they go stale. Nobody's
installing all that to find a bike rack.

So I went a different way. **Parchment ships with no credentials of its own.**
Every integration asks whoever's running it for a key, and each of these services
offers a free developer account. A free tier is sized for one person, and one
person is exactly the load. That worked fine for two years.

### Every service had its own shape

A place from Overpass looks nothing like a place from a geocoder. One is a raw
OSM element with a bag of tags. The other is an addressed result with a hierarchy
above it. They don't even agree on what a place is, and every provider I added
disagreed in a new way.

So the code that consumed them grew a branch for each one. Anything that merged
results from two services had to normalize both first, inside whatever function
happened to need it.

### One outage took out one feature

When Overpass was slow, category browse was slow. When the routing demo server
was busy, directions were busy. There was no backup for anything.

For a personal project that's survivable. For an app I wanted people to trust
with directions, it wasn't.

## Where that left me

By spring 2025 Parchment did most of what I wanted, but it had no opinion of its
own about anything. Every provider I added left fingerprints on every component
that read a place.

I still don't think the borrowed stack was a mistake. Free and open is still the
goal, and those services are the reason there was anything to look at in month
two. What had to change was how the app talked to them.

That's the next entry:
[Turning map providers into an interface](/blog/parchment-provider-capabilities).
