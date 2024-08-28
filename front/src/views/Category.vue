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
            <v-toolbar-title>{{ showCreateOrUpdateCardText }}</v-toolbar-title>
            <v-spacer></v-spacer>
            <v-btn icon @click="resetAll"><v-icon>fa-times</v-icon></v-btn>
          </v-toolbar>
          <v-card flat>
            <v-card-text>
              <v-text-field v-model="selectedItem.name" label="Spécifiez le nom du famille"></v-text-field>
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

        <!-- Search Rows -->
        <v-row class="mx-3 my-2" justify="center">
          <v-col>
            <v-text-field
              v-model.lazy="searchTerm"
              @change="searchTermChanged"
              label="Rechercher"
              append-icon="mdi-magnify"
              @click:append="searchTermChanged"
              v-on:keyup.enter="searchTermChanged"
            ></v-text-field>
          </v-col>
        </v-row>
        <v-data-table
          :headers="categoryColumns"
          :items="categories"
          :items-per-page="5"
          class="elevation-1"
        >
          <template v-slot:top>
            <div class="text-center mx-1-rem">
              <v-btn
                v-if="$store.getters.hasPerm('category-create')"
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
            v-if="$store.getters.hasPerm('category-update') || $store.getters.hasPerm('category-delete')"
            v-slot:[`item.actions`]="{ item }"
          >
            <v-tooltip bottom>
              <template v-slot:activator="{ on, attrs }">
                <v-btn
                  v-on="on"
                  v-bind="attrs"
                  color="primary"
                  icon
                  v-if="$store.getters.hasPerm('product-read')"
                  :to="`/products?category=${item.id}`"
                >
                  <v-icon
                    small
                  >
                    mdi-inbox-multiple
                  </v-icon>
                </v-btn>
              </template>
              <span>Voir les produits</span>
            </v-tooltip>
            <v-btn
              color="primary"
              icon
              v-if="$store.getters.hasPerm('category-update')"
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
              v-if="$store.getters.hasPerm('category-delete')"
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
      return (this.showCreateOrUpdateCard < 0) ? `Création d'une nouvelle famille`:`Modification de: ${this.selectedItem.name}`;
    },
  },
  watch: {
    searchTerm() {
      if ( this.searchTerm.length == 0 )
        this.loadItems();
    },
  },
  data: () => {
    return {
      searchTerm: '',
      listTitle: 'List des familles',
      addNewButtonText: 'Nouvelle famille',
      selectedItem: {
        id: 0
      },
      categoryColumns: [
        { text: '#', value: 'id', align: 'start' },
        { text: 'Nom', value: 'name' },
        { text: 'Actions', value: 'actions', sortable: false },
      ],
      categories: [],
    }
  },
  created() {
    this.loadItems();
  },
  methods: {
    searchTermChanged() {
      this.loadItems();
    },
    loadItems() {
      let searchParams = {};
      if ( this.searchTerm )
        searchParams.searchTerm = this.searchTerm
      /** */
      this.axios.get(`${process.env.VUE_APP_API_URL}/categories`, { params: searchParams }).then(res => {
        this.categories = res.data;
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
        this.axios.post(`${process.env.VUE_APP_API_URL}/category`, data).then(() => {
          this.resetAll();
          this.loadItems();
          this.$swal(
            'Succès!',
            'Les modifications ont été effectuées avec succès.',
            'success'
          )
        }).catch(() => {
          this.$swal(
            'Champs obligatoires manquants!',
            'Assurez-vous de remplir toutes les entrées obligatoires avant de soumettre votre demande.',
            'warning'
          )
          // console.log(err);
        })
      } else if ( this.selectedItem.id >  0) {
        const data = {
          name: this.selectedItem.name,
        };
        this.axios.put(`${process.env.VUE_APP_API_URL}/category/${this.selectedItem.id}`, data).then(() => {
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
    showDeleteConfirm(item) {
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
          this.axios.delete(`${process.env.VUE_APP_API_URL}/category/${item.id}`).then(() => {
            this.$swal(
              'Supprimé!',
              'famille a été supprimé.',
              'success'
            );
            this.loadItems();
            // this.showCreateNewBrandCard()
            this.resetAll();
          }).catch(() => {
            this.$swal(
              'Erreur!',
              "Une erreur s'est produite lors de la suppression d'elemnt",
              'error'
            )
          })
        } else {
          this.$swal(
            'Erreur!',
            "Une erreur s'est produite lors de la suppression d'elemnt",
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
