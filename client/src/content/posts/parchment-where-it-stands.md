---
title: Where Parchment stands, and what is left
date: 2026-08-17
summary: Parchment is in closed alpha behind a waitlist. Here is what works, what is still being built, and what has to be true before I let more people in.
tags: [parchment, maps, openstreetmap, roadmap]
series: Parchment devlog
part: 5
---

The first four entries are about how [Parchment](/projects/parchment) got here.
This one is about where it actually is: closed alpha, behind a waitlist, with a
small group of people using it daily and a lot of rough edges.

It runs on web, iOS, Android and desktop from one codebase, and it's
self-hostable end to end. That part is done. What isn't done is everything
between "works" and "ready for the public".

## What works

- **Search and places.** 44 browse categories, including the ones other maps
  skip: drinking water, benches, bike parking, defibrillators. Place pages
  translate [OpenStreetMap tags](https://wiki.openstreetmap.org/wiki/Map_features)
  into plain language, in your own language where mappers recorded one, with
  opening hours shown in the place's own time zone.
- **Directions.** Driving, cycling, walking and transit, with departure boards,
  isochrones and a carbon estimate for each route.
- **The map.** A globe at low zoom, day and night styles, indoor floor plans, and
  street-level imagery from [Mapillary](https://www.mapillary.com/). Layers for
  weather, air quality from [OpenAQ](https://openaq.org/) and active wildfires
  from [NASA FIRMS](https://firms.modaps.eosdis.nasa.gov/).
- **Your own data.** Saved places and collections, offline regions, optional
  location history that stays on your server, and
  [OpenStreetMap editing](https://www.openstreetmap.org/edit), so a wrong place
  page can be fixed at the source instead of reported into a void.

<Figure
  project="parchment"
  file="transit.png"
  alt="Transit directions from Dumbo, with four departures for an A train"
  caption="A transit leg shows the next several departures, not just the first, and keeps the ones you already missed on screen."
/>

## What I'm working on

Almost none of what's left is new features. It's the gap between software that
functions and software I'd hand to someone without apologizing first.

**The interface.** A lot of the app works without being good yet. This is the
slowest category by far, because a unit test doesn't fail when a panel is merely
awkward to look at.

**Native mobile apps.** Parchment already runs on iOS and Android, but from the
same codebase as everything else, and it shows. Native clients are in the
pipeline, ones that follow each platform's design language instead of wearing the
same interface twice. A maps app is something you open one-handed in a metro
station, and it should look and feel like it belongs on the device.

**Transit.** The richest source of real bugs, and each one is somebody's commute.
Transit is unforgiving in a way road routing isn't. A wrong turn in a car costs
you a minute. A missed connection costs you twenty.

**Getting facts right.** Opening hours, closures, and the long tail of what OSM
records versus what's true on the ground. A maps app that's wrong about whether a
place is open is worse than one that doesn't say.

**Running planet-scale servers reliably.** Building
[Barrelman](/projects/barrelman) and operating it turned out to be different
jobs. Imports have to finish, indexes have to stay fresh, and queries have to
stay fast with the whole planet behind them. Efficient enough that the free tier
isn't charity, and stable enough that people trust it for directions when they're
already late.

**The commercial side.** Billing and the paywall behind Barrelman's
free-for-individuals model. That's the last structural piece.

## The last stretch before beta

The waitlist exists so I can let people in at a pace where I can actually fix
what they find. Alpha testers know they're testing something. Beta users will
reasonably expect it to work.

So the next step is a beta with the doors part way open: a limited group of
testers, and possibly limited regions to start.

I've been talking to municipal governments and other engineers about what that
rollout looks like. In some places that might be a partnership, in others a path
to a business that sustains itself. Either way, none of it at the product's
expense.

If you want in, the [waitlist](https://parchment.app) is open.
