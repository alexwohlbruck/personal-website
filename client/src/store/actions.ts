import axios from 'axios'

export const getSpotifyPlaybackState = async ({ commit }) => {
  const { data } = await axios.get('http://192.168.86.25:3000/spotify/playback-state')
  commit('setSpotifyPlaybackState', data)
}

