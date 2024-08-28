<template>
  <v-card style="width: 600px">
    <v-card-text>
      <v-text-field v-model="selectedItem.name" label="Nom du marque"></v-text-field>
      <v-btn
        @click="createOrUpdate"
        class="my-2"
        color="primary"
        :loading="loading"
        :disabled="loading"
      >
        Ajouter Marque
        <v-icon right>fa-plus</v-icon>
      </v-btn>
    </v-card-text>
  </v-card>
</template>

<script>
export default {
  data: () => {
    return {
      selectedItem: {
        id: -1
      },
      loading: false
    }
  },
  methods: {
    itemCreated() {
      this.$emit('created', true);
      this.selectedItem = Object.assign({}, {});
      this.loading = false;
    },
    createOrUpdate() {
      this.loading = true;
      if ( this.selectedItem.name ) {
        const data = {
          name: this.selectedItem.name,
        };
        this.axios.post(`${process.env.VUE_APP_API_URL}/brand`, data).then(() => {
          this.$swal(
            'Succès!',
            'Les modifications ont été effectuées avec succès.',
            'success'
          );
          this.itemCreated();
        }).catch(() => {
          this.$swal(
            'Champs obligatoires manquants!',
            'Assurez-vous de remplir toutes les entrées obligatoires avant de soumettre votre demande.',
            'warning'
          );
        })
      } else {
        this.$swal(
          'Champs obligatoires manquants!',
          'Assurez-vous de remplir toutes les entrées obligatoires avant de soumettre votre demande.',
          'warning'
        );
      }
    },
  }
}
</script>

<style>

</style>