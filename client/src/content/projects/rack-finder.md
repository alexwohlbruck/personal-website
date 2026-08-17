Find bike parking near you, and add whatever is missing to the map everyone
shares.

There are a lot of "finder" apps: [NearToilets](https://neartoilets.com/), the
[Little Free Library Map](https://littlefreelibrary.org/map/),
[WeTap](https://www.wetap.org/) for drinking fountains. Most share the same
flaw. They keep their records in a proprietary database, so everything a
volunteer contributes is locked inside one company's product and disappears
when that company does.

## The right database already exists

[OpenStreetMap](https://www.openstreetmap.org) is a crowdsourced map of the
world, built to describe anything you can point at. The data is free to
download, free to query, and open to contributions.

That makes it the correct home for this whole genre of app. Every finder app
built on it reads the same trusted source, and every contribution improves all
of them at once. Nobody competes on who holds the better copy of the data.

## Rack Finder

I commute by bike, so the object I wanted to find was bike parking. Rack Finder
reads it from OpenStreetMap and sorts what it finds by distance. Each result
carries the details that decide whether you use it: type, capacity, and whether
it stands in the open.

<Figure
  project="rack-finder"
  file="main.png"
  alt="Rack Finder's map, with clustered bike parking counts and a sorted list of nearby racks"
  caption="85 racks near one intersection in Charlotte, clustered on the map and listed by distance."
/>

## Contributing back

The map is only as good as the last person who added to it, so adding has to be
easy. You sign in with your own OpenStreetMap account, and the form asks plain
questions: rack type, capacity, covered or exposed, public or private. It writes
the answers as proper OpenStreetMap tags, credited to you.

<Figure
  project="rack-finder"
  file="contribute.png"
  alt="The contribution form, with rack types and an aerial view for placing the marker"
  caption="Rack types map onto OpenStreetMap's own tagging. The aerial view is there because a rack usually sits against a specific wall or door."
/>

## What it became

The same app shape works for any object OpenStreetMap knows about, and it knows
about a great deal. That idea outgrew a single-purpose app and became the
starting point for [Parchment Maps](/projects/parchment).
