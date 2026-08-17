The search and routing engine behind [Parchment](/projects/parchment). Barrelman takes an [OpenStreetMap](https://www.openstreetmap.org/) extract and turns it into a set of services: place search, spatial queries, vector tiles and routing, all from the same data and with no dependency on commercial map APIs. It is named after the sailor in the crow's nest who watches the horizon.

[PostGIS](https://postgis.net/) does the heavy lifting, [Martin](https://martin.maplibre.org/) serves the tiles and [GraphHopper](https://www.graphhopper.com/) handles routes. [GTFS](https://gtfs.org/) transit feeds, bike share systems and address data import alongside the OSM extract.

Barrelman began as a subsystem of Parchment and became its own product, priced by usage against [Google Maps Platform](https://mapsplatform.google.com/), [Mapbox](https://www.mapbox.com/) and [Geoapify](https://www.geoapify.com/). That story is in [The subsystem that became a product](/blog/parchment-barrelman-split).
