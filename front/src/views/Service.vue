<template>
  <v-container fill-height fluid max-width="1024px">

    <!-- Modify or Create new one -->
    <v-expand-transition>
      <v-row id="showCreateCard" v-show="showCreateOrUpdateCard" class="text-center my-10" align="center"
             justify="center" max-width="1024px">
        <v-card style="width: 600px">
          <v-toolbar
              flat
              color="primary"
              dark
          >
            <v-spacer></v-spacer>
            <v-toolbar-title>{{ showCreateOrUpdateCardText }}</v-toolbar-title>
            <v-spacer></v-spacer>
            <v-btn icon @click="resetAll">
              <v-icon>fa-times</v-icon>
            </v-btn>
          </v-toolbar>
          <v-card flat>
            <v-card-text>
              <!-- Service Name -->
              <v-text-field
                  label="Nom de service"
                  v-model="selectedItem.name"
              ></v-text-field>
              <!-- Service price -->
              <v-text-field
                  label="Prix de service"
                  v-model="selectedItem.sell_price"
                  type="number"
              ></v-text-field>
              <!-- Description -->
              <v-textarea
                  label="Description"
                  v-model="selectedItem.description"
              ></v-textarea>
            </v-card-text>
            <v-card-actions class="justify-center" align="center" justify="center">
              <v-btn
                  @click="createOrUpdate"
                  class="my-2"
                  color="primary"
                  :disabled="saveButtonLoading"
                  :loading="saveButtonLoading"
              >
                Sauvegarder
                <v-icon right>fa-save</v-icon>
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-card>
      </v-row>
    </v-expand-transition>
    <!-- List -->
    <v-row class="text-center" justify="center" max-width="1600px">
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
        <!-- Search Row -->
        <v-row class="mx-3 my-2" justify="center">
          <v-col>
            <v-text-field
                v-model.lazy="searchTerm"
                @change="searchTermChanged"
                label="Rechercher par nom"
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
                  v-if="$store.getters.hasPerm('product-create')"
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
          <template v-slot:[`item.name`]="{ item }">
            {{item.name}}
          </template>
          <template v-slot:[`item.sell_price`]="{ item }">
            {{ item.sell_price | formatPrice }}
          </template>
          <template
              v-if="$store.getters.hasPerm('service-update') || $store.getters.hasPerm('service-delete')"
              v-slot:[`item.actions`]="{ item }"
          >
            <v-menu offset-y>
              <template v-slot:activator="{ on, attrs }">
                <v-btn
                    color="primary"
                    icon
                    v-bind="attrs"
                    v-on="on"
                    :loading="loading"
                    :disabled="loading"
                >
                  <v-icon>fas fa-wrench</v-icon>
                </v-btn>
              </template>
              <v-list
                  nav
                  dense
              >
                <!-- Show service information -->
                <v-list-item
                    class="d-block" link
                    v-if="$store.getters.hasPerm('product-read')"
                    @click="showServiceInformation(item)"
                >
                  <v-list-item-title>
                    <v-btn
                        text
                        color="primary"
                        :loading="loading"
                        :disabled="loading"
                    >
                      <v-icon left> mdi-eye</v-icon>
                      Afficher les informations
                    </v-btn>
                  </v-list-item-title>
                </v-list-item>
                <!-- Modify -->
                <v-list-item
                    class="d-block" link
                    v-if="$store.getters.hasPerm('service-update')"
                    @click="showEditCard(item)"
                >
                  <v-list-item-title>
                    <v-btn
                        text
                        color="primary"
                        :loading="loading"
                        :disabled="loading"
                    >
                      <v-icon left> mdi-pencil</v-icon>
                      Modifier
                    </v-btn>
                  </v-list-item-title>
                </v-list-item>
                <!-- Delete -->
                <v-list-item
                    class="d-block" link
                    v-if="$store.getters.hasPerm('service-delete')"
                    @click="showDeleteConfirm(item)"
                >
                  <v-list-item-title>
                    <v-btn
                        text
                        color="red"
                        :loading="loading"
                        :disabled="loading"
                    >
                      <v-icon left> mdi-delete</v-icon>
                      Supprimer
                    </v-btn>
                  </v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </template>
        </v-data-table>
      </v-card>
    </v-row>
    <v-divider></v-divider>
    <!-- Dialogs -->
    <v-dialog
        fullscreen
        transition="dialog-bottom-transition"
        persistent
        v-model="showServiceInformationDialog"
    >
      <v-card tile>
        <v-toolbar dark color="primary">
          <!-- Close Dialog Button -->
          <v-spacer></v-spacer>
          <v-btn icon dark @click="showServiceInformationDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar>
        <v-container>
          <v-row justify="center">
            <v-col cols="12" md="10" lg="8">
              <ProductInformation
                  v-if="showServiceInformationDialog"
                  v-bind:product="serviceInformation"
              ></ProductInformation>
            </v-col>
          </v-row>
        </v-container>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import ProductInformation from '@/components/product-management/ProductInformation';

export default {
  components: {ProductInformation},
  watch: {
    searchTerm() {
      if (this.searchTerm.length === 0)
        this.loadServices();
    },
  },
  computed: {
    showCreateOrUpdateCard() {
      return this.selectedItem.id
    },
    showCreateOrUpdateCardText() {
      return (this.showCreateOrUpdateCard < 0) ? `Création d'un nouveau service` : `Modification de: ${this.selectedItem?.name ? this.selectedItem?.name : ''}`;
    },
  },
  data: () => {
    return {
      saveButtonLoading: false,
      wholesale_margin: 0.00,
      retail_margin: 0.00,
      searchTerm: '',
      listTitle: 'Liste des services',
      addNewButtonText: 'Nouveau service',
      selectedItem: {
        id: 0
      },
      columns: [
        {text: '#', value: 'id', align: 'start'},
        {text: 'Nom', value: 'name'},
        {text: 'Prix', value: 'sell_price'},
        {text: 'Actions', value: 'actions', sortable: false},
      ],
      items: [],
      loading: false,
      showServiceInformationDialog: false,
      serviceInformation: {},
    }
  },
  created() {
    this.loadItems();
    /** Get URL Search Params */
  },
  methods: {
    async showServiceInformation(service) {
      this.loading = true;
      const results = await this.axios.get(`${process.env.VUE_APP_API_URL}/service/${service.id}`);
      if (results.data.id > 0) {
        this.serviceInformation = results.data;
        this.showServiceInformationDialog = true;
      }
      this.loading = false;
    },
    // sellPriceChanged(val) {
    //   let sellPrice = val;
    //   let retailPrice = this.selectedItem.retail_price;
    //   let retail_margin = parseFloat(parseFloat(retailPrice / buyPrice) - 1).toFixed(2) * 100
    //   this.retail_margin = retail_margin;
    //   let wholesalePrice = this.selectedItem.wholesale_price;
    //   let wholesale_margin = parseFloat(parseFloat(wholesalePrice / buyPrice) - 1).toFixed(2) * 100
    //   this.wholesale_margin = wholesale_margin.toFixed(2);
    // },
    searchTermChanged() {
      this.loadServices();
      // console.log("searchTermChanged");
    },
    loadServices() {
      let searchParams = {};
      if (this.searchTerm)
        searchParams.searchTerm = this.searchTerm
      /**  */
      this.axios.get(`${process.env.VUE_APP_API_URL}/services`, {params: searchParams}).then(res => {
        this.items = res.data;
      });
    },
    // ???
    loadItems() {
      this.axios.get(`${process.env.VUE_APP_API_URL}/services`).then(res => {
        this.items = res.data;
      });
    },
    showCreateCard() {
      this.selectedItem = {
        id: -1,
        name: '',
        sell_price: 0.00,
      };
      document.querySelector('#showCreateCard').scrollIntoView({
        behavior: 'smooth'
      });
    },
    createOrUpdate() {
      this.saveButtonLoading = true;
      /** data to send through the request */
      let data = {}
      const {
        id,
        name,
        sell_price,
        description,
      } = this.selectedItem;

      if (!name || !sell_price || !description)
        return this.$swal(
            'Champs obligatoires manquants!',
            'Assurez-vous de remplir toutes les entrées obligatoires avant de soumettre votre demande.',
            'warning'
        )
      /** service */
      if (this.selectedItem.name)
        data.name = name;
      if (this.selectedItem.sell_price)
        data.sell_price = sell_price;
      if (this.selectedItem.description)
        data.description = description;
      /** Method will be put or create */
      const method =
          (id < 0) ?
              'post' : (id > 0) ?
                  'put' : null
      /** URL changes depends if your modifying or creating a new record */
      const url =
          (id < 0) ?
              `${process.env.VUE_APP_API_URL}/service` : (id > 0) ?
                  `${process.env.VUE_APP_API_URL}/service/${id}` : null
      /** Now send the request */
      this.axios({
        url: url,
        method: method,
        data: data
      }).then(() => {
        this.saveButtonLoading = false;
        this.resetAll();
        this.loadItems();
        this.$swal(
            'Succès!',
            'Les modifications ont été effectuées avec succès.',
            'success'
        );
      }).catch(() => {
        this.saveButtonLoading = false;
        this.$swal(
            'Nom est déja existe',
            "Le nom que vous essayez d'insérer existe déjà dans les enregistrements.",
            'warning'
        )
      })
    },
    resetAll() {
      this.selectedItem = {id: 0}
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
          this.axios.delete(`${process.env.VUE_APP_API_URL}/service/${item.id}`).then(() => {
            this.$swal(
                'Supprimé!',
                'service a été supprimé.',
                'success'
            );
            this.loadItems();
            // this.showCreateNewBrandCard()
            this.resetAll();
          }).catch(() => {
            this.$swal(
                'Erreur!',
                "Une erreur s'est produite lors de la suppression de service",
                'error'
            )
          })
        } else {
          this.$swal(
              'Erreur!',
              "Une erreur s'est produite lors de la suppression de service",
              'error'
          )
        }
      })
    },
  }
}
</script>
