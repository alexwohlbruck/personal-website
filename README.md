# Personal website

[alex.wohlbruck.com](https://alex.wohlbruck.com). Portfolio, projects, and a few live odds and ends.

Two pieces: a Vue 3 client and a small Express server that proxies the Spotify,
Instagram, Google Calendar and mail integrations and persists the guestbook.

## Stack

| | |
|---|---|
| Framework | Vue 3.5 (`<script setup>`, TypeScript) |
| Build | Vite 8 |
| Styling | Tailwind CSS v4, CSS-first tokens in `client/src/styles/main.css` |
| Motion | [motion-v](https://motion.dev/docs/vue), CSS transitions on a shared token scale |
| Lightbox | PhotoSwipe 5 |
| Primitives | Reka UI (dialog), custom everything else |
| State | Pinia for the live integrations. Static content is plain modules. |
| Type | Instrument Serif (display), Geist (UI), Geist Mono (labels), self-hosted via Fontsource |

Design notes: paper-and-ink palette in oklch, light and dark, following the OS
by default with a three-state toggle. Surfaces are lit from above: a hairline
highlight on top edges, a soft shadow below, inverted when pressed.

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

### Moderating the guestbook

Anyone can draw on `/guestbook`, and by default a visitor can only touch what
their own browser session put there. `ADMIN_EMAIL` names the single account
that can touch everything else.

Sign in from the link under the canvas: enter that address, read the six digit
code out of the mailbox, and the canvas opens up — every mark becomes movable,
editable and erasable, while still showing whose it was. There is no password
and no account to create; the mailbox is the credential. The session lasts a
week and signing out just discards it locally.

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
