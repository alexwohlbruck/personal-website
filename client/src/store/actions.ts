import axios from '@/axios'

export const getSpotifyPlaybackState = async ({ commit }) => {
  const { data } = await axios.get('spotify/playback-state')
  commit('SET_SPOTIFY_PLAYBACK_STATE', data)
  return data
}

export const getIgGrid = async ({ commit }) => {
  const { data } = await axios.get('ig/grid')
  commit('SET_IG_GRID', data)
  return data
}

export const sendMessage = async  (_store, { name, email, message }) => {
  const data = await axios.post('/mailer/contact', {
    name,
    email,
    message
  })
  return data
}