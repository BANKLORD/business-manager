<template>
  <div></div>
</template>

<script>
export default {
  mounted() {
    this.$store.commit('changeAuthToken', null);
    window.location = '/login'
  },
}
</script>