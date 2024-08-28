<template>
  <v-card style="width: 600px">
    <v-card-text>
      <v-text-field v-model="selectedItem.name" label="Nom du famille"></v-text-field>
      <v-btn
        @click="createOrUpdate"
        class="my-2"
        color="primary"
        :disabled="loading"
        :loading="loading"
      >
        Ajouter Famille
        <v-icon right>fa-plus</v-icon>
      </v-btn>
    </v-card-text>
  </v-card>
</template>

<script>
export default {
  computed: {
    showCreateOrUpdateCardText() {
      return this.showCreateOrUpdateCard ? `Création d'une nouvelle famille`:`Modification de: ${this.selectedItem.name}`;
    },
  },
  data: () => {
    return {
      selectedItem: {
        id: -1
      },
      loading: false,
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
        this.axios.post(`${process.env.VUE_APP_API_URL}/category`, data).then(() => {
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
          )
          this.loading = false;
        })
      } else {
        this.$swal(
          'Champs obligatoires manquants!',
          'Assurez-vous de remplir toutes les entrées obligatoires avant de soumettre votre demande.',
          'warning'
        );
        this.loading = false;
      }
    },
  }
}
</script>

<style>

</style>