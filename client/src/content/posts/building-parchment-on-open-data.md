---
title: How I built a maps app on open data
date: 2026-08-17
summary: What Parchment is, who it is for, and the four commitments it runs on. The rest of the series is how far that has actually got.
tags: [parchment, maps, openstreetmap, architecture]
series: Parchment devlog
part: 1
---

I started [Parchment](/projects/parchment) in November 2023 and it's eaten most
of my spare time since.

[OpenStreetMap](https://www.openstreetmap.org/) is the biggest open map of the
world. Volunteers have traced and
[tagged](https://wiki.openstreetmap.org/wiki/Map_features) it down to the bench
outside the pub and the step at the front door. The data is incredible. The apps
built on top of it mostly aren't.

<Figure
  project="parchment"
  file="main.png"
  alt="Parchment's globe view, with the Atlantic and labeled cities"
  caption="Parchment today. Everything you see comes from OpenStreetMap data and open source renderers."
/>

## What it's for

Every mainstream maps app is a driving app with a transit tab bolted on. That
makes sense as a business decision, and it's miserable if you don't own a car.

I ride a bike and take the train, so Parchment is built around cycling, transit
and walking instead of treating them as modes you switch into.

In practice that mostly means mixed trips. A real trip is a walk to a bike rack,
a ride to the station, a train, and a walk at the other end. I want that planned
as one trip, seams included. It also means the details you only care about when
you're actually outside: hills, unpaved surfaces, a curb you have to lift a wheel
over, which station entrance has no stairs, whether the bus stop has a shelter or
is just a sign in the grass. Volunteers recorded all of that years ago and almost
no consumer app shows it.

## How it gets there

**Open data.** OpenStreetMap underneath, so nobody can revoke or reprice the map.
When it's wrong, you fix it at the source and everyone gets the fix.

**Self-hostable.** If I'm going to make a privacy promise, the only way to back it
up is to let you keep your data on hardware you own.

**You're not the product.** No ads, no selling where you go. Companies buy
geospatial API access from [Barrelman](/projects/barrelman), and there's a hosted
option because privacy shouldn't require a homelab. But you are never what's
being sold.

**It should be good.** Open source alternatives get graded on a curve and I don't
want that. I want Parchment to be the app you'd pick anyway.

**I won't sell it.** Most of the software I've loved got acquired eventually and
hollowed out by people who didn't use it. An acquisition breaks all four of the
above at once, so promising it won't happen isn't enough. The projects that
survive intact are the ones that put themselves somewhere they can't be sold, and
that's the bar I want Parchment held to.

The rest of the series covers the problems, and the occasional lightbulb moment,
I've had while building my silly little maps app.
