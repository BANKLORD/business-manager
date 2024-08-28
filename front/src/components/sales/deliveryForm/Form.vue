<template>
  <v-card style="width: 1024px">
    <v-toolbar flat color="primary" dark>
      <v-toolbar-title class="text-uppercase">{{ title }}</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn @click="resetAll" icon> <v-icon>fa-times</v-icon></v-btn>
    </v-toolbar>
    <v-card flat>
      <v-card-text>
        <!-- Inputs -->
        <v-row>
          <!-- Provider -->
          <v-col cols="6">
            <v-autocomplete
              label="Client"
              v-model="selectedItem.concernId"
              :items="clients"
              item-text="companyName"
              item-value="id"
            >
              <template slot="selection" slot-scope="data"> {{ data.item.companyName ?? data.item.name + ' ' + data.item.surname }} </template>            
              <template slot="item" slot-scope="data"> {{ data.item.companyName ?? data.item.name + ' ' + data.item.surname }} </template>            
            </v-autocomplete>
          </v-col>
          <!-- VAT -->
          <v-col cols="6">
            <v-text-field
              label="TVA"
              v-model="selectedItem.vat"
              type="number"
              append-icon="fa-percent"
            ></v-text-field>
          </v-col>
          <!-- Discount -->
          <v-col cols="6">
            <v-text-field
              label="Remise"
              v-model="discount"
              @change="discountChanged(discount)"
              type="number"
              :append-icon="'fas fa-tags'"
            ></v-text-field>
          </v-col>
          <!-- Discount % -->
          <v-col cols="6">
            <v-text-field
              label="Remise (%)"
              v-model="discountPercent"
              @change="discountPercentChanged(discountPercent)"
              type="number"
              :append-icon="'fas fa-percentage'"
            ></v-text-field>
          </v-col>
          <!-- Description % -->
          <v-col cols="7">
            <v-textarea
              label="Description"
              v-model="selectedItem.description"
            ></v-textarea>
          </v-col>
        </v-row>
        <!-- Divider -->
        <v-divider class="my-5"></v-divider>
        <!-- Products -->
        <v-row justify-sm="center">
          <v-col cols="12">
            <!-- <h2>Produits</h2>
            <v-btn class="my-3" color="primary" @click="addProductDialog = true"> Ajouter produit </v-btn> -->
            <v-row>
              <v-col class="text-left" cols="6">
                <h2 class="text-uppercase">List des articles</h2>
              </v-col>
              <v-col class="text-right" cols="6">
                <v-btn
                  tile
                  color="success"
                  @click="addProductDialog = true"
                >
                  <v-icon left>mdi-plus</v-icon>
                  Ajouter un nouvel article (Produit)
                </v-btn>
              </v-col>
            </v-row>
            <v-simple-table>
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Prix</th>
                  <th>Remise</th>
                  <th>Prix Aprés Remise</th>
                  <th>Quantité</th>
                  <th>Total</th>
                  <th class="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(product, index) in saleProducts"
                  :key="'saleProduct' + index"
                >
                  <td class="text-left">
                    <ul>
                      <li
                        v-for="pCode in products.find(p => p.id == product.productId).productCodes"
                        :key="'pcode' + pCode.id"
                        v-text="pCode.code"
                      >
                      </li>
                    </ul>
                  </td>
                  <td class="text-left"> {{ product.productPrice ?? products.find(p => p.id == product.productId)[product.type] | formatPrice }} </td>
                  <td class="text-left"> {{ (product.productPrice ?? parseFloat(products.find(p => p.id == product.productId)[product.type])) - parseFloat(product.price) | formatPrice }} </td>
                  <td class="text-left"> {{ product.price | formatPrice }} </td>
                  <td class="text-left"> {{ product.quantity | formatNumber }} </td>
                  <td class="text-left"> {{ (product.price * product.quantity) | formatPrice }} </td>
                  <!-- <td> {{ Intl.NumberFormat().format() }} MAD </td> -->
                  <td>
                    <v-btn
                      left
                      color="primary"
                      icon
                      @click="editProduct(product)"
                    >
                      <v-icon>mdi-pencil</v-icon>
                    </v-btn>
                    <v-btn
                      left
                      color="red"
                      icon
                      @click="removeProduct(product)"
                    >
                      <v-icon>mdi-delete</v-icon>
                    </v-btn>
                  </td>
                </tr>
              </tbody>
            </v-simple-table>
          </v-col>
        </v-row>
        <!-- In this table you will show the useless information  -->
        <v-divider class="my-5"></v-divider>
        <v-row justify-sm="center">
          <v-simple-table dark class="max-width-320 mx-3">
            <tbody style="width=320px">
              <tr>
                <th>Total HT</th>
                <td>{{ Intl.NumberFormat().format(priceWithoutVAT) }} MAD</td>
              </tr>
              <tr>
                <th>Total TTC</th>
                <td>{{ Intl.NumberFormat().format(priceWithVAT) }} MAD</td>
              </tr>
            </tbody>
          </v-simple-table>
        </v-row>
      </v-card-text>
    </v-card>
    <v-card-actions class="justify-center" align="center" justify="center">
      <v-btn
        @click="createOrUpdate"
        class="my-2"
        color="primary"
        :loading="loading"
        :disabled="loading"
      >
        Sauvegarder
        <v-icon right>far fa-save</v-icon>
      </v-btn>
    </v-card-actions>
  </v-card>
  </template>

<script>
export default {
  props: {
    DeliveryForm: Object
  },
  computed: {
    title() {
      return "Ajouter un nouveau bon de livraison";
    }
  }
}
</script>