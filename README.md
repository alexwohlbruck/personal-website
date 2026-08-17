# Personal website

[alex.wohlbruck.com](https://alex.wohlbruck.com). Portfolio, projects, and a few live odds and ends.

Two pieces: a Vue 3 client and a small Express server that proxies the Spotify,
Instagram, Google Calendar and mail integrations and persists the guestbook.

## Stack

| | |
|---|---|
| Framework | Vue 3.5 (`<script setup>`, TypeScript) |
| Build | Vite 8, prerendered to static HTML by [vite-ssg](https://github.com/antfu-collective/vite-ssg) |
| Content | Markdown compiled to Vue components by [unplugin-vue-markdown](https://github.com/unplugin/unplugin-vue-markdown), highlighted at build time by Shiki |
| Styling | Tailwind CSS v4, CSS-first tokens in `client/src/styles/main.css` |
| Motion | [motion-v](https://motion.dev/docs/vue), CSS transitions on a shared token scale |
| Lightbox | PhotoSwipe 5 |
| Primitives | Reka UI (dialog), custom everything else |
| State | Pinia for the live integrations. Static content is plain modules. |
| Head | [unhead](https://unhead.unjs.io), per-page, baked into the prerendered HTML |
| Type | Instrument Serif (display), Geist (UI), Geist Mono (labels), self-hosted via Fontsource |

Design notes: paper-and-ink palette in oklch, light and dark, following the OS
by default with a three-state toggle. Surfaces are lit from above: a hairline
highlight on top edges, a soft shadow below, inverted when pressed.

## Writing

Prose lives in Markdown under `client/src/content`, compiled to Vue components
at build time. Nothing is parsed in the browser.

| | |
|---|---|
| Project write-ups | `content/projects/<slug>.md`, where the slug matches the project's `name` in `src/data/projects.ts` |
| Blog posts | `content/posts/<slug>.md`, where the filename is the URL |
| Post images | `src/assets/posts/<slug>/`, alongside the project screenshots in `src/assets/portfolio/` |
| Widgets | `src/components/content/*.vue`, registered globally under their filename |

Project metadata — dates, colour, screenshots, tags — stays typed in
`src/data/projects.ts`. Only the prose moves to Markdown.

A post declares its own frontmatter. Only `title` and `date` are required:

```yaml
---
title: A post
date: 2026-08-17
summary: Shown on the index, in the feed, and as the page description.
tags: [maps]
series: Parchment devlog
part: 2
draft: true
---
```

`draft: true` keeps a post visible while running locally and out of production
entirely — no page, no feed entry, no sitemap URL.

`series` and `part` group a run of posts. An entry in a series shows its name and
"Part 2 of 4" above the title, lists the whole run at the foot, and its prev/next
walk the series in `part` order rather than the whole blog by date — stopping at
both ends instead of wrapping. The index labels each entry with its series and
part but stays one list in date order, so filtering still behaves.

`Figure` takes a `project` or a `post` plus a filename rather than a URL, so an
image gets the WebP renditions and blur-up from `npm run images` for free.
Clicking one opens the lightbox, and every image in a document forms a single
set, so the arrows walk the page — bare `![alt](…)` images included.

Markdown files may use any component in `src/components/content/` by name, with
no import. `Callout`, `Figure` and `Embed` ship with it; anything dropped in that
folder joins them. Leave a blank line after the opening tag for Markdown inside a
widget to be parsed:

```md
<Callout kind="insight" title="A heading">

Body text, with **formatting** intact.

</Callout>
```

`npm run build` prerenders every route to static HTML, so prose and per-page
`og:` tags are in the source rather than assembled after hydration — which is
what the crawlers that unfurl a shared link read. It also writes `feed.xml` and
`sitemap.xml`. `/guestbook` is deliberately left client-rendered.

## Requirements

- [Node.js](https://nodejs.org/en/) 20+

## Project setup

```bash
cd server && npm install
cd ../client && npm install
```

### Environment

#### `server/.env`

| Name                  | Type   | Recommended value         |  Description |
|-----------------------|--------|---------------------------|-----------------------------------------------|
| PORT                  | number | 3000                      | Port to run the server on                     |
| ADMIN_EMAIL           | string | Your gmail                | The one address that can moderate the guestbook |
| ADMIN_SESSION_SECRET  | string | 32 random bytes, hex      | Signs admin sessions; unset means a restart signs you out |
| DATABASE_URL          | string | Neon pooled connection    | Postgres connection for the shared guestbook  |
| GOOGLE_API_KEY        | string |                           | API key from Google Developers Console        |
| GOOGLE_CALENDAR_ID    | string | Your gmail                | Your calendar ID, usually your gmail address  |
| IG_ACCESS_TOKEN       | string |                           | Access token from Instagram Developer Console |
| IG_APP_ID             | string |                           | App ID from Instagram Developer Console       |
| IG_APP_SECRET         | string |                           | App secret from Instagram Developer Console   |
| IG_REDIRECT_URI       | string | {backendUrl}/callback     | Redirect URI from Instagram Developer Console |
| MAIL_HOST             | string | smtp.gmail.com            | Mail server host                              |
| MAIL_PASS             | string |                           | Mail server password                          |
| MAIL_PORT             | string | 465                       | Mail server port                              |
| MAIL_USER             | string | Your gmail                | Mail server email                             |
| SPOTIFY_CLIENT_ID     | string |                           | Client ID from Spotify Developer Console      |
| SPOTIFY_CLIENT_SECRET | string |                           | Client secret from Spotify Developer Console  |
| SPOTIFY_REDIRECT_URI  | string | {localhost:8080}/callback | Redirect URI from Spotify Developer Console   |
| SPOTIFY_REFRESH_TOKEN | string |                           | Refresh token from Spotify Developer Console  |

#### `client/.env`

| Name              | Type   | Recommended value                 | Description                                      |
|-------------------|--------|-----------------------------------|--------------------------------------------------|
| VITE_BACKEND_URL  | string | http://localhost:3000             | URL to the backend server                        |
| VITE_JUKEBOX_URL  | string | https://jukebox.wohlbruck.dev     | URL for the opt-in now-playing audio stream     |

Leave `VITE_BACKEND_URL` unset and the live sections (now playing, photos,
availability, contact form) fall back to a quiet offline state instead of
erroring. The rest of the site is fully static.

### How the guestbook loads

The canvas is unbounded, so it is read a window at a time rather than all at
once. Every mark stores its bounding box, indexed with a GiST index over core
Postgres geometry (no PostGIS), and `GET /guestbook?left&top&right&bottom`
returns only what that window touches. The client remembers which squares of
the world it has already fetched, so panning back over old ground costs
nothing. `GET /guestbook/overview` says how big the board is and where to open
it: the middle of the twenty most recent marks.

Marks written before the bounding box existed are measured once, on the first
request after deploying. `npm run images:guestbook` tidies up the pictures
already on the board: it builds any missing thumbnails and recompresses images
a browser stored as PNG. `toDataURL` returns a PNG when it cannot encode the
format asked for, and a PNG ignores the quality argument, so an upload that
should be thirty kilobytes can land as half a megabyte with nothing to say so.
New uploads check what came back and fall back to JPEG instead.

### Moderating the guestbook

Anyone can draw on `/guestbook`, and by default a visitor can only touch what
their own browser session put there. `ADMIN_EMAIL` names the single account
that can touch everything else.

Sign in from the link under the canvas: enter that address, read the six digit
code out of the mailbox, and the canvas opens up — every mark becomes movable,
editable and erasable, while still showing whose it was. There is no password
and no account to create; the mailbox is the credential.

The session lives in an httpOnly cookie wherever the site and the API share an
origin, which is everywhere except local development, where they sit on
different ports and a bearer token stands in. Signing out ends every session
rather than only the one in front of you, so a token that leaked somewhere else
stops working the moment you notice.

## Development

```bash
cd server && npm run dev
```

```bash
cd client && npm run dev
```

The client runs on port 2000.

## Building

```bash
cd client && npm run build
```

`npm run build` regenerates `src/data/image-sizes.generated.json` first (see
`scripts/generate-image-manifest.mjs`), which is what lets galleries reserve
layout space before an image loads and gives PhotoSwipe its zoom targets. Run it
on its own with `npm run images` after adding screenshots.

Other scripts: `npm run typecheck`, `npm run preview`.

## Adding a project

1. Drop screenshots in `client/src/assets/portfolio/<slug>/`.
2. Add an icon to `client/src/assets/svg/`.
3. Append an entry to `client/src/data/projects.ts` (newest first).
4. `npm run images`.
