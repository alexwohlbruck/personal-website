import axios from 'axios'

export const getSpotifyPlaybackState = async ({ commit }) => {
  const { data } = await axios.get('http://localhost:3000/spotify/playback-state')
  commit('SET_SPOTIFY_PLAYBACK_STATE', data)
}

