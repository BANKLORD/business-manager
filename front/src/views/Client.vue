<template>
  <v-container fill-height fluid max-width="1444px">

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
            <v-toolbar-title>{{ showCreateOrUpdateCardText }}</v-toolbar-title>
            <v-spacer></v-spacer>
          </v-toolbar>
          <v-card flat>
            <v-card-text>
              <v-row>
                <!-- Nom -->
                <v-col cols="6">
                  <v-text-field
                    label="Nom"
                    v-model="selectedItem.name"
                  ></v-text-field>
                </v-col>
                <!-- Prenom -->
                <v-col cols="6">
                  <v-text-field
                    label="Prénom"
                    v-model="selectedItem.surname"
                  ></v-text-field>
                </v-col>
                <!-- Company name & Address -->
                <v-col cols="12">
                  <v-text-field
                    label="Nom de société"
                    v-model="selectedItem.companyName"
                  ></v-text-field>
                  <!-- <v-text-field
                    label="Adresse"
                    v-model="selectedItem.address"
                  ></v-text-field> -->
                </v-col>
                <!-- ICE -->
                <v-col cols="6">
                  <v-text-field
                    label="ICE"
                    v-model="selectedItem.ice"
                  ></v-text-field>
                </v-col>
                <!-- R.C -->
                <v-col cols="6">
                  <v-text-field
                    label="R.C"
                    v-model="selectedItem.rc"
                  ></v-text-field>
                </v-col>
                <!-- Type Select -->
                <v-col cols="6" class="d-none">
                  <v-select
                    label="Type ( Client / Fournisseur )"
                    v-model="selectedItem.type"
                    :items="concernTypes"
                    item-value="id"
                    item-text="name"
                  ></v-select>
                </v-col>
                <!-- Address -->
                <v-col cols="6">
                  <v-text-field
                    label="Adresse"
                    v-model="selectedItem.address"
                  ></v-text-field>
                </v-col>
                <!-- Zip Code -->
                <v-col cols="6">
                  <v-text-field
                    label="Zip Code"
                    v-model="selectedItem.zip"
                  ></v-text-field>
                </v-col>
                <!-- City -->
                <v-col cols="6">
                  <v-text-field
                    label="Ville"
                    v-model="selectedItem.city"
                  ></v-text-field>
                </v-col>
                <!-- Country -->
                <v-col cols="6">
                  <v-text-field
                    label="Pays"
                    v-model="selectedItem.country"
                  ></v-text-field>
                </v-col>
                <!-- Activity -->
                <v-col cols="6">
                  <v-text-field
                    label="Activité"
                    v-model="selectedItem.activity"
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
    <!-- List -->
    <v-row class="text-center" justify="center" max-width="1444px">
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
          <v-col class="d-none">
            <v-select
              label="Filtrer par Client / Fournisseur"
              :items="typesFilter"
              v-model="selectedType"
              item-text="name"
              item-value="id"
            ></v-select>
          </v-col>
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
          <template v-slot:[`item.fullname`]="{ item }">
            {{ item.name + ' ' + item.surname }}
          </template>
          <template v-slot:[`item.type`]="{ item }">
            <!-- {{ (item.type == 'Client') ? "Client":(item.type == 'Provider') ? "Fournisseur":"Client & Fournisseur" }} -->
            {{ concernTypes.find(t => t.id == item.type)?.name }}
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
  </v-container>
</template>

<script>
export default {
  watch: {
    searchTerm() {
      if ( this.searchTerm.length == 0 )
        this.loadConcerns();
    },
    selectedType() {
      this.loadConcerns();
    },
  },
  computed: {
    typesFilter() {
      let types = Object.assign([], this.concernTypes);
      types.unshift({ id: null, name: "Afficher tout" })
      return types;
    },
    showCreateOrUpdateCard() {
      return this.selectedItem.id
    },
    showCreateOrUpdateCardText() {
      return (this.showCreateOrUpdateCard < 0) ? `Création d'un nouveau Client`:`Modification de: ${this.selectedItem?.companyName ?? this.selectedItem?.name}`;
    },
  },
  data: () => {
    return {
      concernTypes: [
        { id: 'Client', name: "Client" },
        { id: 'Provider', name: "Fournisseur" },
        { id: 'Both', name: "Client & Fournisseur" },
      ],
      searchTerm: '',
      selectedType: -1,
      listTitle: 'List des clients',
      addNewButtonText: 'Nouveau Client',
      selectedItem: {
        id: 0
      },
      columns: [
        { text: '#', value: 'id', align: 'start' },
        // { text: 'Client / Fournisseur', value: 'type' },
        { text: 'Nom', value: 'fullname' },
        { text: 'Nom de société', value: 'companyName' },
        { text: 'ICE', value: 'ice' },
        { text: 'R.C', value: 'rc' },
        { text: 'Activité', value: 'activity' },
        { text: 'Actions', value: 'actions', sortable: false },
      ],
      items: [],
    }
  },
  created() {
    this.loadItems();
  },
  methods: {
    searchTermChanged() {
      this.loadConcerns();
      // console.log("searchTermChanged");
    },
    loadConcerns() {
      let searchParams = {};
      searchParams.type = 'Client';
      if ( this.searchTerm )
        searchParams.searchTerm = this.searchTerm
      /** */
      this.axios.get(`${process.env.VUE_APP_API_URL}/concerns`, { params: searchParams }).then(res => {
        this.items = res.data;
      });
    },
    loadItems() {
      this.loadConcerns()
    },
    showCreateCard() {
      this.selectedItem = {
        id: -1,
      };
    },
    createOrUpdate() {
      /** data to send through the request */
      const { id } = this.selectedItem;
      this.selectedItem.type = 'Client';
      /** Method will be put or create */
      const method =
        (id < 0) ?
        'post':(id > 0) ?
        'put':null
      /** URL changes depends if your modifying or creating a new record */
      const url =
        (id < 0) ?
        `${process.env.VUE_APP_API_URL}/concern`:(id > 0) ?
        `${process.env.VUE_APP_API_URL}/concern/${id}`:null
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
              "Une erreur s'est produite lors de la suppression de rôle",
              'error'
            )
          })
        } else {
          this.$swal(
            'Erreur!',
            "Une erreur s'est produite lors de la suppression de rôle",
            'error'
          )
        }
      })
    },
  }
}
</script>
