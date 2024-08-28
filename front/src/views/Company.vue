<template>
  <v-container fill-height fluid max-width="1444px">
    <!-- List -->
    <v-row class="text-center" justify="center" max-width="1444px">
      <v-card>
        <v-toolbar
          flat
          color="primary"
          dark
        >
          <v-spacer></v-spacer>
          <v-toolbar-title class="text-center" v-text="listTitle"></v-toolbar-title>
          <v-spacer></v-spacer>
        </v-toolbar>
        <v-data-table
          :headers="columns"
          :items="items"
          :items-per-page="8"
          class="elevation-1"
        >
          <template v-slot:top>
            <div class="text-center mx-1-rem">
              <v-btn
                v-if="$store.getters.hasPerm('concern-create')"
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
          <template v-slot:[`item.active`]="{ item }">
            {{ item.active ? 'Activé':'Désactivé' }}
          </template>
          <template
            v-if="$store.getters.hasPerm('concern-update') || $store.getters.hasPerm('concern-delete')"
            v-slot:[`item.actions`]="{ item }"
          >
            <v-btn
              color="primary"
              icon
              v-if="$store.getters.hasPerm('concern-update')"
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
              v-if="$store.getters.hasPerm('concern-delete')"
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
    <!-- Modify or Create new one -->
    <v-expand-transition>
      <v-row v-show="showCreateOrUpdateCard" class="text-center my-10" align="center" justify="center" max-width="1444px">
        <v-card style="width: 720px">
          <v-toolbar
            flat
            color="primary"
            dark
          >
            <v-spacer></v-spacer>
            <v-toolbar-title v-text="showCreateOrUpdateCardText"></v-toolbar-title>
            <v-spacer></v-spacer>
          </v-toolbar>
          <v-card flat>
            <v-card-text>
              <v-row>
                <!-- Nom -->
                <v-col cols="6">
                  <v-text-field
                    label="Nom de société"
                    v-model="selectedItem.name"
                  ></v-text-field>
                </v-col>
                <!-- ICE -->
                <v-col cols="6">
                  <v-text-field
                    label="ICE"
                    v-model="selectedItem.ICE"
                  ></v-text-field>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
          <v-card-actions class="justify-center" align="center" justify="center">
            <v-btn
              @click="createOrUpdate"
              class="my-2"
              outlined
              rounded
              text
              color="primary"
            >
              Sauvegarder
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-row>
    </v-expand-transition>
  </v-container>
</template>

<script>
export default {
  watch: {
    searchTerm() {
      if ( this.searchTerm.length == 0 )
        this.loadCompanies();
    },
    selectedType() {
      this.loadCompanies();
    },
  },
  computed: {
    showCreateOrUpdateCard() {
      return this.selectedItem.id
    },
    showCreateOrUpdateCardText() {
      return this.showCreateOrUpdateCard ? `Création d'une nouvelle société`:`Modification de: ${this.selectedItem?.name}`;
    },
  },
  data: () => {
    return {
      selectedType: -1,
      listTitle: 'List des société enregistrer',
      addNewButtonText: 'Nouvelle Société',
      selectedItem: {
        id: 0
      },
      columns: [
        { text: '#', value: 'id', align: 'start' },
        { text: 'Nom', value: 'name' },
        { text: 'ICE', value: 'ICE' },
        { text: 'Activé', value: 'active' },
        { text: 'Actions', value: 'actions', sortable: false },
      ], 
      items: [],
    }
  },
  created() {
    this.loadItems();
  },
  methods: {
    loadItems() {
      this.axios.get(`${process.env.VUE_APP_API_URL}/companies`).then(res => {
        this.items = res.data;
      });
    },
    showCreateCard() {
      this.selectedItem = {  
        id: -1, 
      };
    },
    createOrUpdate() {
      /** data to send through the request */
      const { id } = this.selectedItem;
      /** Method will be put or create */
      const method = 
        (id < 0) ? 
        'post':(id > 0) ? 
        'put':null
      /** URL changes depends if your modifying or creating a new record */
      const url =
        (id < 0) ? 
        `${process.env.VUE_APP_API_URL}/company`:(id > 0) ? 
        `${process.env.VUE_APP_API_URL}/company/${id}`:null
      /** Now send the request */
      this.axios({
        url: url,
        method: method,
        data: this.selectedItem
      }).then(() => {
        this.resetAll();
        this.loadItems();
        this.$swal(
          'Succès!',
          'Les modifications ont été effectuées avec succès.',
          'success'
        )
      }).catch(err => {
        this.$swal(
          'Champs obligatoires manquants!',
          'Assurez-vous de remplir toutes les entrées obligatoires avant de soumettre votre demande.',
          'warning'
        )
        console.log(err);
      })
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
          this.axios.delete(`${process.env.VUE_APP_API_URL}/concern/${item.id}`).then(() => {
            this.$swal(
              'Supprimé!',
              'catégorie a été supprimé.',
              'success'
            );
            this.loadItems();
            this.resetAll();
          }).catch(() => {
            this.$swal(
              'Erreur!',
              "Une erreur s'est produite lors de la suppression de société",
              'error'
            )
          })
        } else {
          this.$swal(
            'Erreur!',
            "Une erreur s'est produite lors de la suppression de la société",
            'error'
          )
        }
      })
    },
  }
}
</script>