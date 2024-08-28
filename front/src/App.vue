<template>
  <v-app>
    <connection-lost></connection-lost>
    <AppBar></AppBar>
    <v-main>
      <v-overlay
        absolute
        v-model="overlay"
        class="align-center justify-center"
      >
        <v-progress-circular
          color="primary"
          indeterminate
          size="64"
        ></v-progress-circular>
      </v-overlay>
      <div style="margin: 15px;min-height: calc(100vh - 183px);">
        <router-view/>
      </div>
      <Footer></Footer>
    </v-main>
  </v-app>
</template>
<script>
import AppBar from "./components/AppBar.vue";
import Footer from "./components/Footer.vue";
import ConnectionLost from './components/ConnectionLost.vue';

export default {
  components: { AppBar, Footer, ConnectionLost },
  computed: {
    overlay() {
      return this.$store.state.overlay;
    }
  },
  watch:{
    $route() {
      this.axios.defaults.headers.common['auth'] = this.$store.state.authToken
      this.axios.get(`${process.env.VUE_APP_API_URL}/isLogged`).then((res) => {
        if ( res.data.permissions ) {
          this.$store.commit("changePermissions", res.data.permissions)
        }
        if ( res.data.role ) {
          this.$store.commit("changeRole", res.data.role)
        }
      }).catch(() => {
        this.$store.commit("changeAuthToken", null)
        this.$store.commit("changePermissions", [])
        this.$store.commit("changeRole", {})
      })
      this.axios.get(`${process.env.VUE_APP_API_URL}/company`).then(res => {
        this.$store.commit('changeCompany', res.data);
      })
    }
  },
  
}
</script>
<style>
/* width */
::-webkit-scrollbar {
  width: 5px;
}

/* Track */
::-webkit-scrollbar-track {
  background: #f1f1f1; 
}
 
/* Handle */
::-webkit-scrollbar-thumb {
  background: #7857d5a4; 
}

/* Handle on hover */
::-webkit-scrollbar-thumb:hover {
  background: #7857d5d2; 
}
</style>
