const SpotifyWebApi = require('spotify-web-api-node')

const spotify = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI
})
spotify.setRefreshToken(process.env.SPOTIFY_REFRESH_TOKEN)

module.exports = spotify