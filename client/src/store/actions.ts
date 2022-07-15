import axios from "@/axios";
import Vue from "vue";

export const getSpotifyPlaybackState = async ({ commit }) => {
  const { data } = await axios.get("spotify/playback-state");
  commit("SET_SPOTIFY_PLAYBACK_STATE", data);
  return data;
};

export const getIgGrid = async ({ commit }) => {
  const { data } = await axios.get("ig/grid");
  commit("SET_IG_GRID", data);
  return data;
};

export const getCalendarEvents = async ({ commit }) => {
  const { data } = await axios.get("calendar", {
    params: {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  });
  commit("SET_CALENDAR_EVENTS", data.events);
};

export const sendMessage = async (_store, { name, email, message }) => {
  const { data } = await axios.post("/mailer/contact", {
    name,
    email,
    message,
  });
  Vue.toasted.show(data.message);
  return data;
};
