import Vue from 'vue'
import Vuex from 'vuex'
import createPersistedState from 'vuex-persistedstate'
Vue.use(Vuex)

export default new Vuex.Store({
  plugins: [createPersistedState({
    storage: window.sessionStorage,
  })],
  state: {
    overlay: false,
    authToken: null,
    company: {},
    permissions: [],
    role: {},
  },
  mutations: {
    setOverlay: (state, overlayStatus) => {
      state.overlay = overlayStatus;
    },
    changeAuthToken: (state, token) => {
      state.authToken = token;
    },
    changePermissions: (state, permissions) => {
      state.permissions = permissions
    },
    changeRole: (state, role) => {
      state.role = role
    },
    changeCompany: (state, company) => {
      state.company = company
    },
  },
  actions: {
  },
  getters: {
    loggedIn(state) {
      if ( state.authToken ) {
        return true
      }
      return false
    },
    hasPerm: (state) => (permissionName) => {
      return state.permissions.find(perm => (perm.name == permissionName || perm.name == 'dev')) ? true:false
    },
    getCompany(state) {
      return state.company
    },
    getOverlay(state) {
      return state.overlay
    }
  },
  modules: {
  }
})
