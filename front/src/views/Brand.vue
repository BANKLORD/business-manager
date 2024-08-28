<template>
  <v-container fill-height fluid max-width="1024px">

    <!-- Modify or Create new one -->
    <v-expand-transition>
      <v-row v-show="showCreateOrUpdateCard" class="text-center my-10" align="center" justify="center" max-width="1024px">
        <v-card style="width: 600px">
          <v-toolbar
            flat
            color="primary"
            dark
          >
            <v-spacer></v-spacer>
              <v-toolbar-title>{{ showCreateOrUpdateCardText }}</v-toolbar-title>
            <v-spacer></v-spacer>
          </v-toolbar>
          <v-card flat>
            <v-card-text>
              <v-text-field v-model="selectedItem.name" label="Spécifiez le nom du marque"></v-text-field>
            </v-card-text>
          </v-card>
          <v-card-actions class="justify-center" align="center" justify="center">
            <v-btn
              @click="createOrUpdate"
              class="my-2"
              color="primary"
            >
              Sauvegarder
              <v-icon right>fa-save</v-icon>
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-row>
    </v-expand-transition>
    <!-- List -->
    <v-row class="text-center" justify="center" max-width="1024px">
      <v-card>
        <v-toolbar
          flat
          color="primary"
          dark
        >
          <v-spacer></v-spacer>
          <v-toolbar-title class="text-center">{{ listTitle }}</v-toolbar-title>
          <v-spacer></v-spacer>
        </v-toolbar>
        <v-data-table
          :headers="brandsColumns"
          :items="brands"
          :items-per-page="5"
          class="elevation-1"
        >
          <template v-slot:top>
            <div class="text-center mx-1-rem">
              <v-btn
                v-if="$store.getters.hasPerm('brand-create')"
                color="primary"
                dark
                class="mb-2"
                @click="showCreateCard"
              >
                {{ addNewButtonText }}
                <v-icon
                  right
                  dark
                >
                  mdi-plus
                </v-icon>
              </v-btn>
            </div>
          </template>
          <template
            v-if="$store.getters.hasPerm('brand-update') || $store.getters.hasPerm('brand-delete')"
            v-slot:[`item.actions`]="{ item }"
          >
            <v-btn
              color="primary"
              icon
              v-if="$store.getters.hasPerm('brand-update')"
              @click="showEditCard(item)"
            >
              <v-icon
                small
              >
                mdi-pencil
              </v-icon>
            </v-btn>
            <v-btn
              color="red"
              class="mr-2"
              icon
              v-if="$store.getters.hasPerm('brand-delete')"
              @click="showDeleteConfirm(item)"
            >
              <v-icon
                small
              >
                mdi-delete
              </v-icon>
            </v-btn>
          </template>
        </v-data-table>
      </v-card>
    </v-row>
    <v-divider></v-divider>
  </v-container>
</template>

<script>
export default {
  computed: {
    showCreateOrUpdateCard() {
      return this.selectedItem.id
    },
    showCreateOrUpdateCardText() {
      return this.showCreateOrUpdateCard && this.selectedItem.id === -1 ? `Créer une nouvelle marque`:`Modifier: ${this.selectedItem.name}`;
    },
  },
  data: () => {
    return {
      listTitle: 'List des Marques',
      addNewButtonText: 'Nouvelle Marque',
      selectedItem: {
        id: 0
      },
      brandsColumns: [
        { text: '#', value: 'id', align: 'start' },
        { text: 'Nom', value: 'name' },
        { text: 'Actions', value: 'actions', sortable: false },
      ],
      brands: [],
    }
  },
  created() {
    this.loadItems();
  },
  methods: {
    loadItems() {
      this.axios.get(`${process.env.VUE_APP_API_URL}/brands`).then(res => {
        this.brands = res.data;
      });
    },
    showCreateCard() {
      this.selectedItem = { id: -1 };
    },
    createOrUpdate() {
      if ( this.selectedItem.id < 0 && this.selectedItem.name ) {
        const data = {
          name: this.selectedItem.name,
        };
        this.axios.post(`${process.env.VUE_APP_API_URL}/brand`, data).then(() => {
          this.resetAll();
          this.loadItems();
          this.$swal(
            'Succès!',
            'Les modifications ont été effectuées avec succès.',
            'success'
          )
        }).catch((err) => {
          if ( err.response.status == 422 ) {
            this.$swal(
              'Erreur',
              err.response.data,
              'warning'
            )
          }
          // console.log(err);
        })
      } else if ( this.selectedItem.id >  0) {
        const data = {
          name: this.selectedItem.name,
        };
        this.axios.put(`${process.env.VUE_APP_API_URL}/brand/${this.selectedItem.id}`, data).then(() => {
          this.resetAll();
          this.loadItems();
          this.$swal(
            'Succès!',
            'Les modifications ont été effectuées avec succès.',
            'success'
          )
        }).catch((err) => {
          if ( err.response.status == 422 ) {
            this.$swal(
              'Erreur',
              err.response.data,
              'warning'
            )
          }
          // console.log(err);
        })
      }
    },
    resetAll() {
      this.selectedItem = { id: 0 }
    },
    showEditCard(item) {
      this.selectedItem = item;
    },
    showDeleteConfirm(brand) {
      this.$swal({
        title: 'Êtes-vous sûr?',
        text: "Vous ne pourrez pas revenir en arrière!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Oui, supprimez-le!'
      }).then((result) => {
        if (result.isConfirmed) {
          this.axios.delete(`${process.env.VUE_APP_API_URL}/brand/${brand.id}`).then(() => {
            this.$swal(
              'Supprimé!',
              'Marque a été supprimé.',
              'success'
            );
            this.loadItems();
            // this.showCreateNewBrandCard()
            this.resetAll();
          }).catch(() => {
            this.$swal(
              'Erreur!',
              "Une erreur s'est produite lors de la suppression d'élement",
              'error'
            )
          })
        } else {
          this.$swal(
            'Erreur!',
            "Une erreur s'est produite lors de la suppression d'élement",
            'error'
          )
        }
      })
    },
  }
}
</script>

<style>

</style>
