import 'dotenv/config'

const env = (key) => process.env[key]?.trim() || undefined

/** True only when every listed variable is present and non-empty. */
const has = (...keys) => keys.every((key) => Boolean(env(key)))

export const config = {
  port: Number(env('PORT') ?? 3000),

  /** Comma-separated list. Empty means allow any origin. */
  origins:
    env('ALLOWED_ORIGINS')
      ?.split(',')
      .map((value) => value.trim())
      .filter(Boolean) ?? [],

  database: {
    url: env('DATABASE_URL'),
    get configured() {
      return has('DATABASE_URL')
    },
  },

  spotify: {
    clientId: env('SPOTIFY_CLIENT_ID'),
    clientSecret: env('SPOTIFY_CLIENT_SECRET'),
    // Spotify rejects https-less redirect URIs except on the explicit loopback
    // address, and "localhost" does not count as one.
    redirectUri: env('SPOTIFY_REDIRECT_URI') ?? 'http://127.0.0.1:8888/callback',
    refreshToken: env('SPOTIFY_REFRESH_TOKEN'),
    get configured() {
      return has('SPOTIFY_CLIENT_ID', 'SPOTIFY_CLIENT_SECRET', 'SPOTIFY_REFRESH_TOKEN')
    },
  },

  instagram: {
    appId: env('INSTAGRAM_APP_ID'),
    appSecret: env('INSTAGRAM_APP_SECRET'),
    redirectUri: env('INSTAGRAM_REDIRECT_URI') ?? 'https://localhost:3000/instagram/callback',
    accessToken: env('INSTAGRAM_ACCESS_TOKEN'),
    get configured() {
      return has('INSTAGRAM_ACCESS_TOKEN')
    },
  },

  calendar: {
    calendarId: env('GOOGLE_CALENDAR_ID'),
    clientEmail: env('GOOGLE_CLIENT_EMAIL'),
    // Newlines survive a .env round trip as the two characters \ and n.
    privateKey: env('GOOGLE_PRIVATE_KEY')?.replace(/\\n/g, '\n'),
    get configured() {
      return has('GOOGLE_CALENDAR_ID', 'GOOGLE_CLIENT_EMAIL', 'GOOGLE_PRIVATE_KEY')
    },
  },

  mail: {
    host: env('MAIL_HOST'),
    port: Number(env('MAIL_PORT') ?? 465),
    user: env('MAIL_USER'),
    pass: env('MAIL_PASS'),
    to: env('MAIL_TO') ?? env('MAIL_USER'),
    get configured() {
      return has('MAIL_HOST', 'MAIL_USER', 'MAIL_PASS')
    },
  },
}
