import Vue from 'vue'
import Vuex from 'vuex'

import Deferred from '@gurupras/deferred'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    socket: undefined,
    socketReady: new Deferred()
  },
  getters: {
    socket: state => state.socket,
    socketReady: state => state.socketReady
  },
  mutations: {
    socket (state, v) {
      state.socket = v
    }
  },
  actions: {
  },
  modules: {
  }
})
