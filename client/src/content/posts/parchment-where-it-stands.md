---
title: Where Parchment is today
date: 2026-08-17
summary: Parchment is in closed alpha with a small group of testers. Here's what's working so far, and what I want to finish before opening up a beta.
tags: [parchment, maps, openstreetmap, roadmap]
series: Parchment devlog
part: 5
---

[Parchment](/projects/parchment) is in closed alpha right now. There's a
waitlist, a small group of people use it every day, and it still has plenty of
rough edges.

It runs on web, iOS, Android and desktop from one codebase, and the whole thing
can be self-hosted.

## What works

- **Search and places.** 44 browse categories, including ones other maps skip
  like drinking water, benches, bike parking and defibrillators. Place pages
  translate [OpenStreetMap tags](https://wiki.openstreetmap.org/wiki/Map_features)
  into plain language, in your own language where mappers have recorded one,
  and show opening hours in the place's own time zone.
- **Directions.** Driving, cycling, walking and transit, with departure boards,
  isochrones and a carbon estimate for each route.
- **The map.** A globe at low zoom, day and night styles, indoor floor plans, and
  street-level imagery from [Mapillary](https://www.mapillary.com/). There are
  also layers for weather, air quality from [OpenAQ](https://openaq.org/) and
  active wildfires from [NASA FIRMS](https://firms.modaps.eosdis.nasa.gov/).
- **Your own data.** Saved places and collections, offline regions, optional
  location history that stays on your server, and
  [OpenStreetMap editing](https://www.openstreetmap.org/edit), so if a place
  page is wrong you can fix it at the source instead of submitting a report and
  hoping someone reads it.

<Figure
  project="parchment"
  file="transit.png"
  alt="Transit directions from Dumbo, with four departures for an A train"
  caption="A transit leg lists the next several departures and keeps the ones you've already missed on screen."
/>

## What I'm working on

What's left is mostly polish. I want to be able to hand it to someone without a
list of caveats.

**The interface.** A lot of the app works but isn't good yet. This is the
slowest part by far, because it mostly comes down to using the app a lot and
fixing things by eye.

**Native mobile apps.** Parchment already runs on iOS and Android, but from the
same codebase as everything else, and you can tell. I'm planning native clients
that follow each platform's design guidelines instead of reusing the same
interface on both. People open a maps app one-handed in a subway station, so it
should look and feel like it belongs on their phone.

**Transit.** This is where most of the real bugs are, and they matter more than
most, since a wrong departure time can make someone miss their train and wait
twenty minutes for the next one.

**Getting facts right.** Opening hours, closures, and all the small differences
between what's in OSM and what's actually true on the ground. I'd rather show
nothing than tell someone a place is open when it isn't.

**Running planet-scale servers reliably.** Building
[Barrelman](/projects/barrelman) and keeping it running turned out to be very
different jobs. Imports need to finish, indexes need to stay up to date, and
queries need to stay fast with the whole planet behind them. It needs to be
efficient enough that the free tier is sustainable, and stable enough that
people can rely on it for directions when they're already running late.

**The commercial side.** Billing and the paywall for Barrelman's
free-for-individuals model. That's the last big piece I need to build.

## Getting to beta

The waitlist lets me bring people in slowly enough that I can actually fix what
they find. Alpha testers know they're testing something unfinished, but beta
users will reasonably expect it to work.

So the next step is a limited beta, with a small group of testers and possibly
only a few regions to start.

I've been talking with municipal governments and other engineers about what
that rollout could look like. In some places it might be a partnership, and in
others it could become a business that pays for itself. Either way, I don't
want any of it to come at the expense of the product.

If you want to try it, you can join the [waitlist](https://parchment.app).
