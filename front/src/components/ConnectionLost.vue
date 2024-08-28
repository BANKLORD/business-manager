<template>
  <v-snackbar
    v-model="isConnected"
    :timeout="-1" 
    bottom 
    center 
    color="warning"
  >
    <v-row no-gutters align="center">
      <v-col cols="9" class="text-start">
        <span>
          Connexion perdue
        </span>
      </v-col>
      <v-col cols="3" class="text-end">
        <v-btn
          @click="retryConnection"
          :loading="loading"
          :disabled="loading" 
          color="primary" dark
          fab small
        >
          <v-icon>mdi-reload</v-icon>
        </v-btn>
      </v-col>
    </v-row>
  </v-snackbar>
</template>

<script>
export default {
  data() {
    return {
      snackbar: false,
      loading: true,
      isConnected: false,
    }
  },
  mounted() {
    window.addEventListener('online', this.handleNetworkChange);
    window.addEventListener('offline', this.handleNetworkChange);
    this.checkConnectivity();
  },
  destroyed() {
    window.removeEventListener('online', this.handleNetworkChange);
    window.removeEventListener('offline', this.handleNetworkChange);
  },
  methods: {
    handleNetworkChange() {
      console.log('Network status changed!');
      this.isConnected = !navigator.onLine;
    },
    checkConnectivity() {
      console.log('Checking connectivity...');
      const online = navigator.onLine;
      this.isConnected = !online;
    },
    retryConnection() {
      // setTimeout(() => {
      //   this.handleNetworkChange();
      // }, 1200)
      console.log('Retrying connection...')
    }
  }
}
</script>