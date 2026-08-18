---
title: Where Parchment stands, and what is left
date: 2026-08-17
summary: Parchment is in closed alpha behind a waitlist. Here is what works, what is still being built, and what has to be true before I let more people in.
tags: [parchment, maps, openstreetmap, roadmap]
series: Parchment devlog
part: 5
---

The first four entries are how [Parchment](/projects/parchment) got here. This
one is where it actually is, which is a less tidy answer: in closed alpha, behind
a waitlist, with a small group of people using it daily and a lot of unfinished
edges.

It runs on the web, iOS, Android and desktop from one codebase, and it is
self-hostable end to end. That part is done. What is not done is everything
between "works" and "ready for the public".

## What works

- **Search and places.** 44 browse categories, including the ones other maps
  skip: drinking water, benches, bike parking, defibrillators. Place pages read
  [OpenStreetMap tags](https://wiki.openstreetmap.org/wiki/Map_features) back in
  plain language, in your own language where mappers recorded one, with opening
  hours resolved in the place's own time zone.
- **Directions.** Driving, cycling, walking and transit, with departure boards,
  isochrones and a carbon figure for each route.
- **The map.** A globe at low zoom, day and night styles, indoor floor plans, and
  street-level imagery from [Mapillary](https://www.mapillary.com/). Layers cover
  weather, air quality from [OpenAQ](https://openaq.org/) and active wildfires
  from [NASA FIRMS](https://firms.modaps.eosdis.nasa.gov/).
- **Your own data.** Saved places and collections, offline regions, optional
  location history that stays on your server, and
  [OpenStreetMap editing](https://www.openstreetmap.org/edit), so a place page
  that is wrong can be fixed at the source rather than reported into a void.

<Figure
  project="parchment"
  file="transit.png"
  alt="Transit directions from Dumbo, with four departures for an A train"
  caption="A transit leg shows the next several departures, not just the first, and keeps the ones you already missed on screen."
/>

## What I am working on

Almost none of the remaining work is new features. It is the difference between
software that functions and software you would hand to someone without an
apology.

**The interface.** A good deal of the app works without being good yet. Screens
that function are not the same as screens I would hand to a stranger, and this is
the slowest category by some distance, because a unit test doesn't fail when a panel
is merely awkward to look at.

**Native mobile apps.** Parchment already runs on iOS and Android, but from the
same codebase as everything else, which shows. Native clients are in the
pipeline: ones that follow each platform's own design language properly rather
than wearing the same interface twice. A maps app is something you open one-handed
while navigating a metro system, and it should look and perform like it belongs on the device.

**Transit.** The richest source of real bugs, and each one is somebody's actual
commute. Transit is unforgiving in a way road routing is not. A wrong turn in a
car costs you a minute. A missed connection costs you twenty, in the cold.

**Getting facts right.** Opening hours, closures, and the long tail of what
OpenStreetMap records versus what is true on the ground. A maps app that lies
about whether somewhere is open is worse than one that says nothing at all.

**Planet-scale servers that run reliably and efficiently.** Building
[Barrelman](/projects/barrelman) and operating it turn out to be different jobs.
Imports have to finish, indexes have to stay fresh, and queries have to stay fast
with the whole planet sitting behind them. Efficient enough that a free tier is
not charity, and steady enough that people trust it with directions while they
are already late.

**The commercial side.** Billing and the paywall behind Barrelman's
free-for-individuals model. That is the last structural piece rather than a
polish item.

## The last stretch before beta

The waitlist exists because I would rather disappoint people slowly than all at
once. Alpha testers know they are testing something. Beta users reasonably expect
it to work.

So the next step is a beta with the doors opened part way: a limited group of
testers, and possibly limited regions to begin with.

I have been talking to municipal governments and to other engineers about what
that rollout looks like — a partnership in some places, a route to a business
that sustains itself in others. The condition is the same either way. None of it
at the product's expense.

If you want to be in that group, the [waitlist](https://parchment.app) is open.
