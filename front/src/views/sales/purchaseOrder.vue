<template>
  <v-container fill-height fluid max-width="1444px">
    <!-- Modify or Create new one -->
    <v-expand-transition>
      <v-row v-show="showCreateOrUpdateCard" class="text-center my-10" align="center" justify-sm="center" max-width="1444px">
        <v-card style="width: 1024px">
          <v-toolbar
            flat
            color="primary"
            dark
          >
            <v-toolbar-title class="text-uppercase" v-text="showCreateOrUpdateCardText"></v-toolbar-title>
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
                  <h2>Produits</h2>
                  <v-btn class="my-3" color="primary" @click="addProductDialog = true"> Ajouter produit </v-btn>
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
          <v-card-actions class="justify-center" align="center">
            <v-btn
              @click="createOrUpdate"
              class="my-2"
              outlined
              rounded
              text
              color="primary"
              :loading="loading"
              :disabled="loading"
            >
              Sauvegarder
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-row>
    </v-expand-transition>
    <!-- List -->
    <v-row class="text-center" justify-sm="center" max-width="1444px">
      <v-card>
        <v-toolbar
          flat
          color="primary"
          dark
        >
          <v-spacer></v-spacer>
          <v-toolbar-title class="text-center"> Management des Bons de commande </v-toolbar-title>
          <v-spacer></v-spacer>
        </v-toolbar>
        <!-- Search Rows -->
        <v-row class="mx-3 my-2" justify-sm="center">
          <v-col>
            <DatePicker label="À partir de" :bound="-1" v-model="selectedStartDate"></DatePicker>
          </v-col>
          <v-col>
            <DatePicker label="À" :bound="1" v-model="selectedEndDate"></DatePicker>
          </v-col>
        </v-row>
        <v-row class="mx-3 my-2" justify-sm="center">
          <v-col>
            <v-autocomplete
              prepend-icon="fa-handshake"
              label="Filtrer par des Clients"
              :items="clientsFilter"
              v-model="selectedClient"
              item-text="companyName"
              item-value="id"
            >
              <template slot="selection" slot-scope="data"> {{ data.item.companyName ?? data.item.name + ' ' + data.item.surname }} </template>
              <template slot="item" slot-scope="data"> {{ data.item.companyName ?? data.item.name + ' ' + data.item.surname }} </template>
            </v-autocomplete>
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
          :loading="loadingData"
          :headers="columns"
          :items="items"
          :items-per-page="8"
          class="elevation-1"
        >
          <template v-slot:top>
            <div class="text-center mx-1-rem">
              <v-btn
                v-if="false"
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
          <template v-slot:[`item.products`]="{ item }" >
            <!-- <ul v-for="sp in item.saleProducts" :key="'sp' + sp.id">
              <li>{{ sp.product.productCodes[0].code }}</li>
            </ul> -->
            <div class="text-center">
              <v-btn
                color="primary"
                outlined
                text
                @click="showQuotationProducts(item)"
                :loading="loading"
                :disabled="loading"
              >
                Afficher les produits
              </v-btn>
            </div>
          </template>
          <template v-slot:[`item.concern.companyName`]="{ item }" >
            {{ (item.concern?.companyName ?? (item.concern?.name + ' ' + item.concern?.surname)) }}
          </template>
          <template v-slot:[`item.vat`]="{ item }">
            {{ item.vat }}%
          </template>
          <template v-slot:[`item.total`]="{ item }">
            {{ item.total  | formatPrice }}
          </template>
          <template v-slot:[`item.totalPrice`]="{ item }">
            {{ item.totalPrice | formatPrice }}
          </template>
          <template v-slot:[`item.createdAt`]="{ item }">
            {{ item.createdAt | formatDate }}
          </template>
          <template
            v-if="$store.getters.hasPerm('sale-create')"
            v-slot:[`item.actions`]="{ item }"
          >
            <div class="text-center">
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
                  <v-list-item class="d-block" link @click="showEditCard(item)">
                    <v-list-item-title>
                      <v-btn
                        text
                        color="primary"
                        :loading="loading"
                        :disabled="loading"
                      >
                        <v-icon left>fas fa-pencil</v-icon> Modifier
                      </v-btn>
                    </v-list-item-title>
                  </v-list-item>
                  <v-list-item class="d-block" link @click="showQuotation(item)">
                    <v-list-item-title>
                      <v-btn
                        text
                        color="success"
                        :loading="loading"
                        :disabled="loading"
                      >
                        <v-icon left>fas fa-receipt</v-icon> Afficher le Devis
                      </v-btn>
                    </v-list-item-title>
                  </v-list-item>
                  <v-list-item class="d-block" link @click="transferToDeliveryForm(item)">
                    <v-list-item-title>
                      <v-btn
                        text
                        color="primary"
                        :loading="loading"
                        :disabled="loading"
                      >
                        <v-icon left>fas fa-file-lines</v-icon> Transfert vers un bon de livraison
                      </v-btn>
                    </v-list-item-title>
                  </v-list-item>
                  <!-- delete button -->
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
            </div>
          </template>
        </v-data-table>
      </v-card>
    </v-row>
    <v-divider></v-divider>
    <v-dialog
      transition="dialog-bottom-transition"
      v-model="addProductDialog"
      max-width="640"
      persistent
    >
      <v-card>
        <v-toolbar class="text-center" color="primary" dark >
          <v-spacer></v-spacer>
          <h2>Ajouter un produit a vente</h2>
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
            <v-col lg="6" sm="12">
              <v-select
                label="Methode de vente"
                v-model="selectedSellMethod"
                :items="sellMethods"
                item-text="name"
                item-value="value"
              ></v-select>
            </v-col>
            <!-- Original Price -->
            <!-- <v-col lg="5" sm="12" v-if="products.find(p => p.id == editedSaleProduct.productId) && editedSaleProduct.productPrice">
              <v-text-field
                readonly
                label="Prix normal de vente / Unité"
                v-model="editedSaleProduct.productPrice"
                type="number"
              ></v-text-field>
            </v-col> -->
            <!-- <v-col lg="5" sm="12" v-else-if="products.find(p => p.id == editedSaleProduct.productId)">
              <v-text-field
                readonly
                label="Prix normal de vente / Unité"
                v-model="products.find(p => p.id == editedSaleProduct.productId).sell_price"
                type="number"
              ></v-text-field>
            </v-col> -->
            <!-- Buy Price -->
            <v-col lg="4" sm="12">
              <v-text-field
                v-if="products.find(p => p.id == editedSaleProduct.productId)"
                readonly
                @change="priceChanged"
                label="Prix D'achat"
                v-model="products.find(p => p.id == editedSaleProduct.productId).buy_price"
                type="number"
              ></v-text-field>
            </v-col>
            <!-- Price before discount -->
            <!-- <v-col lg="4" sm="12">
              <v-text-field
                label="Prix Avant Remise"
                v-model="editedSaleProduct.productPrice"
                type="number"
              ></v-text-field>
            </v-col> -->
            <!-- Sell Price -->
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
            <v-col lg="3" sm="6">
              <v-text-field
                readonly
                disabled
                label="Prix TTC"
                v-model="computedPriceIncTVA"
                type="text"
              ></v-text-field>
            </v-col>
            <!-- Profit Margin -->
            <v-col lg="6" sm="12">
              <v-text-field
                @change="profitMarginChanged"
                label="Marge bénéficiaire"
                v-model="editedSaleProduct.profit_margin"
                append-icon="fas fa-percent"
                type="number"
              ></v-text-field>
            </v-col>
            <!-- Quantity -->
            <v-col lg="6" sm="12">
              <v-text-field
                label="Quantité"
                v-model="editedSaleProduct.quantity"
                :rules="[v => ( v && v <= (products.find(p => p.id == editedSaleProduct.productId)?.quantity ?? 0) ) || `Devrait être inférieur ou égal à ${(products.find(p => p.id == editedSaleProduct.productId)?.quantity ?? 0)}`]"
                type="number"
              ></v-text-field>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn
            text
            @click="closeAddProductDialog"
          >
          Fermer
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn
            text color="primary"
            @click="addProduct()"
            v-text="`${(editedSaleProductIndex >= 0) ? 'Modifier':'Ajouter'}`"
          >
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog
      transition="dialog-bottom-transition"
      v-model="saleDialog"
      fullscreen
      hide-overlay
      scrollable
      persistent
    >
       <v-card tile>
          <v-toolbar
            flat
            dark
            color="primary"
          >
            <v-btn
              icon
              dark
              @click="saleDialog = false"
            >
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-toolbar>
          <v-card-text style="min-height: 95vh">
            <Sale
              v-if="saleDialog"
              :sellerInformation="selectedInvoice.sellerInformation"
              :clientInformation="selectedInvoice.clientInformation"
              :invoiceInformation="selectedInvoice.invoiceInformation"
              :saleProducts="selectedInvoice.saleProducts"
              :sale="selectedSale"
            ></Sale>
          </v-card-text>
        </v-card>
    </v-dialog>
    <v-dialog
      fullscreen
      transition="dialog-bottom-transition"
      v-model="quotationDialog"
    >
      <v-card>
        <Quotation
            v-if="quotationDialog"
            :sale="selectedQuotation"
            :clientInformation="clientInformation"
            :sellerInformation="sellerInformation"
            v-on:closed="quotationDialog = false"
          ></Quotation>
      </v-card>
    </v-dialog>
    <v-dialog
      transition="dialog-bottom-transition"
      v-model="productsListDialog"
      v-if="selectedQuotation.id"
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
            Affichage de la liste des produits pour le Bon de commande N°{{ selectedQuotation.id }}
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
                <th>Prix avant remise</th>
                <th>Remise</th>
                <th>Prix Aprés Remise</th>
                <th>Quantité</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(saleProduct, index) in selectedQuotation.saleProducts"
                :key="'saleProductPL' + index"
              >
                <td class="text-left">
                  <ul>
                    <li
                      v-for="pCode in products.find(p => p.id == saleProduct.productId).productCodes"
                      :key="'pcode' + pCode.id"
                      v-text="pCode.code"
                    >
                    </li>
                  </ul>
                </td>
                <!-- Price before discount -->
                <td class="text-left"> {{ (parseFloat(saleProduct.productPrice) > 0) ? saleProduct.productPrice:saleProduct.product[saleProduct.type] | formatPrice }} </td>
                <!-- Discount -->
                <td class="text-left" v-if="saleProduct.productPrice > 0"> {{ parseFloat(saleProduct.productPrice) - parseFloat(saleProduct.price) | formatPrice }} </td>
                <td class="text-left" v-else> {{ parseFloat(saleProduct.product[saleProduct.type]) - parseFloat(saleProduct.price) | formatPrice }} </td>
                <!-- Price after discount -->
                <td class="text-left"> {{ saleProduct.price | formatPrice }} </td>
                <td class="text-left"> {{ saleProduct.quantity | formatNumber }} {{saleProduct.product.unity}} </td>
                <td class="text-left"> {{ (saleProduct.price * saleProduct.quantity) | formatPrice }} </td>
              </tr>
            </tbody>
          </v-simple-table>
        </v-card-text>
      </v-card>
    </v-dialog>
    <!-- Create Purchase Order (Sale) Dialog -->
    <v-dialog
      transition="dialog-bottom-transition"
      v-model="transferToPurchaseOrderDialog"
      max-width="640"
      persistent
    >
      <v-card tile>
        <v-toolbar class="text-uppercase" flat dark color="primary">
          <v-col cols="12" class="text-center">
            Crée un bon de commande
          </v-col>
        </v-toolbar>
        <v-card-text>
          <!-- Documents -->
          <v-row justify-sm="center my-3">
            <v-col cols="12">
              <h2 class="text-uppercase text-center"> Documents: </h2>
              <p class="text-center mt-2 warning--text text-bold">
                Pour créer un bon de commande pour le Bons de commande sélectionné <b>(#{{ purchaseOrder?.id }})</b>,
                vous devez télécharger au moins un fichier.
                Une fois le bon de commande créé, vous pourrez le télécharger et consulter
                les détails de votre bon de commande dans le portail <a :href="'purchaseOrder'"> Bon de commandes </a>.
              </p>
            </v-col>
            <v-col cols="12" v-if="purchaseOrder.documents?.length > 0">
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
                    v-for="document in purchaseOrder.documents"
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
                v-on:vdropzone-error="dropZoneErrorHandling"
              ></vue-dropzone>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-btn
            @click="transferToPurchaseOrderDialog = false"
            color="red"
            :loading="loading"
            :disabled="loading"
            class="white--text"
          >
            <v-icon left>fa-times</v-icon>
            Annuler
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn
            @click="transferToPurchaseOrder"
            tile
            color="primary"
            :loading="loading"
            :disabled="loading"
          >
            <v-icon left>far fa-save</v-icon>
            Confirmer
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import vue2Dropzone from 'vue2-dropzone'
import 'vue2-dropzone/dist/vue2Dropzone.min.css'
import store from '../../store';

import DatePicker from '../../components/DatePicker.vue'
import Sale from '../../components/Sale.vue';
import Quotation from '../../components/Quotation.vue';
import Vue from 'vue';
export default {
  components: { Sale, DatePicker, Quotation, vueDropzone: vue2Dropzone },
  watch: {
    transferToPurchaseOrderDialog() {
      if ( !this.transferToPurchaseOrderDialog )
        this.$refs.documents.$el.dropzone.removeAllFiles(true);
    },
    productsListDialog() {
      if ( !this.productsListDialog )
        this.selectedQuotation = Object.assign({}, {});
    },
    selectedStartDate() {
      this.loadSales();
    },
    selectedEndDate() {
      this.loadSales();
    },
    'selectedSellMethod'() {
      this.editedSaleProduct.priceType = this.selectedSellMethod;
      const product = this.products.find(p => p.id == this.editedSaleProduct.productId);
      let price = 0;
      if ( product ) {
        price = product[this.selectedSellMethod];
        this.editedSaleProduct.price = parseFloat(price);
        product.sell_price = parseFloat(price);
        this.priceChanged(parseFloat(price))
      }
    },
    'selectedItem.id'() {
      if ( this.selectedItem.id == 0 )
        this.saleProducts = []
    },
    addProductDialog() {
      if ( !this.addProductDialog )
        this.editedSaleProduct = {}
    },
    'editedSaleProduct.productId'() {
      const product = this.products.find(p => p.id == this.editedSaleProduct.productId);
      let price = 0;
      if ( product ) {
        price = product[this.selectedSellMethod];
        this.editedSaleProduct.price = parseFloat(price);
        this.editedSaleProduct.productPrice = this.editedSaleProduct.productPrice ?? parseFloat(price);
        product.sell_price = parseFloat(price);
        this.priceChanged(parseFloat(price))
      }
    },
    'selectedItem.shipped'() {
      if ( this.selectedItem.shipped === true || this.selectedItem.shipped === false )
      this.selectedItem.shipped = this.selectedItem.shipped ? 1:0
    },
    selectedClient() {
      this.loadSales();
    },
    selectedProduct() {
      this.loadSales();
    },
  },
  computed: {
    // this is for TVA in edited sale product
    computedPriceIncTVA() {
      return this.editedSaleProduct.price ? Vue.filter('formatPrice')(this.editedSaleProduct.price * 1.2):Vue.filter('formatPrice')(0)
    },
    priceWithoutVATWithoutDiscount() {
      let total = 0;
      for (const saleProduct of this.saleProducts) {
        total += parseFloat(saleProduct.price) * parseFloat(saleProduct.quantity)
      }
      return total
    },
    priceWithoutVAT() {
      let total = 0;
      for (const saleProduct of this.saleProducts) {
        total += parseFloat(saleProduct.price) * parseFloat(saleProduct.quantity);
      }
      if ( this.selectedItem && this.discount )
        total -= parseFloat(this.discount ?? 0)
      return total
    },
    priceWithVAT() {
      let total = 0;
      total = this.priceWithoutVAT + parseFloat( this.priceWithoutVAT * this.selectedItem.vat / 100 )
      return total;
    },
    saleTotalDF() {
      let total = 0;
      for (const sale of this.items) {
        total += parseFloat(sale.total)
      }
      return Intl.NumberFormat().format(total);
    },
    saleTotalPrice() {
      let total = 0
      for (const sale of this.items) {
        total += sale.totalPrice
      }
      return Intl.NumberFormat().format(total);
    },
    saleProductsTotalDF() {
      let total = 0;
      for (const saleProduct of this.saleProducts) {
        total += parseFloat(parseFloat(saleProduct.price) * parseFloat(saleProduct.quantity));
      }
      return total ?? 0;
    },
    saleProductsTotalPrice() {
      let taxe = parseFloat(this.saleProductsTotalDF) * parseFloat((this.selectedItem?.vat ?? 0) / 100)
      let total = parseFloat(this.saleProductsTotalDF) + parseFloat(taxe);
      return total ?? 0;
    },
    productsFilter() {
      let products = Object.assign([], this.products);
      products.unshift({ id: -1, productCodes: [ { code: "Afficher tout" } ] })
      return products;
    },
    clientsFilter() {
      let clients = Object.assign([], this.clients);
      clients.unshift({ id: -1, companyName: "Afficher tout" })
      return clients;
    },
    showCreateOrUpdateCard() {
      return this.selectedItem.id
    },
    showCreateOrUpdateCardText() {
      return (this.showCreateOrUpdateCard < 0) ? `Nouveau devis`:`Modification de devis #${this.selectedItem?.id}`;
    },
  },
  data: () => {
    return {
      loadingData: false,
      dropzoneOptions: {
        parallelUploads: 10,
        dictDefaultMessage: "Déposez les fichiers ici ou <br> cliquez ici...",
        addRemoveLinks: true,
        autoProcessQueue: false,
        uploadMultiple: true,
        headers: { 'auth': store.state.authToken },
        /** Changeable */
        url: `${process.env.VUE_APP_API_URL}`,
        method: '',
        thumbnailWidth: 150,
      },
      productsListDialog: false,
      deletedSaleProducts: [],
      clientInformation: {},
      sellerInformation: {},
      selectedQuotation: {},
      quotationDialog: false,
      loading: false,
      selectedEndDate: null,
      selectedStartDate: null,
      selectedSale: {},
      saleDialog: false,
      invoiceDialog: false,
      selectedInvoice: {},
      sellMethods: [
        { name: 'Gros', value: 'wholesale_price' },
        { name: 'Detail', value: 'retail_price' },
      ],
      selectedSellMethod: 'wholesale_price',
      paymentMethods: [
        { name: 'Espece', value: 'cash' },
        { name: 'Chèque', value: 'check' },
        { name: 'Virement', value: 'bank' },
        { name: 'Effet', value: 'bill' },
      ],
      discountPercent: 0.00,
      discount: 0.00,
      saleProducts: [],
      editedSaleProduct: {},
      editedSaleProductIndex: -1,
      addProductDialog: false,
      showStatistics: false,
      selectedInventory: -1,
      products: [],
      selectedProduct: -1,
      clients: [],
      selectedClient: -1,
      addNewButtonText: 'Nouveau devis',
      searchTerm: '',
      selectedType: -1,
      selectedItem: {
        id: 0
      },
      columns: [
        { text: '#', value: 'id', align: 'start' },
        { text: 'Client', value: 'concern.companyName' },
        { text: 'Produits', value: 'products' },
        { text: 'Total (MAD)', value: 'total' },
        { text: 'TVA', value: 'vat' },
        { text: 'Total TTC (MAD)', value: 'totalPrice' },
        { text: 'Date', value: 'createdAt' },
        { text: 'Actions', value: 'actions', sortable: false },
      ],
      items: [],
      purchaseOrder: {},
      transferToPurchaseOrderDialog: false,
    }
  },
  mounted() {
    this.loadItems();
  },
  methods: {
    dropZoneErrorHandling(file, message, xhr) {
      console.log(file);
      console.log(message);
      console.log(xhr);
      document.querySelector('.dz-error-message span').innerText = "Serveur en maintenance.";
    },
    async transferToPurchaseOrder() {
      var dropZoneRef = this.$refs.documents;
      var dropZone = this.$refs.documents.$el.dropzone;
      const method = "post";
      const url = `${process.env.VUE_APP_API_URL}/sale/quotation/${this.purchaseOrder.id}/purchaseOrder`;
      dropZoneRef.setOption('url', url);
      dropZoneRef.setOption('method', method);
      dropZoneRef.setOption('headers', { 'auth': this.$store.state.authToken });
      await dropZone.processQueue();
    },
    sendingEvent(file, xhr, formData) {
      if ( file && xhr && formData ) {
        for (const key in this.purchaseOrder) {
          if ( !formData.has(key) )
            formData.append(key, this.purchaseOrder[key])
        }
      }
    },
    processComplete() {
      let dropZone = this.$refs.documents.$el.dropzone;
      dropZone.removeAllFiles(true);
      this.loadSales();
      this.resetAll();
      this.purchaseOrder = Object.assign({}, {});
      this.transferToPurchaseOrderDialog = false;
      this.$swal(
        'Succès!',
        'Les modifications ont été effectuées avec succès.',
        'success'
      );
    },
    showTransferToPurchaseOrderDialog(item) {
      this.purchaseOrder = item;
      this.transferToPurchaseOrderDialog = true;
    },
    showQuotationProducts(quotation) {
      this.productsListDialog = true;
      this.selectedQuotation = quotation;
    },
    showQuotation(quotation) {
      this.loading = true;
      this.axios({
        url: `${process.env.VUE_APP_API_URL}/sale/quotation/${quotation.id}`,
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
        this.selectedQuotation = res.data;
        this.quotationDialog = true;
        this.loading = false;
      }).catch((err) => { console.log(err); this.loading = false; })
    },
    priceChanged(val) {
      let sellPrice = val;
      let newEditedSaleProduct = Object.assign({}, this.editedSaleProduct);
      const product = this.products.find(p => p.id == this.editedSaleProduct.productId);
      if ( product ) {
        let buyPrice = product.buy_price;
        let profitMargin = parseFloat((parseFloat(sellPrice / buyPrice) - 1) * 100).toFixed(2)
        newEditedSaleProduct.profit_margin = profitMargin;
        this.editedSaleProduct = Object.assign({}, newEditedSaleProduct)
      } else
        this.editedSaleProduct = Object.assign({}, newEditedSaleProduct)
    },
    profitMarginChanged(val) {
      let profitMargin = val;
      let newEditedSaleProduct = Object.assign({}, this.editedSaleProduct);
      const product = this.products.find(p => p.id == this.editedSaleProduct.productId);
      if ( product ) {
        let buyPrice = product.buy_price;
        let sellPrice = parseFloat(parseFloat(profitMargin / 100) + 1 ).toFixed(2) * buyPrice
        newEditedSaleProduct.price = sellPrice.toFixed(2);
        this.editedSaleProduct = Object.assign({}, newEditedSaleProduct)
      } else
        this.editedSaleProduct = Object.assign({}, newEditedSaleProduct)
    },
    discountChanged(val){
      // console.log('Discount', val);
      let discount = val;
      this.discountPercent = parseFloat(discount * 100 / this.priceWithoutVATWithoutDiscount).toFixed(2);
    },
    discountPercentChanged(val){
      console.log('Discount %', val);
      let discountPercent = val;
      this.discount = parseFloat(this.priceWithoutVATWithoutDiscount * discountPercent / 100).toFixed(2) ;
    },
    editProduct(product) {
      this.editedSaleProductIndex = this.saleProducts.indexOf(product);
      this.editedSaleProduct = product;
      this.addProductDialog = true
    },
    removeProduct(product) {
      this.deletedSaleProducts.push(product);
      const indexOfProduct = this.saleProducts.indexOf(product)
      this.saleProducts.splice(indexOfProduct, 1)
    },
    closeAddProductDialog() {
      this.editedSaleProduct = {}
      this.editedSaleProductIndex = -1;
      this.addProductDialog = false
    },
    addProduct() {
      this.editedSaleProduct.priceType = this.selectedSellMethod;
      this.editedSaleProduct.discount = 0;
      this.editedSaleProduct.type = this.selectedSellMethod;
      // this.editedSaleProduct.productPrice = ;
      const product = this.products.find(p => p.id == this.editedSaleProduct.productId);
      if ( product && product[this.editedSaleProduct.priceType] > this.editedSaleProduct.price ) {
        this.editedSaleProduct.discount = parseFloat(product[this.editedSaleProduct.priceType] - this.editedSaleProduct.price).toFixed(2)
      }
      if( !this.saleProducts?.length )
        this.saleProducts = [];
      /** Push Purchased Product to the selectedItem */
      if ( this.editedSaleProductIndex < 0 )
        this.saleProducts.push(this.editedSaleProduct);
      else
        Object.assign(this.saleProducts[this.editedSaleProductIndex], this.editedSaleProduct);
        // this.saleProducts[this.editedSaleProductIndex] = Object.assign({}, this.editedSaleProduct);
      /** Close dialog */

      this.closeAddProductDialog()
    },
    getSale(item) {
      // Invoice Information
      this.axios.get(`${process.env.VUE_APP_API_URL}/sale/quotation/${item.id}`).then(res => {
        console.log(res.data.deliveryForms);
        const deliveryFormInformation = res.data.deliveryForms[0];
        if ( deliveryFormInformation )
          this.selectedInvoice.invoiceInformation = {
            id: deliveryFormInformation.count,
            number: new Date().getFullYear() + '.' + deliveryFormInformation.count,
            date: new Date(deliveryFormInformation.createdAt).toISOString().split('T')[0],
            dueDate: new Date(new Date(deliveryFormInformation.createdAt).setDate(+60)).toISOString().split('T')[0]
          }
        else this.selectedInvoice.invoiceInformation = {}
        // Seller information
        const sellerCompany = this.$store.getters.getCompany;
        this.selectedInvoice.sellerInformation = {
          name: sellerCompany.name,
          address: sellerCompany.address,
          zip: sellerCompany.zip,
          city: sellerCompany.city,
          country: sellerCompany.country,
        }
        // Buyer Information
        this.selectedInvoice.clientInformation = {
          name: item.concern?.companyName ?? (item.concern?.name + ' ' + item.concern?.surname),
          address: item.concern?.address ?? '',
          zip: item.concern?.zip ?? '',
          city: item.concern?.city ?? '',
          country: item.concern?.country ?? 'Maroc'
        }
        // Products
        this.selectedInvoice.saleProducts = [];
        for (const saleProduct of item.saleProducts) {
          this.selectedInvoice.saleProducts.push({
            description: saleProduct.product.productCodes[0].code,
            quantity: parseFloat(saleProduct.quantity),
            productPrice: parseFloat(saleProduct.product[saleProduct.type]),
            price: parseFloat(saleProduct.price)
          })
        }
        this.selectedSale = item;
        this.saleDialog = true;
      })
    },
    searchTermChanged() {
      this.loadSales();
    },
    loadSales() {
      this.loadingData = true;
      let searchParams = {};
      if ( this.selectedProduct )
        searchParams.productId = this.selectedProduct
      if ( this.selectedClient )
        searchParams.concernId = this.selectedClient
      if ( this.selectedEndDate )
        searchParams.endDate = this.selectedEndDate;
      if ( this.selectedStartDate )
        searchParams.startDate = this.selectedStartDate;
      /** */
      this.axios.get(`${process.env.VUE_APP_API_URL}/sale/purchaseOrders`, { params: searchParams }).then(res => {
        this.items = res.data;
        this.loadingData = false;
      }).catch(() => { this.loadingData = false; });
    },
    loadItems() {
      // this.axios.get(`${process.env.VUE_APP_API_URL}/sale/purchaseOrders`).then(res => {
      //   this.items = res.data;
      // });
      this.loadSales();
      this.axios.get(`${process.env.VUE_APP_API_URL}/concerns?type=Client`).then(res => {
        this.clients = res.data;
      });
      this.axios.get(`${process.env.VUE_APP_API_URL}/products`).then(res => {
        this.products = res.data;
      });
    },
    showCreateCard() {
      this.selectedItem = {
        id: -1,
        vat: 20,
        shipped: 1
      };
    },
    createOrUpdate() {
      this.loading = true;
      /** data to send through the request */
      const { id } = this.selectedItem;
      /** Method will be put or create */
      const method =
        (id < 0) ?
        'post':(id > 0) ?
        'put':null
      /** URL changes depends if your modifying or creating a new record */
      const url =
        (id < 0) ?
        `${process.env.VUE_APP_API_URL}/sale/quotation`:(id > 0) ?
        `${process.env.VUE_APP_API_URL}/sale/quotation/${id}`:null
      let createOrUpdateData = {}
      for (const key in this.selectedItem) {
        createOrUpdateData[key] =  this.selectedItem[key]
      }
      createOrUpdateData['products'] = this.saleProducts
      createOrUpdateData['deletedSaleProducts'] = this.deletedSaleProducts;
      createOrUpdateData['discount'] = this.discount
      /** Now send the request */
      this.axios({
        url: url,
        method: method,
        data: createOrUpdateData
      }).then(() => {
        this.resetAll();
        this.loadItems();
        this.$swal(
          'Succès!',
          'Les modifications ont été effectuées avec succès.',
          'success'
        )
        this.loading = false;
      }).catch(err => {
        this.$swal(
          'Champs obligatoires manquants!',
          'Assurez-vous de remplir toutes les entrées obligatoires avant de soumettre votre demande.',
          'warning'
        )
        this.loading = false;
        console.log(err);
      })
    },
    resetAll() {
      this.selectedItem = { id: 0 };
      this.discount = 0;
      this.discountPercent = 0;
      this.deletedSaleProducts = Object.assign([], []);
    },
    showEditCard(item) {
      this.selectedItem = item;
      this.saleProducts = item.saleProducts
      this.discount = item.discount
      this.discountChanged(item.discount)
    },
    showDeleteConfirm(item) {
      this.loading = true;
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
          this.axios.delete(`${process.env.VUE_APP_API_URL}/sale/purchaseOrder/${item.id}`).then(() => {
            this.loading = false;
            this.$swal(
              'Supprimé!',
              'vente a été supprimé.',
              'success'
            );
            this.loadItems();
            this.resetAll();
          }).catch(() => {
            this.loading = false;
            this.$swal(
              'Erreur!',
              "Une erreur s'est produite lors de la suppression de rôle",
              'error'
            )
          });
        } else {
          this.loading = false;
        }
      })
    },
    async transferToDeliveryForm(quotation) {
      this.loading = true;
      var forceCreate = false;
      await this.$swal({
          title: 'Attention!',
          text: "Il peut y avoir des produits en rupture de stock, voulez-vous forcer le bon de livraison ou annuler s'il y a des produits en rupture de stock ?",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Oui',
          cancelButtonText: "Non",
        }).then((result) => {
          if (result.isConfirmed) {
            forceCreate = true;
          } else {
            forceCreate = false;
          }
        })
      const method = 'post';
      const url = `${process.env.VUE_APP_API_URL}/sale/deliveryForm`;
      const data = {
        forceCreate: forceCreate,
        saleId: quotation.id,
      }
      this.axios({
        url: url,
        method: method,
        data: data
      }).then(async () => {
        this.loadItems();
        this.$swal(
          'Succès!',
          'Les modifications ont été effectuées avec succès.',
          'success'
        )
        this.loading = false;
      }).catch(err => {
        this.$swal(
          'Champs obligatoires manquants!',
          'Assurez-vous de remplir toutes les entrées obligatoires avant de soumettre votre demande.',
          'warning'
        )
        this.loading = false;
        console.log(err);
      })
    }
  }
}
</script>
<style>
.max-width-320 {
  max-width: 320px;
}

</style>
