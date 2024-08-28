<template>
  <v-container fill-height fluid max-width="1024px">
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
    </v-container>
</template>

<script>
import CreateBrand from '../product-management/CreateBrand.vue';
import CreateCategory from '../product-management/CreateCategory';
export default {
  components: { CreateCategory, CreateBrand },
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
      brands: [],
      selectedCategory: { id: -1 },
      selectedBrand: { id: -1 },
      selectedItem: {
        id: -1, 
        buy_price: 0.00,
        wholesale_price: 0.00,
        retail_price: 0.00,
        productCodes: [ { code: '' } ],
      }
    }
  },
  created() {
    this.loadItems();
  },
  methods: {
    codeChanged(code, index) {  
      if (this.codeChangedTimer) {
        clearTimeout(this.codeChangedTimer);
        this.codeChangedTimer = null;
      }
      this.codeChangedTimer = setTimeout(async () => {
        this.codeChangedTimer = null
        if (code.trim()) {
          let res = await this.axios.get(`${process.env.VUE_APP_API_URL}/products?code=${code}`);
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
      this.axios.get(`${process.env.VUE_APP_API_URL}/categories`).then(res => {
        this.categories = res.data;
      });
      this.axios.get(`${process.env.VUE_APP_API_URL}/brands`).then(res => {
        this.brands = res.data;
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
        this.$swal(
          'Succès!',
          'Les modifications ont été effectuées avec succès.',
          'success'
        );
        this.$emit('created', true);
      }).catch(() => {
        this.saveButtonLoading = false;
        this.$swal(
          'Champs obligatoires manquants!',
          'Assurez-vous de remplir toutes les entrées obligatoires avant de soumettre votre demande.',
          'warning'
        );
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