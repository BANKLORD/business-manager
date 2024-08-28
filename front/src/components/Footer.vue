<template>
  <v-footer class="d-flex primary lighten-5 flex-column">
    <div class="d-flex w-100 align-center px-4">
      <!-- <strong>Get connected with us on social networks!</strong> -->

      <v-spacer></v-spacer>

      <v-btn
        v-for="icon in icons"
        :key="icon"
        class="mx-4"
        icon
        variant="plain"
        size="small"
      >
        <v-icon>{{ icon }}</v-icon>
      </v-btn>
    </div>

    <div class="px-4 py-2 text-center w-100">
      Copyright © {{ new Date().getFullYear() }} — <strong>Oussama ELM™</strong>
    </div>
  </v-footer>
</template>
<script>
export default {
  name: 'Footer',
  data: () => ({
    icons: [
      'mdi-facebook',
      'mdi-twitter',
      'mdi-linkedin',
      'mdi-instagram',
    ],
  }),
}
</script>