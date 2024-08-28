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
          <v-col>
            <v-select 
              label="Filtrer par marque"
              :items="brandsFilter" 
              v-model="selectedBrand" 
              item-text="name" 
              item-value="id"
            ></v-select>
          </v-col>
        </v-row>
        <v-row class="mx-3 my-2" justify="center">
          <v-col>
            <v-text-field
              v-model.lazy="searchTerm"
              @change="searchTermChanged"
              label="Rechercher par code"
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
          <template v-slot:[`item.productCodes`]="{ item }">
            <ul>
              <li v-for="code in item.productCodes" :key="`lipcode_${code.id}`" v-text="code.code"></li>
            </ul>
          </template>
          <template
            v-if="$store.getters.hasPerm('sale-read')"
            v-slot:[`item.actions`]="{ item }"
          >
            <v-btn
              :loading="loading"
              :disabled="loading"
              color="primary"
              icon
              v-if="$store.getters.hasPerm('sale-read')"
              @click="showInventoryMovements(item)"
            >
              <v-icon
                small
              >
                mdi-eye
              </v-icon>
            </v-btn>
          </template>
        </v-data-table>
      </v-card>
    </v-row>
    <v-dialog v-model="showInventoryMovementsDialog">
      <v-card v-if="selectedProduct.id > 0">
        <v-toolbar
          flat
          color="primary"
          dark
        >
          <v-spacer></v-spacer>
          <v-toolbar-title class="text-center"> List des mouvements pour: {{ selectedProduct.productCodes[0].code }} </v-toolbar-title>
          <v-spacer></v-spacer>
        </v-toolbar>
        <v-card-text>
          <v-row class="py-3" justify="center">
            <v-col lg="6" md="6" cols="12">
              <h3 class="text-center">Mouvements d'achats</h3>
              <v-data-table
                dense
                :items="selectedProduct.inventories"
                :headers="[
                  { text: 'Ref', value: 'id', align: 'start' },
                  { text: 'Ref Stock', value: 'stock' },
                  { text: 'Quantité', value: 'quantity'},
                  { text: 'Date', value: 'createdAt' },
                ]"
              >
                <template v-slot:[`item.id`]="{ item }">
                  P-{{ item.purchaseProductId }}
                </template>
                <template v-slot:[`item.stock`]="{ item }">
                  <!-- <span
                    v-for="inventory in item.inventories"
                    :key="'isp_' + inventory.id"
                  >
                    {{ inventory.id }}
                  </span> -->
                  <span>{{ item.id }}</span>
                </template>
                <template v-slot:[`item.quantity`]="{ item }">
                  <span class="success--text">
                    +{{ item.quantity | formatNumber }}
                  </span>
                </template>
                <template v-slot:[`item.createdAt`]="{ item }">
                  {{ item.createdAt | formatDate }}
                </template>
              </v-data-table>
            </v-col>
            <v-col lg="6" md="6" cols="12">
              <h3 class="text-center">Mouvements de vente</h3>
              <v-data-table
                dense
                :items="selectedProduct.saleProducts"
                :headers="[
                  { text: 'Ref', value: 'id', align: 'start' },
                  { text: 'Ref Stock', value: 'stock' },
                  { text: 'Quantité', value: 'quantity'},
                  { text: 'Date', value: 'createdAt' },
                ]"
              >
              <template v-slot:[`item.id`]="{ item }">
                S-{{ item.id }}
              </template>
              <template v-slot:[`item.stock`]="{ item }">
                <ul>
                  <template
                    v-for="op in item.InventoryOperations"
                  >
                    <li
                      v-if="op.quantity > 0"
                      :key="'op_' + op.id"
                    >
                      <span> {{ op.inventory?.id ? op.inventory?.id:'N/A' }} </span> (-{{ op.quantity }})
                    </li>
                  </template>
                </ul>
              </template>
              <template v-slot:[`item.quantity`]="{ item }">
                <span class="primary--text">
                  -{{ item.quantity | formatNumber }}
                </span>
              </template>
              <template v-slot:[`item.createdAt`]="{ item }">
                {{ item.createdAt | formatDate }}
              </template>
              </v-data-table>
            </v-col>
          </v-row>
          <v-divider></v-divider>
          <v-row justify="center">
            <v-col cols="6">
              <h2 class="text-center text-uppercase">
                Entrée totale: {{ parseFloat(selectedProduct.quantityPurchased) | formatNumber }}
              </h2>
              <h2 class="text-center text-uppercase error--text">
                Investissements totaux: {{ parseFloat(selectedProduct.totalPaid) | formatPrice }}
              </h2>
            </v-col>
            <v-col cols="6">
              <h2 class="text-center text-uppercase">
                Sortie totale: {{ parseFloat(selectedProduct.quantitySold) | formatNumber }}
              </h2>
              <h2 class="text-center text-uppercase success--text">
                Ventes totales: {{ parseFloat(selectedProduct.totalSold) | formatPrice }}
              </h2>
            </v-col>
          </v-row>
          <v-row justify="center">
            <v-col md="6" cols="12">
              <h2 :class="{
                'text-center': true,
                'text-uppercase': true,
                'success--text': (parseFloat(selectedProduct.totalSold) - parseFloat(selectedProduct.totalPaid)) > 0,
                'warning--text': (parseFloat(selectedProduct.totalSold) - parseFloat(selectedProduct.totalPaid)) <= 0,
              }">
                Profit: {{ parseFloat(selectedProduct.totalSold) - parseFloat(selectedProduct.totalPaid) | formatPrice }}
              </h2>
            </v-col>
          </v-row>
          <v-row justify="center">
            <v-col md="6" cols="12">
              <h2 class="text-center text-uppercase">
                Reste quantité: {{ parseFloat(selectedProduct.quantityPurchased) - parseFloat(selectedProduct.quantitySold) | formatNumber }}
              </h2>
              <h2 class="text-center text-uppercase primary--text mt-3">
                Bénéfice supplémentaire estimé: <br>
                {{ (parseFloat(selectedProduct.quantityPurchased) - parseFloat(selectedProduct.quantitySold)) * parseFloat(selectedProduct.wholesale_price) | formatPrice }}
                /
                {{ (parseFloat(selectedProduct.quantityPurchased) - parseFloat(selectedProduct.quantitySold)) * parseFloat(selectedProduct.retail_price) | formatPrice }}
              </h2>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
export default {
  watch: {
    searchTerm() {
      if ( this.searchTerm.length == 0 )
        this.loadProducts();
    },
    selectedCategory() {
      this.loadProducts();
    },
    selectedBrand() {
      this.loadProducts();
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
      return this.showCreateOrUpdateCard ? `Création d'un nouveau produit`:`Modification de: ${this.selectedItem?.productCodes ? this.selectedItem?.productCodes[0].code:''}`;
    },
  },
  data: () => {
    return {
      selectedProduct: {},
      showInventoryMovementsDialog: false,
      loading: false,
      searchTerm: '',
      categories: [],
      selectedCategory: { id: -1 },
      brands: [],
      selectedBrand: { id: -1 },
      listTitle: 'List des produits',
      selectedItem: {
        id: 0
      },
      columns: [
        { text: '#', value: 'id', align: 'start' },
        { text: 'Codes', value: 'productCodes' },
        // { text: 'Prix de gros (MAD)', value: 'wholesale_price' },
        // { text: 'Prix en details (MAD)', value: 'retail_price' },
        { text: 'Famille', value: 'category.name' },
        { text: 'Marque', value: 'brand.name' },
        // { text: 'Description', value: 'description' },
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
    searchTermChanged() {
      this.loadProducts();
    },
    loadProducts() {
      let searchParams = {};
      if ( this.selectedCategory > 0 )
        searchParams.categoryId = this.selectedCategory
      if ( this.selectedBrand > 0 )
        searchParams.brandId = this.selectedBrand
      if ( this.searchTerm )
        searchParams.searchTerm = this.searchTerm
      /** */
      this.axios.get(`${process.env.VUE_APP_API_URL}/products`, { params: searchParams }).then(res => {
        this.items = res.data;
      });
    },
    loadItems() {
      this.axios.get(`${process.env.VUE_APP_API_URL}/products`).then(res => {
        this.items = res.data;
      });
      this.axios.get(`${process.env.VUE_APP_API_URL}/categories`).then(res => {
        this.categories = res.data;
      });
      this.axios.get(`${process.env.VUE_APP_API_URL}/brands`).then(res => {
        this.brands = res.data;
      });
    },
    showInventoryMovements(product) {
      this.loading = true;
      this.axios.get(`${process.env.VUE_APP_API_URL}/product/${product.id}/movements/`).then(res => {
        this.selectedProduct = res.data;
        this.showInventoryMovementsDialog = true;
        this.loading = false;
      }).catch(() => {
        this.loading = false;
      })
    }
  }
}
</script>