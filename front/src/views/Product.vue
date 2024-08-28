<template>
  <v-container fill-height fluid max-width="1024px">

    <!-- Modify or Create new one -->
    <v-expand-transition>
      <v-row id="showCreateCard" v-show="showCreateOrUpdateCard" class="text-center my-10" align="center" justify="center" max-width="1024px">
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
          <v-tabs v-model="tabIndex" fixed-tabs>
            <v-tab>
              <v-icon left>
                mdi-copyright
              </v-icon>
              Produit
            </v-tab>
            <v-tab>
              <v-icon left>
                fa-table-cells-large
              </v-icon>
              Famille
            </v-tab>
            <v-tab>
              <v-icon left>
                fa-trademark
              </v-icon>
              Marque
            </v-tab>
            <v-tab-item>
              <v-card flat>
                <v-card-text>
                  <!-- Codes -->
                  <v-row v-for="(code, index) in selectedItem.productCodes" :key="'product_code' + index">
                    <v-col cols="10">
                      <v-text-field
                        v-model="code.code"
                        label="Spécifiez les codes de produit"
                        :color="codesVerification[index].color"
                        :append-icon="codesVerification[index].icon"
                        @keyup="codeChanged(code.code, index)"
                        :loading="!(codeChangedTimer == null)"
                      ></v-text-field>
                    </v-col>
                    <v-col class="justify-center" align="center" justify="center">
                      <v-btn
                        style="bottom: 0"
                        v-if="index == 0"
                        @click="addCode"
                        icon
                      >
                        <v-icon> mdi-plus </v-icon>
                      </v-btn>
                      <v-btn
                        style="bottom: 0"
                        v-else
                        @click="removeCode"
                        icon
                      >
                        <v-icon> mdi-delete </v-icon>
                      </v-btn>
                    </v-col>
                  </v-row>
                  <!-- Categories Select -->
                  <v-autocomplete
                    label="Choisir une famille"
                    v-model="selectedItem.categoryId"
                    :items="categories"
                    item-text="name"
                    item-value="id"
                  ></v-autocomplete>
                  <!-- Brands Select -->
                  <v-select
                    label="Choisir une marque"
                    v-model="selectedItem.brandId"
                    :items="brands"
                    item-text="name"
                    item-value="id"
                  ></v-select>
                  <!-- Buy price -->
                  <v-text-field
                    label="Prix d'achat"
                    v-model="selectedItem.buy_price"
                    @change="buyPriceChanged"
                    type="number"
                  ></v-text-field>
                  <v-row>
                    <v-col cols="6">
                      <!-- Retail Price -->
                      <v-text-field
                        label="Prix en détail"
                        v-model="selectedItem.retail_price"
                        @change="retailPriceChanged"
                        type="number"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="6">
                      <v-text-field
                        label="Marge bénéficiaire"
                        v-model="retail_margin"
                        @change="retailMarginChanged"
                        append-icon="fas fa-percent"
                        type="number"
                      ></v-text-field>
                    </v-col>
                  </v-row>
                  <!-- Wholesale Price -->
                  <v-row>
                    <v-col cols="6">
                      <v-text-field
                        label="Prix de gros"
                        v-model="selectedItem.wholesale_price"
                        @change="wholesalePriceChanged"
                        type="number"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="6">
                      <v-text-field
                        label="Marge bénéficiaire"
                        v-model="wholesale_margin"
                        @change="wholesaleMarginChanged"
                        append-icon="fas fa-percent"
                        type="number"
                      ></v-text-field>
                    </v-col>
                  </v-row>
                  <!-- Unity -->
                  <v-autocomplete
                    label="Unité (Kg, M, L...)"
                    v-model="selectedItem.unity"
                    :items="['Unité', 'Kg', 'M', 'L']"
                  ></v-autocomplete>
                  <!-- <v-text-field
                    label="Unité (Kg, M, Cm, L ...)"
                    v-model="selectedItem.unity"
                  ></v-text-field> -->
                  <!-- Description -->
                  <v-text-field
                    label="Alert de stock"
                    v-model="selectedItem.stockAlert"
                    append-icon="fas fa-warning"
                    type="number"
                    hint="Chaque fois que le produit tombe à ou moins de cette valeur, vous recevrez une notification sur votre tableau de bord indiquant que le produit est en rupture de stock"
                  ></v-text-field>
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
            </v-tab-item>
            <v-tab-item>
              <v-card flat>
                <CreateCategory v-on:created='categoryCreated()'></CreateCategory>
              </v-card>
            </v-tab-item>
            <v-tab-item>
              <v-card flat>
                <CreateBrand v-on:created="brandCreated()"></CreateBrand>
              </v-card>
            </v-tab-item>
          </v-tabs>
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
          <template v-slot:[`item.productCodes`]="{ item }">
            <ul>
              <li v-for="code in item.productCodes" :key="`lipcode_${code.id}`" v-text="code.code"></li>
            </ul>
          </template>
          <template v-slot:[`item.buy_price`]="{ item }">
            {{ item.buy_price | formatPrice }}
          </template>
          <template v-slot:[`item.sell_price`]="{ item }">
            {{ item.wholesale_price | formatPriceWithoutCurrency }} / {{ item.retail_price | formatPrice }}
          </template>
          <template v-slot:[`item.sell_price_vat`]="{ item }">
            {{ (item.wholesale_price ) | formatPriceWithoutCurrency }} /
            {{ (item.retail_price * 1.2) | formatPrice }}
          </template>
          <template
            v-if="$store.getters.hasPerm('product-update') || $store.getters.hasPerm('product-delete')"
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
                <!-- Show product information -->
                <v-list-item
                  class="d-block" link
                  v-if="$store.getters.hasPerm('product-read')"
                  @click="showProductInformation(item)"
                >
                  <v-list-item-title>
                    <v-btn
                      text
                      color="primary"
                      :loading="loading"
                      :disabled="loading"
                    >
                      <v-icon left> mdi-eye </v-icon> Afficher les informations
                    </v-btn>
                  </v-list-item-title>
                </v-list-item>
                <!-- Modify -->
                <v-list-item
                  class="d-block" link
                  v-if="$store.getters.hasPerm('product-update')"
                  @click="showEditCard(item)"
                >
                  <v-list-item-title>
                    <v-btn
                      text
                      color="primary"
                      :loading="loading"
                      :disabled="loading"
                    >
                      <v-icon left> mdi-pencil </v-icon> Modifier
                    </v-btn>
                  </v-list-item-title>
                </v-list-item>
                <!-- Delete -->
                <v-list-item
                  class="d-block" link
                  v-if="$store.getters.hasPerm('product-delete')"
                  @click="showDeleteConfirm(item)"
                >
                  <v-list-item-title>
                    <v-btn
                      text
                      color="red"
                      :loading="loading"
                      :disabled="loading"
                    >
                      <v-icon left> mdi-delete </v-icon> Supprimer
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
      v-model="showProductInformationDialog"
    >
      <v-card tile>
        <v-toolbar dark color="primary" >
          <!-- Close Dialog Button -->
          <v-spacer></v-spacer>
          <v-btn icon dark @click="showProductInformationDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar>
        <v-container>
          <v-row justify="center">
            <v-col cols="12" md="10" lg="8">
              <ProductInformation
                v-if="showProductInformationDialog"
                v-bind:product="productInformation"
              ></ProductInformation>
            </v-col>
          </v-row>
        </v-container>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import CreateBrand from '../components/product-management/CreateBrand.vue';
import CreateCategory from '../components/product-management/CreateCategory';
import ProductInformation from '@/components/product-management/ProductInformation';
export default {
  components: { CreateCategory, CreateBrand, ProductInformation },
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
      return (this.showCreateOrUpdateCard < 0)  ? `Création d'un nouveau produit`:`Modification de: ${this.selectedItem?.productCodes ? this.selectedItem?.productCodes[0].code:''}`;
    },
  },
  data: () => {
    return {
      tabIndex: 0,
      codeChangedTimer: null,
      codesVerification: [
        { color: 'primary', icon: '' },
        { color: 'primary', icon: '' },
      ],
      saveButtonLoading: false,
      wholesale_margin: 0.00,
      retail_margin: 0.00,
      searchTerm: '',
      categories: [],
      selectedCategory: { id: -1 },
      brands: [],
      selectedBrand: { id: -1 },
      listTitle: 'List des produits',
      addNewButtonText: 'Nouveau produit',
      selectedItem: {
        id: 0
      },
      columns: [
        { text: '#', value: 'id', align: 'start' },
        { text: 'Codes', value: 'productCodes' },
        { text: 'Prix D\'achat', value: 'buy_price' },
        { text: 'Prix Gros/Details', value: 'sell_price' },
        { text: 'Prix TTC Gros/Details', value: 'sell_price_vat' },
        { text: 'Famille', value: 'category.name' },
        { text: 'Marque', value: 'brand.name' },
        // { text: 'Description', value: 'description' },
        { text: 'Actions', value: 'actions', sortable: false },
      ],
      items: [],
      loading: false,
      showProductInformationDialog: false,
      productInformation: {},
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
    async showProductInformation(product) {
      this.loading = true;
      const results = await this.axios.get(`${process.env.VUE_APP_API_URL}/product/${product.id}`);
      if ( results.data.id > 0 ) {
        this.productInformation = results.data;
        this.showProductInformationDialog = true;
      }
      this.loading = false;
    },
    codeChanged(code, index) {
      if (this.codeChangedTimer) {
        clearTimeout(this.codeChangedTimer);
        this.codeChangedTimer = null;
      }
      this.codeChangedTimer = setTimeout(async () => {
        this.codeChangedTimer = null
        if (code.trim()) {
          let res = await this.axios.get(`${process.env.VUE_APP_API_URL}/products?code=${code}`);
          console.log(res.data)
          if ( res.data && res.data.length > 0 ) {
            // this.codesVerification[index]
            Object.assign(this.codesVerification[index], { color: 'error', icon: 'fa-times' })
          } else {
            Object.assign(this.codesVerification[index], { color: 'success', icon: 'fa-check' })
          }
        }
      }, 300);
    },
    buyPriceChanged(val) {
      let buyPrice = val;
      let retailPrice = this.selectedItem.retail_price;
      let retail_margin = parseFloat(parseFloat(retailPrice / buyPrice) - 1 ).toFixed(2) * 100
      this.retail_margin = retail_margin;
      let wholesalePrice = this.selectedItem.wholesale_price;
      let wholesale_margin = parseFloat(parseFloat(wholesalePrice / buyPrice) - 1 ).toFixed(2) * 100
      this.wholesale_margin = wholesale_margin.toFixed(2);
    },
    retailPriceChanged(val) {
      let sellPrice = val;
      let buyPrice = this.selectedItem.buy_price;
      let profitMargin = parseFloat(parseFloat(sellPrice / buyPrice) - 1 ).toFixed(2) * 100
      this.retail_margin = profitMargin.toFixed(2);
    },
    wholesalePriceChanged(val) {
      let sellPrice = val;
      let buyPrice = this.selectedItem.buy_price;
      let profitMargin = parseFloat(parseFloat(sellPrice / buyPrice) - 1 ).toFixed(2) * 100
      this.wholesale_margin = profitMargin.toFixed(2);
    },
    wholesaleMarginChanged(val) {
      let profitMargin = val;
      let buyPrice = this.selectedItem.buy_price;
      let sellPrice = parseFloat(parseFloat(profitMargin / 100) + 1 ).toFixed(2) * buyPrice
      this.selectedItem.wholesale_price = sellPrice.toFixed(2);
    },
    retailMarginChanged(val) {
      let profitMargin = val;
      let buyPrice = this.selectedItem.buy_price;
      let sellPrice = parseFloat(parseFloat(profitMargin / 100) + 1 ).toFixed(2) * buyPrice
      this.selectedItem.retail_price = sellPrice.toFixed(2);
    },
    searchTermChanged() {
      this.loadProducts();
      // console.log("searchTermChanged");
    },
    loadProducts() {
      let searchParams = {};
      if ( this.selectedCategory > 0 )
        searchParams.categoryId = this.selectedCategory
      if ( this.selectedBrand > 0 )
        searchParams.brandId = this.selectedBrand
      if ( this.searchTerm )
        searchParams.searchTerm = this.searchTerm
      /**  */
      this.axios.get(`${process.env.VUE_APP_API_URL}/products`, { params: searchParams }).then(res => {
        this.items = res.data;
        // for (const product of this.items) {
        //   product.productCodes.sort(function(a, b){return a.id - b.id});
        // }
      });
    },
    brandCreated() {
      this.axios.get(`${process.env.VUE_APP_API_URL}/brands`).then(res => {
        this.brands = res.data;
      });
      this.tabIndex = 0;
    },
    categoryCreated() {
      this.axios.get(`${process.env.VUE_APP_API_URL}/categories`).then(res => {
        this.categories = res.data;
      });
      this.tabIndex = 0;
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
    showCreateCard() {
      this.selectedItem = {
        id: -1,
        buy_price: 0.00,
        wholesale_price: 0.00,
        retail_price: 0.00,
        productCodes: [ { code: '' } ],
      };
      document.querySelector('#showCreateCard').scrollIntoView({
        behavior: 'smooth'
      });
    },
    createOrUpdate() {
      this.saveButtonLoading = true;
      /** data to send through the request */
      let data = {}
      const codes = this.selectedItem.productCodes;
      const { id, buy_price, wholesale_price, retail_price, categoryId, unity, brandId, description, stockAlert } = this.selectedItem;
      // console.log(codes[0]);
      if ( !codes.length || !codes[0].code )
        return this.$swal(
            'Champs obligatoires manquants!',
            "Assurez-vous d'avoir rempli au moins un code.",
            'warning'
          )
      if ( !id || !categoryId )
        return this.$swal(
            'Champs obligatoires manquants!',
            'Assurez-vous de remplir toutes les entrées obligatoires avant de soumettre votre demande.',
            'warning'
          )
      /** Product */
      data.categoryId = categoryId;
      data.codes = codes;
      if ( this.selectedItem.buy_price )
        data.buy_price = buy_price;
      if ( this.selectedItem.retail_price )
        data.retail_price = retail_price;
      if ( this.selectedItem.wholesale_price )
        data.wholesale_price = wholesale_price;
      if ( unity )
        data.unity = unity;
      if ( this.selectedItem.brandId )
        data.brandId = brandId;
      if ( this.selectedItem.description )
        data.description = description;
      if ( this.selectedItem.stockAlert )
        data.stockAlert = stockAlert;
      /** Method will be put or create */
      const method =
        (id < 0) ?
        'post':(id > 0) ?
        'put':null
      /** URL changes depends if your modifying or creating a new record */
      const url =
        (id < 0) ?
        `${process.env.VUE_APP_API_URL}/product`:(id > 0) ?
        `${process.env.VUE_APP_API_URL}/product/${id}`:null
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
          'Champs obligatoires manquants!',
          'Assurez-vous de remplir toutes les entrées obligatoires avant de soumettre votre demande.',
          'warning'
        )
        // console.log(err);
      })
    },
    resetAll() {
      this.selectedItem = { id: 0 }
    },
    showEditCard(item) {
      console.log(item)
      // console.log(this.items)
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
          this.axios.delete(`${process.env.VUE_APP_API_URL}/product/${item.id}`).then(() => {
            this.$swal(
              'Supprimé!',
              'produit a été supprimé.',
              'success'
            );
            this.loadItems();
            // this.showCreateNewBrandCard()
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


