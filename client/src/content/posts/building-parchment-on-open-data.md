---
title: Why I'm building my own maps app
date: 2026-08-17
summary: I've spent most of my spare time since 2023 building Parchment, a maps app for people who walk, bike and take transit. Here's why I started it and what I want it to become.
tags: [parchment, maps, openstreetmap, architecture]
series: Parchment devlog
part: 1
---

I started [Parchment](/projects/parchment) in November 2023 and it's eaten most
of my spare time since.

[OpenStreetMap](https://www.openstreetmap.org/) is the biggest open map of the
world. Volunteers have traced and
[tagged](https://wiki.openstreetmap.org/wiki/Map_features) it down to the bench
outside the pub and the step at the front door. The data is incredible, and I
wanted a maps app that actually makes use of it.

<Figure
  project="parchment"
  file="main.png"
  alt="Parchment's globe view, with the Atlantic and labeled cities"
  caption="Parchment's globe view. The map is all OpenStreetMap data, drawn with open source renderers."
/>

## What it's for

Most mainstream maps apps are driving apps with a transit tab added on. I
understand why from a business point of view, but it makes for a pretty
frustrating experience if you don't own a car.

I ride a bike and take the train, so I built Parchment around cycling, transit
and walking instead of treating them as an afterthought.

In practice that mostly means mixed trips. A lot of my trips are a walk to a
bike rack, a ride to the station, a train, and a walk at the other end, and I
want to plan that as one trip. It also means showing the details you only care
about when you're actually outside: hills, unpaved surfaces, a curb you have to
lift a wheel over, which station entrance has no stairs, and whether the bus
stop has a shelter or is just a sign in the grass. Volunteers recorded a lot of
that years ago, and almost no consumer app shows it.

## Principles

**Open data.** Parchment uses OpenStreetMap, so nobody can take the map away or
start charging for it. When something is wrong, you can fix it at the source and
everyone gets the fix.

**Self-hostable.** If I'm going to promise privacy, I think the best way to back
that up is to let you keep your data on hardware you own.

**You're not the product.** No ads, and no selling where you go. Companies can
buy geospatial API access from [Barrelman](/projects/barrelman), and there's a
hosted option for people who don't want to run a server at home, but your data
is never what's being sold.

**It should be good.** I want Parchment to be good enough that people would pick
it even if it weren't open source.

**I won't sell it.** A lot of the software I've loved eventually got acquired and
went downhill under owners who didn't use it. If Parchment were ever acquired, a
new owner could undo everything above, so I want to set it up so that it can't
be sold at all.

The rest of the series covers the problems, and the occasional lightbulb moment,
I've run into while building my silly little maps app.
