<template>
  <v-dialog
      transition="dialog-bottom-transition"
      v-model="addProductDialog"
      max-width="640"
      persistent
  >
    <v-card>
      <v-toolbar class="text-center" color="primary" dark >
        <v-spacer></v-spacer>
        <h2 class="text-uppercase">{{ isAdd ? 'Ajouter un produit a vente' : 'Modifier Produit'}}</h2>
        <v-spacer></v-spacer>
      </v-toolbar>
      <v-card-text class="my-5 py-5">
        <v-row justify-sm="center">
          <!-- Product -->
          <v-col lg="6" sm="12">
            <v-autocomplete
                label="Produit"
                v-model="editedSaleProduct.productId"
                :items="products"
                item-text="productCodes[0].code"
                item-value="id"
            ></v-autocomplete>
          </v-col>
          <!-- Method -->
          <v-col v-if="isMethod" lg="6" sm="12">
            <v-select
                label="Methode de vente"
                v-model="selectedSellMethod"
                :items="sellMethods"
                item-text="name"
                item-value="value"
            ></v-select>
          </v-col>
          <!-- Buy Price -->
          <v-col lg="6" sm="12">
            <v-text-field
                v-if="products.find(p => p.id == editedSaleProduct.productId)"
                readonly
                disabled
                @change="priceChanged"
                label="Prix D'achat"
                v-model="products.find(p => p.id == editedSaleProduct.productId).buy_price"
                type="number"
            ></v-text-field>
          </v-col>
<!--          unit price-->
          <v-col lg="3" sm="6">
            <v-text-field
                v-if="$store.getters.hasPerm('sale-update-sell-price')"
                @change="priceChanged"
                label="Prix / Unité"
                v-model="editedSaleProduct.price"
                type="number"
            ></v-text-field>
            <v-text-field
                v-else
                readonly
                disabled
                @change="priceChanged"
                label="Prix / Unité"
                v-model="editedSaleProduct.price"
                type="number"
            ></v-text-field>
          </v-col>
<!--          prix TTC-->
          <v-col lg="3" sm="6">
            <slot name="ttc"></slot>
          </v-col>
          <!-- Profit Margin -->
          <v-col lg="6" sm="12">
            <slot name="margin"></slot>
          </v-col>
          <!-- Quantity -->
          <v-col lg="6" sm="12">
            <v-text-field
                label="Quantité"
                v-model="editedSaleProduct.quantity"
                :rules="validationRule"
                type="number"
            ></v-text-field>
          </v-col>
        </v-row>
      </v-card-text>
      <v-card-actions class="justify-end">
        <v-btn
            color="error"
            tile
            @click="closeAddProductDialog"
        >
          Fermer
        </v-btn>
        <v-spacer></v-spacer>
        <v-btn
            color="primary"
            tile
            @click="addProduct()"
        >
          {{ `${(editedSaleProductIndex >= 0) ? 'Modifier':'Ajouter'}` }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  props: {
    editedSaleProduct: Object,
    addProductDialog: Boolean,
    isAdd: Boolean,
    products: Array,
    isMethod: Boolean,
    sellMethods: Array,
    selectedSellMethod: String,
    priceChanged: Function,
    closeAddProductDialog: Function,
    addProduct: Function,
    editedSaleProductIndex: Number
  },
  computed : {
    validationRule() {
      return [
        v => (v && v <= (this.products.find(p => p.id === this.editedSaleProduct.productId)?.quantity ?? 0)) ||
            `La quantité que vous avez entrée dépasse la quantité de stock actuelle de ${(this.products.find(p => p.id == this.editedSaleProduct.productId)?.quantity ?? 0)}`,
      ];
    },
  },
  methods: {
    isQuantityValid() {
      return this.editedSaleProduct.quantity < this.products.find(p => p.id === this.editedSaleProduct.productId)?.quantity ?? 0
    },
    quantityError() {
      return this.$swal(
          'Champs Obligatoires Error!',
          'La quantité qntrée dépasse le stock.',
          'warning'
      )
    }
  }
}
</script>

<style scoped>

</style>
