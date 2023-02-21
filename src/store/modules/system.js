import config from '@/config';
import { getLocateLanguage } from '@/util';

let lastLanguageCache = localStorage.getItem('lang');
if (!lastLanguageCache) {
  lastLanguageCache = getLocateLanguage();
  localStorage.setItem('lang', lastLanguageCache);
}

export default {
  namespaced: true,
  state: () => ({
    config,
    locale: lastLanguageCache,
    networkType: process.env.CONFIG_NETWORK_TYPE,
  }),
  mutations: {
    setConfig(state, payload) {
      state.config = Object.assign(state.config, payload);
    },
    setLocale(state, payload) {
      state.locale = payload;
      localStorage.setItem('lang', payload);
    },
    setNetworkType(state, payload) {
      state.networkType = payload;
    },
  },
  actions: {
    setConfig(context, payload) {
      context.commit('setConfig', payload);
    },
    setLocale(context, payload) {
      context.commit('setLocale', payload);
    },
    setNetworkType(context, payload) {
      context.commit('setNetworkType', payload);
    },
  },
  getters: {
    config: (state) => {
      return state.config;
    },
    locale: (state) => {
      return state.locale;
    },
    networkType: (state) => {
      return state.networkType;
    },
  },
};
