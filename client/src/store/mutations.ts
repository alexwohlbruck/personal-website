export default {
  SET_SPOTIFY_PLAYBACK_STATE(state, playbackState) {
    state.spotifyPlaybackState = playbackState;
  },
  SET_IG_GRID(state, grid) {
    state.igGrid = grid;
  },
  SET_CALENDAR_EVENTS(state, events) {
    state.calendarEvents = events;
  },
};
