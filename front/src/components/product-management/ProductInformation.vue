<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="11">
        <v-card>
          <v-card-title>Détails du Produit</v-card-title>
          <v-divider></v-divider>
          <v-card-text>
            <v-container>
              <v-row justify="center">
                <v-col cols="12" md="6" style="border-bottom: 1px solid #0000001f">
                  <strong>Noms:</strong> 
                  <ol>
                    <li v-for="productCode in selectedProduct.productCodes" :key="'aa' + productCode.code">
                      {{ productCode.code }} 
                    </li>
                  </ol>
                </v-col>
                <v-col cols="12" md="6" style="border-left: 1px solid #0000001f; border-bottom: 1px solid #0000001f">
                  <strong>Status de Stock:</strong>
                  <ul>
                    <li> <b>Entrée:</b> {{ selectedProduct.inventory + selectedProduct.refundOperations | formatPriceWithoutCurrency }} {{ selectedProduct.unity }} </li>
                    <li> <b>Sortie:</b> {{ selectedProduct.inventoryOperations | formatPriceWithoutCurrency }} {{ selectedProduct.unity }} </li>
                    <li> <b>Reste:</b> {{ selectedProduct.restInventory | formatPriceWithoutCurrency }} {{ selectedProduct.unity }} </li>
                  </ul>
                </v-col>
                <v-col cols="6" md="6" style="border-bottom: 1px solid #0000001f">
                  <strong>Prix HT (Détail):</strong> {{ selectedProduct.retail_price | formatPrice }}<br>
                  <strong>Prix HT (Gros):</strong> {{ selectedProduct.wholesale_price | formatPrice }}<br>
                </v-col>
                <v-col cols="6" md="6" style="border-left: 1px solid #0000001f; border-bottom: 1px solid #0000001f">
                  <strong>Prix TTC:</strong> {{ selectedProduct.retail_price * (1 + vat / 100) | formatPrice }}<br>
                  <strong>Prix TTC:</strong> {{ selectedProduct.wholesale_price * (1 + vat / 100) | formatPrice }}<br>
                </v-col>
                <v-col cols="6" md="6">
                  <strong>Prix d'achat:</strong> {{ selectedProduct.buy_price | formatPrice }} <br>
                  <strong>Prix du dernier achat:</strong> {{ selectedProduct.lastPurchasePrice | formatPrice }} <br>
                  <strong>Prix moyen d'achat:</strong> {{ selectedProduct.averagePrice | formatPrice }} <br>
                </v-col>
                <v-col cols="6" md="6" style="border-left: 1px solid #0000001f">
                  <strong>Prix TTC:</strong> {{ selectedProduct.buy_price * (1 + vat / 100) | formatPrice }} <br>
                  <strong>Prix TTC:</strong> {{ selectedProduct.lastPurchasePrice * (1 + vat / 100) | formatPrice }} <br>
                  <strong>Prix TTC:</strong> {{ selectedProduct.averagePrice * (1 + vat / 100) | formatPrice }} <br>
                </v-col>
              </v-row>
              <v-divider class="my-5"></v-divider>
              <v-row v-if="!!selectedProduct.description">
                <v-col cols="11">
                  <h3>Description:</h3>
                  <br>
                  <p class="text-justify">
                    {{ selectedProduct.description }}
                  </p>
                </v-col>
              </v-row>
              <v-divider class="my-4"></v-divider>
              <p class="text-center mb-3 red--text">
                Dans cette section, vous pouvez expérimenter avec des nombres pour obtenir un prix estimé.
                Veuillez noter que toute modification apportée ici n'affectera pas les prix réels stockés dans la base de données.
              </p>
              <v-row justify="center">
                <v-col cols="4">
                  <v-text-field
                    v-model="selectedProduct.wholesale_price"
                    label="Prix (Gros)"
                  ></v-text-field>
                </v-col>
                <v-col cols="4">
                  <v-text-field
                    v-model="selectedProduct.retail_price"
                    label="Prix (Détail)"
                  ></v-text-field>
                </v-col>
                <v-col cols="4">
                  <v-text-field
                    v-model="vat"
                    label="TVA"
                  ></v-text-field>
                </v-col>
              </v-row>
              <v-row justify="center">
                <v-col cols="4">
                  <v-text-field
                    type="number"
                    v-model="quantityRequested"
                    label="Quantité Demandée"
                  ></v-text-field>
                </v-col>
                <v-col cols="4">
                  <v-text-field
                    type="number"
                    v-model="discount"
                    label="Remise (MAD)"
                  ></v-text-field>
                </v-col>
                <v-col cols="4">
                  <v-text-field
                    type="number"
                    v-model="discountPercent"
                    label="Remise (%)"
                  ></v-text-field>
                </v-col>
                <v-col cols="6">
                  <v-text-field
                    v-bind:value="retailPrice | formatPrice"
                    label="Total Prix (Détail)"
                    readonly
                  ></v-text-field>
                </v-col>
                <v-col cols="6">
                  <v-text-field
                    v-bind:value="wholeSalePrice | formatPrice"
                    label="Total Prix (Gros)"
                    readonly
                  ></v-text-field>
                </v-col>
                <!-- <v-col cols="6">
                  <v-text-field
                    v-bind:value="retailProfitMargin | formatPriceWithoutCurrency"
                    label="Marge Bénéficiaire (Détail)"
                    readonly
                  ></v-text-field>
                </v-col>
                <v-col cols="6">
                  <v-text-field
                    v-bind:value="wholeSaleProfitMargin | formatPriceWithoutCurrency"
                    label="Marge Bénéficiaire (Gros)"
                    readonly
                  ></v-text-field>
                </v-col> -->
              </v-row>
            </v-container>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  computed: {
    retailPrice() {
      return parseFloat(this.quantityRequested) * (this.selectedProduct.retail_price - this.discount) * (1 + this.vat / 100)
    },
    wholeSalePrice() {
      return parseFloat(this.quantityRequested) * (this.selectedProduct.wholesale_price - this.discount) * (1 + this.vat / 100)
    },
    retailProfitMargin() {
      return ((this.selectedProduct.retail_price - this.discount) - this.selectedProduct.price) / 100 ;
    },
    wholeSaleProfitMargin() {
      return ((this.wholeSalePrice - this.discount) - this.selectedProduct.price) / (this.wholeSalePrice - this.discount) * 100;
    },
  },
  data: () => {
    return {
      discountPercent: 0,
      discount: 0,
      quantityRequested: 0,
      vat: 20,
      selectedProduct: {},
    }
  },
  props: {
    product: Object,
  },
  created() {
    this.selectedProduct = Object.assign({}, this.product);
  }
}
</script>