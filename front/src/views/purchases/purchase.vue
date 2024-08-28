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
            <v-toolbar-title>{{ showCreateOrUpdateCardText }}</v-toolbar-title>
            <v-spacer></v-spacer>
            <v-btn @click="resetAll" icon> <v-icon>fa-times</v-icon></v-btn>
          </v-toolbar>
          <v-card flat>
            <v-card-text>
              <!-- Inputs -->
              <v-row>
                <!-- Provider -->
                <v-col cols="6">
                  <v-select
                    label="Fournisseur"
                    v-model="selectedItem.concernId"
                    :items="providers"
                    item-text="companyName"
                    item-value="id"
                  ></v-select>
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
                <!-- Payment methods -->
                <v-col cols="6">
                  <v-autocomplete
                    label="Choisir une method de payment"
                    :items="paymentMethods"
                    v-model="selectedItem.paymentMethod"
                    item-text="name"
                    item-value="value"
                  ></v-autocomplete>
                </v-col>
                <!-- Shipped ? -->
                <v-col class="text-center d-none" cols="3">
                  <v-switch
                    v-model="selectedItem.shipped"
                    flat
                    :label="selectedItem.shipped ? 'Expédié':'Non expédié'"
                  ></v-switch>
                </v-col>
              </v-row>
              <!-- Products -->
              <v-row justify="center">
                <v-col cols="12">
                  <v-row>
                    <v-col class="text-left" cols="6">
                      <h2 class="text-uppercase">List des articles (Produits)</h2>
                    </v-col>
                    <v-col class="text-right" cols="6">
                      <v-btn
                        tile
                        color="success"
                        @click="addProductDialog = true"
                      >
                        <v-icon left>mdi-plus</v-icon>
                        Ajouter un article (Produit)
                      </v-btn>
                    </v-col>
                  </v-row>
                  <v-simple-table>
                    <thead>
                      <tr>
                        <th>Nom</th>
                        <th>Quantité</th>
                        <th>Prix</th>
                        <th>Total</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="(product, index) in purchaseProducts"
                        :key="'purchaseProduct' + index"
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
                        <td> {{ product.quantity }} </td>
                        <td> {{ product.price | formatPrice}} </td>
                        <td> {{ (product.price * product.quantity) | formatPrice}} </td>
                        <td>
                          <v-btn
                            class="mr-2"
                            color="primary"
                            icon
                            @click="editProduct(product)"
                          >
                            <v-icon>mdi-pencil</v-icon>
                          </v-btn>
                          <v-btn
                            class="mr-2"
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
              <v-row justify="center">
                <v-col cols="12">
                  <v-simple-table dark>
                    <tbody style="width=320px">
                      <tr>
                        <th>Total HT</th>
                        <td>{{ purchaseProductsTotalDF | formatPrice }}</td>
                      </tr>
                      <tr>
                        <th>Total TTC</th>
                        <td>{{ purchaseProductsTotalPrice | formatPrice }}</td>
                      </tr>
                    </tbody>
                  </v-simple-table>
                </v-col>
              </v-row>
              <!-- Documents -->
              <v-row justify="center">
                <v-col cols="12">
                  <h2 class="text-uppercase"> Documents: </h2>
                </v-col>
                <v-col cols="12" v-if="selectedItem.id > 0">
                  <v-simple-table dense>
                    <thead>
                      <tr>
                        <th class="text-center">#</th>
                        <th class="text-center">Nom de fichier</th>
                        <th class="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="document in selectedItem.documents"
                        :key="'editing_doc'+ document.id"
                      >
                        <td> {{document.id }} </td>
                        <td> {{document.name }} </td>
                        <td>
                          <v-btn color="red" @click="deleteDocument(document)" icon>
                            <v-icon>mdi-delete</v-icon>
                          </v-btn>
                        </td>
                      </tr>
                    </tbody>
                  </v-simple-table>
                </v-col>
                <v-col cols="12">
                  <vue-dropzone
                    id="documents"
                    ref="documents"
                    :options="dropzoneOptions"
                    v-on:vdropzone-sending="sendingEvent"
                    v-on:vdropzone-success="processComplete"
                  ></vue-dropzone>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
          <v-card-actions class="justify-center" align="center" justify="center">
            <v-btn
              @click="createOrUpdate"
              class="my-2"
              color="primary"
            >
              <v-icon left>far fa-save</v-icon>
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
          <v-toolbar-title class="text-center">{{ listTitle }}</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-switch
            class="mt-3 d-none"
            v-model="showStatistics"
            flat
            :label="showStatistics ? 'Masquer les statistiques':'Afficher les statistiques'"
          ></v-switch>
        </v-toolbar>
        <!-- Search Rows -->
        <v-row class="mx-3 my-2" justify="center">
          <v-col>
            <DatePicker
              label="Date de début" 
              :max="(new Date()).toISOString().split('T')[0]"
              v-model="selectedStartDate"
            />
          </v-col>
          <v-col>
            <DatePicker
              v-bind:min="selectedStartDate"
              :max="(new Date()).toISOString().split('T')[0]"
              label="Date de fin"
              v-model="selectedEndDate"
            />
          </v-col>
        </v-row>
        <v-row class="mx-3 my-2" justify="center">
          <v-col>
            <v-select
              prepend-icon="fa-handshake"
              label="Filtrer par des Fournisseurs"
              :items="providersFilter"
              v-model="selectedProvider"
              item-text="companyName"
              item-value="id"
            ></v-select>
          </v-col>
          <v-col>
            <v-autocomplete
              prepend-icon="mdi-inbox-multiple"
              label="Filtrer par des produits"
              :items="productsFilter"
              v-model="selectedProduct"
              item-text="productCodes[0].code"
              item-value="id"
            ></v-autocomplete>
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
                v-if="$store.getters.hasPerm('purchase-create')"
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
          <template v-slot:[`item.products`]="{ item }">
            <v-btn
              rounded
              outlined
              small
              color="primary"
              @click="showProducts(item)"
            >
              <v-icon>mdi-eye</v-icon>
            </v-btn>
          </template>
          <template v-slot:[`item.vat`]="{ item }">
            {{ item.vat }}%
          </template>
          <template v-slot:[`item.total`]="{ item }">
            {{ item.total | formatPrice }}
          </template>
          <template v-slot:[`item.totalPrice`]="{ item }">
            {{ item.totalPrice | formatPrice }}
          </template>
          <template v-slot:[`item.createdAt`]="{ item }">
            {{ item.createdAt | formatDate }}
          </template>
          <template
            v-if="$store.getters.hasPerm('purchase-update') || $store.getters.hasPerm('purchase-delete')"
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
                  <!-- Show Purchase Order and Print IT Dialog -->
                  <v-list-item v-if="item.purchaseOrders?.length > 0" class="d-block" link @click="showPurchaseOrder(item)">
                    <v-list-item-title>
                      <v-btn
                        text
                        color="success"
                        :loading="loading"
                        :disabled="loading"
                      >
                        <v-icon left>mdi-eye</v-icon> Afficher le bon de commande
                      </v-btn>
                    </v-list-item-title>
                  </v-list-item>
                  <!-- Edit Button -->
                  <v-list-item class="d-block" link @click="showEditCard(item)">
                    <v-list-item-title>
                      <v-btn
                        text
                        color="primary"
                        :loading="loading"
                        :disabled="loading"
                      >
                        <v-icon left>mdi-pencil</v-icon> Modifier
                      </v-btn>
                    </v-list-item-title>
                  </v-list-item>
                  <!-- Delete Button -->
                  <v-list-item class="d-block" link @click="showDeleteConfirm(item)">
                    <v-list-item-title>
                      <v-btn
                        text
                        color="red"
                        :loading="loading"
                        :disabled="loading"
                      >
                        <v-icon left>mdi-delete</v-icon> Supprimer
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
    <v-expand-transition>
      <v-row v-if="showStatistics" class="text-center mt-5" justify="center" max-width="1444px">
        <v-card tile elevation="5" width="720">
          <v-card-text>
            <SplineChart />
            <v-simple-table dark class="max-width-320 my-3 mx-5 mx-auto">
                <tbody style="width=320px">
                  <tr>
                    <th>Total des achats</th>
                    <td>{{ purchasesCount }}</td>
                  </tr>
                  <tr>
                    <th>Total HT</th>
                    <td>{{ purchaseTotalDF | formatPrice }}</td>
                  </tr>
                  <tr>
                    <th>Total TTC</th>
                    <td>{{ purchaseTotalPrice | formatPrice }}</td>
                  </tr>
                </tbody>
              </v-simple-table>
          </v-card-text>
        </v-card>
      </v-row>
    </v-expand-transition>
    <!-- Loading Dialog -->
    <v-dialog
      v-model="loadingDialog"
      hide-overlay
      persistent
      width="300"
    >
      <v-card
        color="primary"
        dark
      >
        <v-card-text>
          Veuillez patienter
          <v-progress-linear
            indeterminate
            color="white"
            class="mb-0"
          ></v-progress-linear>
        </v-card-text>
      </v-card>
    </v-dialog>
    <!-- Rapport de commande (Purchase Report) -->
    <v-dialog
      transition="dialog-bottom-transition"
      v-model="itemInformationDialog"
      max-width="720"
      persistent
      scrollable
    >
      <v-card v-if="itemInformation.id">
        <v-toolbar class="text-center" color="primary" dark >
          <v-spacer></v-spacer>
          <h2>Commande N°: {{ itemInformation.id }}</h2>
          <v-spacer></v-spacer>
        </v-toolbar>
        <v-divider></v-divider>
        <v-card-text class="my-5 py-5">
          <v-row justify="center" style="display: block;">
            <v-simple-table dense>
              <thead>
                <tr>
                  <th class="text-center" colspan="2">
                    <h3>Informations sur le fournisseur</h3>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th> Nom </th>
                  <td>{{ itemInformation.concern.name + ' ' + (itemInformation.surname ?? '') }}</td>
                </tr>
                <tr>
                  <th> Nom de société </th>
                  <td>{{ itemInformation.concern.companyName }}</td>
                </tr>
                <tr>
                  <th> ICE </th>
                  <td>{{ itemInformation.concern.ice }}</td>
                </tr>
                <tr>
                  <th> RC </th>
                  <td>{{ itemInformation.concern.ice }}</td>
                </tr>
                <tr>
                  <th> Adresse </th>
                  <td>{{ itemInformation.concern.address }}</td>
                </tr>
                <tr>
                  <th> Achats </th>
                  <td> <b>{{ itemInformation.concern._count.purchases }}</b> ({{ Intl.NumberFormat().format(itemInformation.concern.totalPrice) }} MAD)</td>
                </tr>
              </tbody>
            </v-simple-table>
            <v-simple-table dense class="mt-3">
              <thead>
                <tr>
                  <th class="text-center" colspan="2">
                    <h3>Informations sur la commande</h3>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th> Crée Par </th>
                  <td> {{ itemInformation.user?.username ?? 'N/A' }} </td>
                </tr>
                <tr>
                  <th> Date de creation </th>
                  <td>{{ itemInformation.createdAt | formatDate }}</td>
                </tr>
                <tr>
                  <th> Documents </th>
                  <td>
                    <a ref="download" style="display: none;"></a>
                    <v-btn
                      v-for="document in itemInformation.documents"
                      :key="'doc' + document.id"
                      @click="downloadDocument(document)"
                      target="_blank"
                      color="primary"
                      class="mr-2 mt-1"
                    >
                      {{ document.name }}
                    </v-btn>
                  </td>
                </tr>
              </tbody>
            </v-simple-table>
            <v-simple-table dense class="mt-3">
              <thead>
                <tr>
                  <th class="text-center" colspan="4">
                    <h3>Produits Achetés</h3>
                  </th>
                </tr>
                <tr>
                  <th>Desc</th>
                  <th>Prix</th>
                  <th>Quantité</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="purchaseProduct in itemInformation.purchaseProducts" :key="'purchaseProduct_'+purchaseProduct.id">
                  <td> {{ purchaseProduct.product?.productCodes[0]?.code }} </td>
                  <td> {{ purchaseProduct.price | formatPrice }} </td>
                  <td> {{ purchaseProduct.quantity | formatNumber }} </td>
                  <td> {{ purchaseProduct.price * purchaseProduct.quantity | formatPrice }} </td>
                </tr>
                <tr>
                  <th colspan="3"></th>
                  <th>Total HT</th>
                </tr>
                <tr>
                  <td colspan="3"></td>
                  <td> {{ itemInformation.totalPrice | formatPrice }} </td>
                </tr>
                <tr>
                  <th colspan="3"></th>
                  <th>Total TTC</th>
                </tr>
                <tr>
                  <td colspan="3"></td>
                  <td> {{ itemInformation.totalPrice + (itemInformation.totalPrice * itemInformation.vat) / 100 | formatPrice }} </td>
                </tr>
              </tbody>
            </v-simple-table>

          </v-row>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions class="justify-end">
          <v-btn
            tile
            color="primary"
            @click="itemInformationDialog = false"
          >Fermer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!-- Add products -->
    <v-dialog
      transition="dialog-bottom-transition"
      v-model="addProductDialog"
      max-width="640"
      persistent
    >
      <v-card>
        <v-toolbar class="text-center" color="primary" dark >
          <v-spacer></v-spacer>
          <h2>Ajouter un produit a l'achat</h2>
          <v-spacer></v-spacer>
        </v-toolbar>
        <v-card-text class="my-5 py-5">
          <v-row justify="center">
            <!-- Product -->
            <v-col lg="6" sm="11">
              <v-autocomplete
                label="Produit"
                v-model="editedPurchaseProduct.productId"
                :items="products"
                item-text="productCodes[0].code"
                item-value="id"
              ></v-autocomplete>
            </v-col>
            <v-col lg="1" sm="1">
              <v-btn
                class="mt-3"
                color="primary"
                icon
                @click="addNewProductDialog = true"
              >
                <v-icon>mdi-plus</v-icon>
              </v-btn>
            </v-col>
            <!-- Price -->
            <v-col lg="6" sm="12">
              <v-text-field
                label="Prix HT / Unité"
                v-model="editedPurchaseProduct.price"
                type="number"
              ></v-text-field>
            </v-col>
            <!-- Price with VAT -->
            <v-col lg="6" sm="12">
              <v-text-field
                label="Prix TTC / Unité"
                v-model="editedPurchaseProduct.priceWithVAT"
                type="number"
              ></v-text-field>
            </v-col>
            <!-- Quantity -->
            <v-col lg="7" sm="12">
              <v-text-field
                label="Quantité"
                v-model="editedPurchaseProduct.quantity"
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
            {{ `${(editedPurchaseProductIndex >= 0) ? 'Modifier':'Ajouter'}` }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!-- List of products -->
    <v-dialog
      transition="dialog-bottom-transition"
      v-model="productsListDialog"
      v-if="selectedPurchase.id"
      max-width="1080"
      persistent
    >
      <v-card>
        <v-toolbar
          dark
          color="primary"
        >
          <v-spacer></v-spacer>
          <h3 class="text-uppercase">
            Liste des produits pour la commande #{{ selectedPurchase.id }}
          </h3>
          <v-spacer></v-spacer>
          <v-btn
            icon
            dark
            @click="productsListDialog = false"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar>
        <v-card-text class="py-4">
          <v-simple-table dense>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Prix</th>
                <th>Quantité</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(purchaseProduct, index) in selectedPurchase.purchaseProducts"
                :key="'purchaseProductPL' + index"
              >
                <td class="text-left">
                  <ul>
                    <li
                      v-for="pCode in purchaseProduct.product?.productCodes"
                      :key="'pcode' + pCode.id"
                      v-text="pCode.code"
                    >
                    </li>
                  </ul>
                </td>
                <!-- Price after discount -->
                <td class="text-left"> {{ purchaseProduct.price | formatPrice }} </td>
                <td class="text-left"> {{ purchaseProduct.quantity | formatNumber }} {{purchaseProduct.product.unity}} </td>
                <td class="text-left"> {{ (purchaseProduct.price * purchaseProduct.quantity) | formatPrice }} </td>
              </tr>
            </tbody>
          </v-simple-table>
        </v-card-text>
      </v-card>
    </v-dialog>
    <!-- Purchase Order Dialog  -->
    <v-dialog
      fullscreen
      transition="dialog-bottom-transition"
      v-model="purchaseOrderDialog"
    >
      <v-card>
        <purchase-order
          v-if="purchaseOrderDialog"
          :purchase="selectedPurchaseOrder"
          :clientInformation="clientInformation"
          :sellerInformation="sellerInformation"
          v-on:closed="purchaseOrderDialog = false"
        ></Purchase-order>
      </v-card>
    </v-dialog>
    <!-- Add new product -->
    <v-dialog
      persistent
      v-model="addNewProductDialog"
      fullscreen
    >
      <v-card flat tile class="overflow-x-hidden overflow-y-hidden">
        <v-toolbar
          flat
          color="primary"
          dark
        >
          <v-spacer></v-spacer>
          <v-toolbar-title> Créer un nouveau produit </v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon @click="addNewProductDialog = false">
            <v-icon>fa-times</v-icon>
          </v-btn>
        </v-toolbar>
        <v-row class="text-center justify-center py-10">
          <v-card style="width: 600px">
            <CreateProduct v-on:created="productCreated()"></CreateProduct>
          </v-card>
        </v-row>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import CreateProduct from "../../components/product-management/CreateProduct.vue";
import SplineChart from "../../components/charts/Spline.vue";
import DatePicker from "../../components/DatePicker.vue";
import vue2Dropzone from 'vue2-dropzone'
import 'vue2-dropzone/dist/vue2Dropzone.min.css'
import store from '../../store';

import PurchaseOrder from '../../components/purchases/PurchaseOrder.vue';
export default {
  components: {
    CreateProduct,
    vueDropzone: vue2Dropzone,
    DatePicker: DatePicker,
    SplineChart,
    PurchaseOrder
  },
  watch: {
    editedPurchaseProduct: { deep: true },
    'editedPurchaseProduct.price'(newPrice, oldPrice) {
      const priceWithVAT = this.editedPurchaseProduct?.priceWithVAT ?? 0;
      if ( newPrice == oldPrice || newPrice == parseFloat((priceWithVAT / 1.2).toFixed(2)) ) return;
      this.editedPurchaseProduct.priceWithVAT = (this.editedPurchaseProduct.price * 1.2).toFixed(2);
    },
    'editedPurchaseProduct.priceWithVAT'(newPrice, oldPrice) {
      const priceWithoutVAT = this.editedPurchaseProduct.price ?? 0;
      if ( newPrice == oldPrice || newPrice == parseFloat((priceWithoutVAT * 1.2).toFixed(2)) ) return;
      this.editedPurchaseProduct.price = (this.editedPurchaseProduct.priceWithVAT / 1.2).toFixed(2);
    },
    productsListDialog() {
      if ( !this.productsListDialog )
        this.selectedPurchase = Object.assign({}, {});
    },
    selectedStartDate() {
      this.loadPurchases();
    },
    selectedEndDate() {
      this.loadPurchases();
    },
    addProductDialog() {
      if ( !this.addProductDialog )
        this.editedPurchaseProduct = Object.assign({}, this.defaultEditedPurchaseProduct)
    },
    'editedPurchaseProduct.productId'() {
      const price = this.products.find(p => p.id == this.editedPurchaseProduct.productId)?.buy_price
      this.editedPurchaseProduct.price = parseFloat(price);
    },
    'selectedItem.shipped'() {
      if ( this.selectedItem.shipped === true || this.selectedItem.shipped === false )
      this.selectedItem.shipped = this.selectedItem.shipped ? 1:0
    },
    selectedProvider() {
      this.loadPurchases();
    },
    selectedProduct() {
      this.loadPurchases();
    },
  },
  computed: {
    purchaseProductsTotalDF() {
      let total = 0;
      for (const purchaseProduct of this.purchaseProducts) {
        total += parseFloat(parseFloat(purchaseProduct.price) * parseFloat(purchaseProduct.quantity));
      }
      return total ?? 0;
    },
    purchaseProductsTotalPrice() {
      let taxe = parseFloat(this.purchaseProductsTotalDF) * parseFloat((this.selectedItem?.vat ?? 0) / 100)
      let total = parseFloat(this.purchaseProductsTotalDF) + parseFloat(taxe);
      return total ?? 0;
    },
    purchasesCount() {
      return this.items.length;
    },
    purchaseTotalDF() {
      let total = 0;
      for (const purchase of this.items) {
        total += parseFloat(purchase.total)
      }
      return total;
    },
    purchaseTotalPrice() {
      let total = 0
      for (const purchase of this.items) {
        total += purchase.totalPrice
      }
      return total;
    },
    productsFilter() {
      let products = Object.assign([], this.products);
      products.unshift({ id: -1, productCodes: [ { code: "Afficher tout" } ] })
      return products;
    },
    providersFilter() {
      let providers = Object.assign([], this.providers);
      providers.unshift({ id: -1, companyName: "Afficher tout" })
      return providers;
    },
    priceWithoutVAT() {
      return (this.selectedItem?.price * this.selectedItem?.quantity)
    },
    priceWithVAT() {
      return (this.priceWithoutVAT) + (this.priceWithoutVAT * (this.selectedItem?.vat / 100))
    },
    showCreateOrUpdateCard() {
      return this.selectedItem.id
    },
    showCreateOrUpdateCardText() {
      return (this.showCreateOrUpdateCard < 0) ? `Création d'une nouvelle commande `:`Modification de la commande N°: ${this.selectedItem?.id}`;
    },
  },
  data: () => {
    return {
      addNewProductDialog: false,
      selectedPurchaseOrder: {},
      clientInformation: {},
      sellerInformation: {},
      purchaseOrderDialog: false,
      loading: false,
      selectedPurchase: {},
      productsListDialog: false,
      loadingDialog: false,
      selectedStartDate: null,
      selectedEndDate: null,
      paymentMethods: [
        { name: 'Espece', value: 'cash' },
        { name: 'Chèque', value: 'check' },
        { name: 'Virement', value: 'bank' },
        { name: 'Effet', value: 'bill' },
      ],
      purchaseProducts: [],
      editedPurchaseProduct: {
        price: 0,
        priceWithVAT: 0,
      },
      defaultEditedPurchaseProduct: {
        price: 0,
        priceWithVAT: 0,
      },
      editedPurchaseProductIndex: -1,
      addProductDialog: false,
      showStatistics: false,
      dropzoneOptions: {
        parallelUploads: 10,
        dictDefaultMessage: "Déposez les fichiers ici ou <br> cliquez ici...",
        addRemoveLinks: true,
        autoProcessQueue: false,
        uploadMultiple: true,
        headers: { 'auth': store.state.authToken },
        /** Changeable */
        url: `${process.env.VUE_APP_API_URL}/purchase`,
        method: 'PUT',
        thumbnailWidth: 150,
      },
      products: [],
      selectedProduct: -1,
      providers: [],
      selectedProvider: -1,
      listTitle: 'Management des achats',
      addNewButtonText: 'Nouvel achat',
      searchTerm: '',
      selectedType: -1,
      selectedItem: {
        id: 0,
        products: []
      },
      columns: [
        { text: '#', value: 'id', align: 'start' },
        { text: 'Fournisseur', value: 'concern.companyName' },
        { text: 'Produits', value: 'products', align: 'center' },
        { text: 'Total HT (MAD)', value: 'total' },
        { text: 'TVA', value: 'vat' },
        { text: 'Total TTC (MAD)', value: 'totalPrice' },
        { text: 'Date', value: 'createdAt', type: 'date' },
        { text: 'Actions', value: 'actions', sortable: false },
      ],
      items: [],
      itemInformation: {
        id: 0,
      },
      itemInformationDialog: false,
    }
  },
  created() {
    this.$store.commit('setOverlay', true);
  },
  mounted() {
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() - 7);
    this.selectedStartDate = currentDate.toISOString().split('T')[0];
    this.loadItems();
  },
  methods: {
    productCreated() {
      this.axios.get(`${process.env.VUE_APP_API_URL}/products`).then(res => {
        this.products = res.data;
      });
      this.addNewProductDialog = false;
    },
    showPurchaseOrder(purchase) {
      this.loadingDialog = true;
      this.axios({
        url: `${process.env.VUE_APP_API_URL}/purchase/purchaseOrder/${purchase.id}`,
        method: 'GET',
      }).then((res) => {
        // this.deliveryForm = res.data;
        this.sellerInformation = {
          name: this.$store.getters.getCompany.name,
          address: this.$store.getters.getCompany.address,
          zip: this.$store.getters.getCompany.zip,
          city: this.$store.getters.getCompany.city,
          country: "Maroc"
        }
        const client = res.data.concern;
        this.clientInformation = {
          name: client.companyName,
          address: client.address,
          zip: client.zip,
          city: client.city,
          ice: client.ice,
          country: "Maroc"
        }
        this.selectedPurchaseOrder = res.data;
        this.purchaseOrderDialog = true;
        this.loadingDialog = false;
      }).catch((err) => { console.log(err); this.loadingDialog = false; })
    },
    async showProducts(purchase) {
      this.loadingDialog = true;
      const results = await this.axios.get(`${process.env.VUE_APP_API_URL}/purchase/${purchase.id}`);
      this.selectedPurchase = results.data;
      this.loadingDialog = false;
      this.productsListDialog = true;
    },
    editProduct(product) {
      this.editedPurchaseProductIndex = this.purchaseProducts.indexOf(product);
      this.editedPurchaseProduct = product;
      this.addProductDialog = true
    },
    removeProduct(product) {
      const indexOfProduct = this.purchaseProducts.indexOf(product)
      this.purchaseProducts.splice(indexOfProduct, 1)
    },
    closeAddProductDialog() {
      this.editedPurchaseProduct = Object.assign({}, this.defaultEditedPurchaseProduct)
      this.editedPurchaseProductIndex = -1;
      this.addProductDialog = false
    },
    addProduct() {
      if (!this.editedPurchaseProduct.productId) {
        return this.$swal(
          'Champs Obligatoires Manquants!',
          'Veuillez sélectionner un produit.',
          'warning'
        )
      }
      if (!this.editedPurchaseProduct.quantity || this.editedPurchaseProduct.quantity < 1) {
        return this.$swal(
          'Champs Obligatoires Manquants!',
          'La quantité est manquante ou a une entrée négative.',
          'warning'
        )
      }
      if( !this.purchaseProducts?.length )
        this.purchaseProducts = [];
      /** Push Purchased Product to the selectedItem */
      if ( this.editedPurchaseProductIndex < 0 )
        this.purchaseProducts.push(this.editedPurchaseProduct);
      else
        this.purchaseProducts[this.editedPurchaseProductIndex] = this.editedPurchaseProduct;
      /** Close dialog */
      this.closeAddProductDialog()
    },
    deleteDocument(document) {
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
          this.axios.delete(`${process.env.VUE_APP_API_URL}/document/${document.id}`).then(() => {
            this.$swal(
              'Supprimé!',
              'document a été supprimé.',
              'success'
            );
            this.reloadSelectedItem();
            this.loadPurchases();
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
    async downloadDocument(document) {
      const res = await this.axios.get(`${process.env.VUE_APP_API_URL}/document/${document.id}`, { responseType: 'blob' }).then(res => {
        return res
      }).catch(err => {
        console.log(err);
      })
      const blob = new Blob([res.data])
      const link = this.$refs['download']
      link.href = URL.createObjectURL(blob)
      link.download = document.name
      link.click()
      URL.revokeObjectURL(link.href)
    },
    showItemInformation(item) {
      this.loadingDialog = true;
      this.axios.get(`${process.env.VUE_APP_API_URL}/purchase/${item.id}`).then( res => {
        this.itemInformation = res.data;
        this.itemInformation.totalPrice = 0.00;
        for (const purchaseProduct of this.itemInformation.purchaseProducts) {
          this.itemInformation.totalPrice += parseFloat(purchaseProduct.price) * parseFloat(purchaseProduct.quantity)
        }
        this.itemInformationDialog = true;
        this.loadingDialog = false;
      }).catch(() => { this.loadingDialog = false; })
    },
    processComplete() {
      console.log("Process completed");
      let dropZone = this.$refs.documents.$el.dropzone;
      dropZone.removeAllFiles(true);
      this.loadPurchases();
      this.resetAll();
      this.$swal(
        'Succès!',
        'Les modifications ont été effectuées avec succès.',
        'success'
      )
    },
    searchTermChanged() {
      this.loadPurchases();
    },
    reloadSelectedItem() {
      this.axios.get(`${process.env.VUE_APP_API_URL}/purchase/${this.selectedItem.id}`).then(res => {
        this.selectedItem = res.data;
      });
    },
    loadPurchases() {
      this.$store.commit('setOverlay', true)
      let searchParams = {};
      if ( this.selectedProduct )
        searchParams.productId = this.selectedProduct
      if ( this.selectedProvider )
        searchParams.concernId = this.selectedProvider
      if ( this.selectedEndDate )
        searchParams.endDate = this.selectedEndDate;
      if ( this.selectedStartDate )
        searchParams.startDate = this.selectedStartDate;

      /** */
      this.axios.get(`${process.env.VUE_APP_API_URL}/purchases`, { params: searchParams }).then(res => {
        this.items = res.data;
      }).then(() => { this.$store.commit('setOverlay', false); }).catch(() => { this.$store.commit('setOverlay', false) });
    },
    async loadItems() {
      await this.axios.get(`${process.env.VUE_APP_API_URL}/concerns?type=Provider`).then(res => {
        this.providers = res.data;
      });
      this.axios.get(`${process.env.VUE_APP_API_URL}/products`).then(res => {
        this.products = res.data;
      }).then(() => { this.$store.commit('setOverlay', false); }).catch(() => { this.$store.commit('setOverlay', false); });
    },
    showCreateCard() {
      this.selectedItem = {
        id: -1,
        vat: 20,
        shipped: 1
      };
      this.purchaseProducts = [];
      setTimeout(() => {
        window.scrollTo({top: 0, behavior: 'smooth'})
      }, 100);
    },
    sendingEvent(file, xhr, formData) {
      if ( file && xhr && formData ) {
        for (const key in this.selectedItem) {
          if ( !formData.has(key) )
            formData.append(key, this.selectedItem[key])
        }
        if ( !formData.has('products') )
          formData.append('products', JSON.stringify(this.purchaseProducts))
      }
    },
    createOrUpdate() {
      this.loadingDialog = true;
      var dropZoneRef = this.$refs.documents;
      var dropZone = this.$refs.documents.$el.dropzone;
      /** data to send through the request */
      const id = this.selectedItem.id;
      /** Method will be put or create */
      const method =
        (id < 0) ?
        'post':(id > 0) ?
        'put':null
      /** URL changes depends if your modifying or creating a new record */
      const url =
        (id < 0) ?
        `${process.env.VUE_APP_API_URL}/purchase`:(id > 0) ?
        `${process.env.VUE_APP_API_URL}/purchase/${id}`:null
      /** Prepare request to send */
      // this.dropzoneOptions.params = this.selectedItem;
      dropZoneRef.setOption('url', url);
      dropZoneRef.setOption('method', method);
      dropZoneRef.setOption('headers', { 'auth': this.$store.state.authToken });
      if ( dropZone.files.length > 0 ) {
        this.loadingDialog = false;
        return dropZone.processQueue();
      }
      let formData = new FormData();
      for (const key in this.selectedItem) {
        formData.append(key, this.selectedItem[key])
      }
      formData.append('products', JSON.stringify(this.purchaseProducts))
      /** Now send the request */
      this.axios({
        url: url,
        method: method,
        data: formData
      }).then(() => {
        this.resetAll();
        this.loadPurchases();
        this.$swal(
          'Succès!',
          'Les modifications ont été effectuées avec succès.',
          'success'
        )
        this.loadingDialog = false;
      }).catch(err => {
        this.$swal(
          'Champs obligatoires manquants!',
          'Assurez-vous de remplir toutes les entrées obligatoires avant de soumettre votre demande.',
          'warning'
        )
        this.loadingDialog = false;
        console.log(err);
      })
    },
    resetAll() {
      this.selectedItem = { id: 0 }
    },
    showEditCard(item) {
      this.selectedItem = item;
      this.purchaseProducts = item.purchaseProducts;
      setTimeout(() => {
        window.scrollTo({top: 0, behavior: 'smooth'})
      }, 100);
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
          this.axios.delete(`${process.env.VUE_APP_API_URL}/purchase/${item.id}`).then(() => {
            this.$swal(
              'Supprimé!',
              'achat a été supprimé.',
              'success'
            );
            this.loadPurchases();
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
<style>
.max-width-320 {
  max-width: 320px;
}

</style>
