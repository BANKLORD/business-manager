<template>
  <v-container fill-height fluid max-width="1024px">
    <!-- List -->
    <v-row class="text-center" justify="center" max-width="1024px">
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
        <!-- Search Rows -->
        <v-row class="mx-3 my-2" justify="center">
          <v-col>
            <v-autocomplete
              label="Filtrer par famille"
              :items="categoriesFilter" 
              v-model="selectedCategory" 
              item-text="name" 
              item-value="id"
            ></v-autocomplete>
          </v-col>
          <!-- <v-col>
            <v-select 
              label="Filtrer par marque"
              :items="brandsFilter" 
              v-model="selectedBrand" 
              item-text="name" 
              item-value="id"
            ></v-select>
          </v-col> -->
          <v-col>
            <v-autocomplete
              :items="productCodes"
              item-text="code"
              item-value="product"
              v-model="searchProduct"
              @change="searchProductChanged"
              label="Rechercher par produit"
            ></v-autocomplete>
          </v-col>
        </v-row>
        <v-row class="mx-3 my-2" justify="center">
          <v-col>
            <v-text-field
              v-model.lazy="searchTerm"
              @change="searchTermChanged"
              label="Rechercher par référence"
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
                v-if="$store.getters.hasPerm('inventory-create')"
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
          <template v-slot:[`item.product`]="{ item }">
            <ul>
              <li v-for="code in item.product.productCodes" :key="`lipcode_${code.id}`" v-text="code.code"></li>
            </ul>
          </template>
          <template
            v-if="$store.getters.hasPerm('inventory-update') || $store.getters.hasPerm('inventory-delete')"
            v-slot:[`item.actions`]="{ item }"
          >
            <v-btn
              color="primary"
              icon
              v-if="$store.getters.hasPerm('inventory-update')"
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
              v-if="$store.getters.hasPerm('inventory-delete')"
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
      <v-row v-show="showCreateOrUpdateCard" class="text-center my-10" align="center" justify="center" max-width="1024px">
        <v-card style="width: 600px">
          <v-toolbar
            flat
            color="primary"
            dark
          >
            <v-spacer></v-spacer>
            <v-toolbar-title v-text="showCreateOrUpdateCardText"></v-toolbar-title>
            <v-spacer></v-spacer>
          </v-toolbar>
          <v-tabs vertical>
            <v-tab>
              <v-icon left>
                fa-warehouse
              </v-icon>
              Stock
            </v-tab>
            <v-tab-item>
              <v-card flat>
                <v-card-text>
                  <!-- Products Select -->
                  <v-autocomplete
                    label="Choisir un produit"
                    v-model="selectedItem.productId"
                    :items="products"
                    item-text="productCodes[0].code"
                    item-value="id"
                  ></v-autocomplete>
                  <!-- Ref -->
                  <v-text-field
                    label="Référence"
                    v-model="selectedItem.ref"
                  ></v-text-field>
                  <!-- Price -->
                  <v-text-field
                    label="Prix"
                    v-model="selectedItem.price"
                    type="number"
                  ></v-text-field>
                  <!-- QTY -->
                  <v-text-field
                    label="Quantité"
                    v-model="selectedItem.quantity"
                    type="number"
                  ></v-text-field>
                </v-card-text>
              </v-card>
            </v-tab-item>
          </v-tabs>
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
    'selectedItem.productId'() {
      // console.log("selected product changed");
      if ( this.selectedItem.id < 0 )
        this.selectedItem.price = this.products.find(p => p.id == this.selectedItem.productId)?.sell_price ?? 0
    },
    searchTerm() {
      if ( this.searchTerm.length == 0 )
        this.loadInventory();
    },
    selectedCategory() {
      this.loadInventory();
    },
    selectedBrand() {
      this.loadInventory();
    }
  },
  computed: {
    brandsFilter() {
      let brands = Object.assign([], this.brands);
      brands.unshift({ id: -1, name: "Afficher tout" })
      return brands;
    },
    categoriesFilter() {
      let categories = Object.assign([], this.categories);
      categories.unshift({ id: -1, name: "Afficher tout" })
      return categories;
    },
    showCreateOrUpdateCard() {
      return this.selectedItem.id
    },
    showCreateOrUpdateCardText() {
      return this.showCreateOrUpdateCard ? `Création d'un nouveau stock`:`Modification de: ${this.selectedItem?.ref}`;
    },
  },
  data: () => {
    return {
      searchProduct: {},
      productCodes: [],
      products: [],
      searchTerm: '',
      categories: [],
      selectedCategory: { id: -1 },
      brands: [],
      selectedBrand: { id: -1 },
      listTitle: 'List des mouvements de stocks',
      addNewButtonText: 'Nouveau stock',
      selectedItem: {
        id: 0,
        product: {},
      },
      columns: [
        { text: '#', value: 'id', align: 'start' },
        { text: 'Référence', value: 'ref' },
        { text: 'Produit', value: 'product' },
        { text: 'Quantité', value: 'restQuantity' },
        { text: 'Actions', value: 'actions', sortable: false },
      ], 
      items: [],
    }
  },
  created() {
    this.loadItems();
    /** Get URL Search Params */
    const searchParams = new URLSearchParams(window.location.search);
    let category = parseInt(searchParams.get('category'));
    let brand = parseInt(searchParams.get('brand'));
    this.selectedCategory =  category? category:-1;
    this.selectedBrand = brand ? brand:-1;
  },
  methods: {
    searchProductChanged() {
      this.loadInventory();
    },
    searchTermChanged() {
      this.loadInventory();
      // console.log("searchTermChanged");
    },
    loadInventory() {
      let searchParams = {};
      if ( this.searchTerm )
        searchParams.searchTerm = this.searchTerm;
      if ( this.searchProduct.id )
        searchParams.searchProduct = this.searchProduct.id;
      if ( this.selectedCategory )
        searchParams.searchCategory = this.selectedCategory;
      // console.log(searchParams);
      this.axios.get(`${process.env.VUE_APP_API_URL}/inventories`, { params: searchParams }).then(res => {
        this.items = res.data;
      });
    },
    loadItems() {
      this.axios.get(`${process.env.VUE_APP_API_URL}/inventories`).then(res => {
        this.items = res.data;
      });
      this.axios.get(`${process.env.VUE_APP_API_URL}/categories`).then(res => {
        this.categories = res.data;
      });
      this.axios.get(`${process.env.VUE_APP_API_URL}/productcodes`).then(res => {
        this.productCodes = res.data;
      });
      this.axios.get(`${process.env.VUE_APP_API_URL}/products`).then(res => {
        this.products = res.data;
      });
    },
    showCreateCard() {
      this.selectedItem = {  
        id: -1, 
        productCodes: [ { code: '' } ]
      };
    },
    createOrUpdate() {
      const data = {
        productId: parseInt(this.selectedItem.productId),
        ref: this.selectedItem.ref,
        price: parseFloat(this.selectedItem.price),
        quantity: parseInt(this.selectedItem.quantity),
      };
      if ( this.selectedItem.id < 0 ) {
        this.axios.post(`${process.env.VUE_APP_API_URL}/inventory`, data).then(() => {
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
        })
      } else if ( this.selectedItem.id > 0) {
        this.axios.put(`${process.env.VUE_APP_API_URL}/inventory/${this.selectedItem.id}`, data).then(() => {
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
          this.axios.delete(`${process.env.VUE_APP_API_URL}/inventory/${item.id}`).then(() => {
            this.$swal(
              'Supprimé!',
              'stock a été supprimé.',
              'success'
            );
            this.loadItems();
            // this.showCreateNewBrandCard()
            this.resetAll();
          }).catch(() => {
            this.$swal(
              'Erreur!',
              "Une erreur s'est produite lors de la suppression de stock",
              'error'
            )
          })
        } else {
          this.$swal(
            'Erreur!',
            "Une erreur s'est produite lors de la suppression de stock",
            'error'
          )
        }
      })
    },
    addCode() {
      if ( this.selectedItem.productCodes?.length < 2 )
        this.selectedItem.productCodes.push({ code: '' })
    },
    removeCode() {
      if ( this.selectedItem.productCodes?.length > 0 )
        this.selectedItem.productCodes.pop()
    }
  }
}
</script>