import axios from '@/axios'

export const getSpotifyPlaybackState = async ({ commit }) => {
  const { data } = await axios.get('spotify/playback-state')
  commit('SET_SPOTIFY_PLAYBACK_STATE', data)
}

export const getIgGrid = async ({ commit }) => {
  const { data } = await axios.get('ig/grid')
  commit('SET_IG_GRID', data)
}