import { OfflineStateItem } from './localStorageSync'

export default {
  SET_OFFLINE_STATE_ITEM(state, { key, value }: OfflineStateItem) {
    state[key] = value
  },
  SET_USER(state, user) {
    state.me = user
  },
  SET_SPOTIFY_PLAYBACK_STATE(state, playbackState) {
    state.spotifyPlaybackState = playbackState
  },
  SET_IG_GRID(state, grid) {
    state.igGrid = grid
  },
  SET_CALENDAR_EVENTS(state, events) {
    state.calendarEvents = events
  },
}
