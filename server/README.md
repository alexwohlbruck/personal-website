# Server

The small Express app behind the live bits of the site: what I'm listening to,
my Instagram grid, a free/busy week, and the contact form.

```bash
npm install
cp .env.example .env   # fill in whichever integrations you want
npm run dev
```

`GET /health` reports which integrations found credentials. Everything is
optional and independent, so a blank `.env` still boots and every endpoint
answers `503` instead of taking the process down.

## Endpoints

| Route                      | What it does                                   |
| -------------------------- | ---------------------------------------------- |
| `GET /spotify/stream`      | SSE. Pushes the current track when it changes.  |
| `GET /spotify/playback-state` | The same answer as one request.             |
| `GET /spotify/listening`   | Liked songs, top artists and genres.            |
| `GET /instagram/grid`      | A page of posts, each with all its photos.      |
| `GET /calendar`            | Busy intervals for the next seven days.         |
| `GET /osm/stats`           | Lifetime and recent OpenStreetMap activity.      |
| `GET /guestbook`           | Up to 750 recent marks on the shared canvas.     |
| `GET /guestbook/preview`   | Lightweight recent marks for the homepage.       |
| `POST /guestbook`          | Validate and persist one new canvas mark.        |
| `PUT /guestbook/:id`       | Edit a mark created by the current session.      |
| `DELETE /guestbook/:id`    | Remove a mark created by the current session.    |
| `GET /guestbook/stream`    | SSE stream of live canvas mutations.             |
| `GET /guestbook/visitors`  | Cached GA4 unique visitors across the site.       |
| `POST /mailer/contact`     | Contact form. Rate limited to 5 per 10 minutes. |
| `GET /health`              | Which integrations are configured.              |

## OpenStreetMap lifetime stats

The public changeset endpoint returns at most 100 results per request. The site
therefore starts from a checked-in lifetime archive. On the first page request
after the 24-hour cache expires, it checks the profile count and incrementally
fetches only changesets newer than its in-memory archive. An unchanged day costs
one OSM request; a typical editing day costs two. Concurrent page requests share
the same refresh.

The checked-in starting point can be refreshed locally before a deploy:

```bash
npm run stats:osm
```

The generator follows the same incremental approach. A missing archive is
rebuilt sequentially, and every run verifies its total against the profile
before writing only the fields used by the site.

## How now playing works

Spotify has no webhook, push or streaming API. Nothing to subscribe to, so
somebody has to poll. The question is who.

This server polls once and pushes the result to every open browser over
[Server-Sent Events](https://developer.mozilla.org/docs/Web/API/Server-sent_events).
Spotify call volume is a function of how often the music changes, not how many
people are on the site. Nobody looking means nobody to tell, so the loop stops
and restarts on the next visitor.

Cadence is adaptive: while a track is playing it re-checks when the track is due
to end, capped at 30 seconds so a skip shows up reasonably soon; when nothing is
playing, once a minute; on failure, backing off from one minute to fifteen.

## Credentials

### Guestbook database

Set `DATABASE_URL` to a pooled Postgres connection string. On its first request,
the guestbook creates or upgrades the `guestbook_items` table and its indexes.
The browser creates a temporary UUID in `sessionStorage` and sends it as
`X-Guestbook-Client`; mutation queries require the stored UUID to match, while
the public response exposes only an `owned` boolean. This ownership lasts for
that browser session and powers editing plus undo/redo without user accounts.
The integration stays optional: without a database, the rest of the server
boots as usual and only `/guestbook` responds with `503`.

Guestbook writes are broadcast through the same SSE helper used by now playing,
so every open canvas receives inserts, edits, undo/redo changes, and deletions
without polling. New canvas items are enriched server-side with an approximate
city and country from [Country](https://country.is/); only that estimate is
stored, never the IP.

### Spotify

1. Create an app at [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard).
2. Add `http://127.0.0.1:8888/callback` as a redirect URI. It has to be that
   exactly. Spotify requires https everywhere else, and `localhost` does not
   count as a loopback address.
3. Put the client ID and secret in `.env`.
4. `npm run auth:spotify`, click the link, approve. It saves the new refresh
   token to `.tokens.json` and prints the `SPOTIFY_REFRESH_TOKEN` line to keep
   in `.env` for a future deployment. Refresh tokens don't expire, so this is a
   one-time thing.

Scopes requested: `user-read-playback-state`, `user-read-recently-played`,
`user-top-read`, `user-library-read`. All four are reads — none can change
what's playing, follow anyone, or touch a playlist.

**Adding a scope means re-running `npm run auth:spotify`.** A refresh token
carries the scopes it was granted and never gains new ones, so an older token
keeps working for playback while the newly scoped endpoints answer `403`. That
is survivable by design — `/spotify/listening` returns `null` for the parts it
could not fetch and the site drops those panels — but it does mean the section
stays half empty until the token is re-minted.

## Why there is no "top playlists" or "most-played podcasts"

Both were tried and cut. Spotify's Web API has no play counts and no listening
history for anything other than tracks:

- `/me/player/recently-played` returns **tracks only** — never a podcast
  episode, confirmed by inspecting fifty consecutive entries. There is no way
  to rank podcasts by how much they've been listened to; the closest available
  signal is `/me/shows`, which is *saved* order, not *played* order, and
  presenting it as the latter would just be wrong.
- Ranking playlists by counting each one's appearances as a play context in
  that same fifty-track history was tried next. It technically works, but the
  window is a single non-pageable page (roughly a day or two), and only plays
  Spotify tags with an explicit playlist context count at all — most casual
  listening (Liked Songs, radio, casting from another device) carries none.
  That thin, easily-missed signal isn't worth building a panel around.

What Spotify *does* compute and stand behind is `/me/top/artists`, over
`short_term` / `medium_term` / `long_term` windows — genuine "top" data, not an
inference. Genres are derived from that (see `tallyGenres` in
`src/apis/spotify.js`), since Spotify has no genre endpoint of its own but does
tag every artist with a genre list.

**If the dashboard won't save your redirect URIs**, it's usually not the row
you're adding. The form validates the whole set, and Spotify now only accepts
https or http on the literal loopback address — so one leftover
`http://example.com/callback` or `http://localhost:…` from an older app blocks
the save. Delete those rows first, then add the new one.

**If you're stuck with a URI this script can't listen on**, authorize by hand.
The code lands in the address bar of wherever you get redirected:

```bash
npm run auth:spotify -- --print-url
npm run auth:spotify -- --code=AQD9x...
```

`SPOTIFY_REDIRECT_URI` has to hold the same URI for both steps — Spotify checks
it again at the exchange.

Two things worth knowing about Development Mode, which is where an app of this
size lives:

- **The app owner needs an active Spotify Premium subscription.** If Premium
  lapses, the app stops working. This changed on 11 February 2026 for new apps
  and 9 March 2026 for existing ones, which is late enough to be a plausible
  cause of an integration that used to work.
- Five users per app, which is four more than this needs.

The February 2026 API change removed a pile of catalogue and library endpoints.
Neither of the two used here was affected.

### Instagram

The Basic Display API this used to run on was **shut down on 4 December 2024**
and its endpoints only return errors now. The replacement is the Instagram API
with Instagram Login, and it only talks to **Professional accounts** — a
personal account can't be read by any Instagram API any more.

1. Switch the Instagram account to Creator or Business. It's free, reversible,
   and in the Instagram app under Settings > Account type and tools.
2. Create an app at [developers.facebook.com](https://developers.facebook.com)
   and add the Instagram product.
3. Under **Instagram > API setup with Instagram business login**, generate a
   long-lived access token. Paste it into `.env` as `INSTAGRAM_ACCESS_TOKEN`.
4. `npm run auth:instagram` to check it works and record its expiry.

`/instagram/grid` takes `limit` and an `after` cursor, and answers with
`{ posts, next }`. Each post carries a `media` array holding every photo in it,
because most posts on this account are albums of up to twenty: without the
`children` field the API returns one cover each and the rest are unreachable.

**There is no refresh token here.** Unlike Spotify, this API has no permanent
credential you mint short-lived tokens from. The long-lived token is its own
renewal credential: you hand the current one to `refresh_access_token` and get
a new 60-day token back. So it's a chain, and it must not break — if the server
is off for 60 days there is nothing left to renew from and you regenerate by
hand. The server renews with two weeks to spare and writes the new token to
`.tokens.json`, so `.env` stays the file you paste into rather than one the
process edits underneath you.

Meta doesn't say how long a token minted in its dashboard lasts, so the 60 days
recorded at setup is an inference. Once the token is over 24 hours old, which is
the earliest Meta permits a refresh, the server does one renewal to replace that
guess with the expiry Meta actually reports. That also means the renewal path
runs within a day of setup rather than six weeks later, when a broken one would
be both silent and unrecoverable.

If you'd rather do the full OAuth round trip, `npm run auth:instagram --
--authorize` prints the URL, and `-- --code=…` exchanges what comes back. Meta
requires an https redirect URI, so there's no loopback server to catch it the
way the Spotify script does.

### Google Calendar

This used to authenticate with a bare API key, and an API key can only read a
calendar that has been made **fully public** — every event title, guest list and
location, to anyone who knew the calendar ID, so the page could render the word
"Busy". Now it's a service account asking for free/busy, which returns intervals
and nothing else.

1. In [console.cloud.google.com](https://console.cloud.google.com), create a
   project, then **APIs & Services > Library** and enable the **Google Calendar
   API**. Nothing works until this is on.
2. **APIs & Services > Credentials > Create credentials > Service account.**
   Any name. **Skip the optional roles** — roles grant access to cloud
   resources, which is not how calendar access is granted.
3. Open the new service account, **Keys > Add key > Create new key > JSON**. It
   downloads once.
4. Turn that file into `.env` lines:

   ```bash
   npm run auth:google -- ~/Downloads/your-project-abc123.json
   ```

   It prints `GOOGLE_CLIENT_EMAIL` and a correctly escaped `GOOGLE_PRIVATE_KEY`,
   which saves getting the newlines wrong by hand.
5. `GOOGLE_CALENDAR_ID` is in the calendar's **Settings > Integrate calendar**.
   For your primary calendar it's your email address.
6. **Share the calendar with the service account.** In Google Calendar, the
   calendar's **Settings > Share with specific people > Add people**, paste the
   `client_email` address, and pick **See only free/busy (hide details)**.
7. Check it:

   ```bash
   npm run auth:google
   ```

   With no arguments it verifies what's in `.env` and reports how many busy
   blocks it can see.

Step 6 is the one that gets missed. A service account is a separate identity, so
creating it grants nothing by itself, and an unshared calendar answers
`notFound` rather than a permission error — which reads like a wrong calendar
ID and sends you back to step 5. If you see `notFound`, check the sharing first.

### Google Analytics

The guestbook heading uses GA4's site-wide historical `totalUsers` metric. It is
read-only and cached for ten minutes; loading the page does not write a second
visitor record to the guestbook database.

Enable **Google Analytics Data API** in the service account's Cloud project,
add that service account as a Viewer in the GA4 property's access management,
and set `GOOGLE_ANALYTICS_PROPERTY_ID`. The service account credentials are the
same `GOOGLE_CLIENT_EMAIL` and `GOOGLE_PRIVATE_KEY` used by Calendar.

The calendar stays private throughout. The service account can see that you're
busy and nothing more.

### Contact form

Any SMTP host. `MAIL_PORT=465` implies TLS; anything else is treated as
STARTTLS. Mail is sent from `MAIL_USER` with the visitor's address as `Reply-To`
rather than as `From`, which is what keeps the domain out of SPF and DMARC
trouble.

## Tokens on disk

`.tokens.json` holds the credentials that rotate on their own. It's gitignored
and written `0600`. Delete it and the server falls back to whatever is in
`.env`.

The previous version kept these in sync by rewriting `.env` and patching the
Heroku config, which restarted the dyno every time a token rolled over.

## Tests

```bash
npm test
```

Covers the poller and the SSE stream against a stubbed Spotify: payload shape,
that repeat callers are served from cache, that a stream opens with the current
track and gets pushed a new one when it changes, and that a finished track falls
back to history.

Also covers `/spotify/listening` against a token missing `user-library-read`:
that top artists and genres survive the 403 next to liked songs rather than
failing together, that genre weight is ranked and scaled correctly, and that a
track flattens down to what a list row needs.
