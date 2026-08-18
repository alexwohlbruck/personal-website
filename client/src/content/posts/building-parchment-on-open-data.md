---
title: How I built a maps app on open data
date: 2026-08-17
summary: What Parchment is, who it is for, and the four commitments it runs on. The rest of the series is how far that has actually got.
tags: [parchment, maps, openstreetmap, architecture]
series: Parchment devlog
part: 1
---

I started [Parchment](/projects/parchment) in November 2023 and it has eaten most
of my spare time since.

[OpenStreetMap](https://www.openstreetmap.org/) is the largest open map of the
world, traced and
[tagged](https://wiki.openstreetmap.org/wiki/Map_features) by volunteers down to
the bench outside the pub and the step at the door. The data is remarkable. The
apps built on it are mostly not.

<Figure
  project="parchment"
  file="main.png"
  alt="Parchment's globe view, with the Atlantic and labeled cities"
  caption="Parchment today. Every pixel of it comes from OpenStreetMap data and open source renderers."
/>

## What it is for

Every mainstream maps app is a driving app with a transit tab bolted on. That is
rational as a business decision and miserable if you do not own a car.

I ride a bike and take the train, so Parchment is arranged around cycling,
transit and walking rather than treating them as modes you switch into.

Mostly that means mixed trips. A real journey is a walk to a rack, a ride to a
station, a train, and a walk at the far end — one trip, planned once, seams
included. It also means the details you only notice when you are outside: hills,
unpaved surface, a curb you have to lift a wheel over, which station entrance is
step-free, whether the bus stop has a shelter or is a sign in the grass.
Volunteers recorded all of that years ago. Almost no consumer app surfaces it.

## How it gets there

**Open data.** OpenStreetMap underneath, so the map cannot be revoked or
repriced. When it is wrong you can fix it at the source, for everyone.

**Self-hostable.** The only honest version of a privacy promise is letting you
keep your data on hardware you own.

**You are not the product.** No ads, no selling where you go. Companies buy
geospatial API access from [Barrelman](/projects/barrelman), and privacy should
not require a homelab, so there is a hosted option as well. Never you, sold
onward.

**It should be good.** Open source alternatives get graded on a curve, and I
would rather not be. The goal is the app you would pick anyway.

**I will not sell out.** Most software I have loved was eventually acquired and
hollowed out by people who did not use it.
[Home Assistant](https://www.home-assistant.io/) put itself under a non-profit
foundation precisely so that cannot happen to it, and I want Parchment held to
that standard. An acquisition is the single event that breaks all four
commitments above at once, so it is the one I intend to make structurally
impossible rather than merely promise.

The rest of the series chronicles the challenges and revelations that I have had during the development of my silly little maps app.
