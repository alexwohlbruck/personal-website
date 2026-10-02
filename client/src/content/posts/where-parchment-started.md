---
title: How Parchment started on free public APIs
date: 2026-08-17
summary: The first version of Parchment was a Vue app wired up to free, open source map services. That worked well for a while, until rate limits, mismatched data formats and outages started getting in the way.
tags: [parchment, maps, openstreetmap, architecture]
series: Parchment devlog
part: 2
---

When I started [Parchment](/projects/parchment) in November 2023, I wanted a
maps app that was private, so it doesn't keep a record of everywhere I go, and
self-hostable, so it doesn't stop working the day some company changes its
terms. I also wanted it to be free and built on open data, so anyone else could
run the same thing. Those goals haven't changed.

## Starting with free services

I knew I wanted to use OpenStreetMap for the data, but I had no idea how to get
from that to a user interface. After some digging I found a whole ecosystem of
open source services that work with OSM data, and most of them run free public
endpoints that anyone can call.

So the first version of Parchment was a Vue app, a thin server, and a list of
URLs pointing at other people's services.

Every one of those services is open source and can be self-hosted, so building
on them still fit the plan, since everything from the map data to the servers
was open.

## The first demo

The earliest working demo was a Mapbox basemap with open data drawn over it.
[CyclOSM](https://www.cyclosm.org/) supplied the cycle infrastructure and
[Transitland](https://www.transit.land/) supplied the transit lines. I didn't
write any of that, and it already looked like something I'd use.

<Figure
  post="where-parchment-started"
  file="cycle-layers.jpg"
  alt="Charlotte at night, with cycle routes traced in green over a dark basemap"
  caption="Charlotte's cycle network from CyclOSM over a dark Mapbox basemap, with a picker for toggling each overlay."
/>

Transit worked the same way with a different source. Transitland publishes route
geometries, so drawing a subway map was mostly a matter of styling. I ended up
taking that idea a lot further [later](/projects/portolan).

<Figure
  post="where-parchment-started"
  file="transit-layers.jpg"
  alt="Lower Manhattan in 3D, with colored subway lines running through the buildings"
  caption="Lower Manhattan with Transitland's subway lines over Mapbox's 3D buildings. The sidebar is still most of Parchment's navigation."
/>

It was just four services glued together, but it was enough to convince me that
an OpenStreetMap client was worth building.

So I kept going and built out the rest of a maps app one feature at a time:
search, directions, transit, place details and weather. There was already a
free, open service for each of them.

## What each service did

**[Mapbox](https://www.mapbox.com/)** drew the basemap. It's the one commercial
name on the list and I don't regret using it. Rendering a readable basemap of
the whole world is hard, and I wasn't going to take that on in the first month.

**[CyclOSM](https://www.cyclosm.org/)** supplied cycle infrastructure as a tile
layer, starting in the first month.

**[Overpass](https://overpass-api.de/)** handled "what's near this point". It
queries live OSM data with
[its own query language](https://wiki.openstreetmap.org/wiki/Overpass_API), so
asking for every cafe in view only takes a few lines. Category browse ran on it.

**[Valhalla](https://valhalla.github.io/valhalla/)** handled routing, starting in
December 2024, a year after the first commit.

### Search was the exception

Place search was the one feature where I couldn't find a free option I was happy
with.

So the search field ran on a mock implementation for a long time. The command
palette worked, and fuzzy matching over shortcuts worked, but typing a street
name returned test data. Real autocomplete didn't show up until April 2025,
seventeen months after the first commit.

That's a long time to have a fake search box in an app, and it's where I first
started running into the limits of relying on other people's services.

## The limits of shared services

Most of the issues came from the fact that a service everybody shares works
differently from one you run yourself.

### Rate limits

Volunteers run these instances on donated hardware, and their usage
policies ask you to go easy on them. Nominatim's
[policy](https://operations.osmfoundation.org/policies/nominatim/) allows about
one request per second and no bulk work. An autocomplete field sends a request
on every keystroke, so a maps app goes way past that. I had been treating a
community resource like my own infrastructure.

The fix wasn't obvious, because two of my goals conflicted. Keeping it free to
use ruled out a paid API. Making it self-hostable meant whoever runs it is
responsible for the whole stack. But a planet-wide OSM extract is hundreds of
gigabytes, the search and routing indexes built from it take hours to build, and
they go out of date. That's way too much to ask of someone who just wants to run
a maps app.

So instead, **Parchment ships with no credentials of its own.**
Every integration asks whoever's running it for their own API key, and each of
these services offers a free developer account. A free tier is sized for one
person, which is exactly the load a personal instance puts on it. That worked
fine for two years.

### Every service had its own format

A place from Overpass looks nothing like a place from a geocoder. One is a raw
OSM element with a list of tags, and the other is an address with a hierarchy of
regions above it. They don't even agree on what counts as a place, and every
provider I added was different in a new way.

So the code that used them grew a separate branch for each one. Anything that
merged results from two services had to convert both first, inside whatever
function happened to need it.

### No fallbacks

When Overpass was slow, category browse was slow, and when the routing demo
server was overloaded, directions stopped working. Nothing had a fallback.

That's fine for a personal project, but not for an app I wanted people to trust
for directions.

## Where that left me

By spring 2025 Parchment did most of what I wanted, but the details of every
provider I added had leaked into every component that displayed a place.

I still don't think building on those services was a mistake. Free and open is
still the goal, and those services are the reason I had anything to show in the
second month. I just needed to change how the app talked to them.

Next: [Making map providers swappable](/blog/parchment-provider-capabilities).
