<template>
  <v-row justify="center">
    <!-- Modify or Create new one -->
    <v-expand-transition>
      <v-row v-show="showCreateOrUpdateCard" class="text-center my-10" align="center" justify="center" max-width="1444px">
        <v-card style="width: 1024px">
          <v-toolbar flat color="primary" dark>
            <v-toolbar-title class="text-uppercase">{{ showCreateOrUpdateCardText }}</v-toolbar-title>
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
                  <tbody style="{width:320px}">
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
      </v-row>
    </v-expand-transition>
    <v-col cols="12">
      <div class="text-center my-3 text-uppercase">
        <h3> Système de gestion des bons de livraison </h3>
      </div>
    </v-col>
    <v-col cols="9">
      <v-row justify="center">
        <v-col cols="5">
          <DatePicker label="Date de début" :bound="-1"  v-model="selectedStartDate"></DatePicker>
        </v-col>
        <v-col cols="5">
          <DatePicker label="Date de fin" :bound="1" v-model="selectedEndDate"></DatePicker>
        </v-col>
        <v-col cols="5">
          <v-autocomplete
            label="Client"
            v-model="selectedConcern"
            :items="concerns"
            item-value="id"
            item-text="companyName"
            prepend-icon="fas fa-handshake"
          ></v-autocomplete>
        </v-col>
        <v-col cols="5">
          <v-select
            label="Status"
            v-model="selectedStatus"
            :items="[{ text: 'Tous', value: -1 }, { text: 'Facturé', value: 1 }, { text: 'Non Facturé', value: 2 }]"
            prepend-icon="fa-solid fa-list-check"
          ></v-select>
        </v-col>
      </v-row>
    </v-col>
    <v-col cols="10">
      <v-card class="my-5">
        <v-toolbar flat color="primary" dark>
          <v-spacer></v-spacer>
          <v-toolbar-title class="text-center text-uppercase">Statistiques</v-toolbar-title>
          <v-spacer></v-spacer>
        </v-toolbar>
        <v-card-text>
          <v-simple-table dense>
            <tr>
              <th>Montant total</th>
              <th>Total payé</th>
              <th>Total impayé</th>
            </tr>
            <tbody>
              <tr>
                <th class="text-h6 text-center primary--text">{{ totalAmount | formatPrice }}</th>
                <th class="text-h6 text-center success--text">{{ totalPaid | formatPrice }}</th>
                <th class="text-h6 text-center warning--text">{{ totalUnPaidAmount | formatPrice }}</th>
              </tr>
            </tbody>
          </v-simple-table>
        </v-card-text>
      </v-card>

      <v-card>
        <v-toolbar flat color="primary" dark>
          <v-spacer></v-spacer>
          <v-toolbar-title class="text-center text-uppercase">{{ purchaseOrderListTitle }}</v-toolbar-title>
          <v-spacer></v-spacer>
        </v-toolbar>
        <v-data-table
          fixed-header
          height="500px"
          :loading="loadingData"
          show-select
          :footer-props="{ 'items-per-page-options': [15, 30, 50, 100, -1] }"
          :items-per-page="30"
          :headers="columns"
          :items="deliveryFormsFiltered"
          v-model="selectedDeliveryForms"
        >
          <!-- Top Actions -->
          <template v-slot:top>
            <v-col class="text-center" cols="12">
              <v-btn
                v-if="$store.getters.hasPerm('concern-create')"
                color="primary"
                dark
                class="mb-2"
                @click="showCreateCard"
              >
                Créer un nouveau B.L
                <v-icon
                  right
                  dark
                >
                  mdi-plus
                </v-icon>
              </v-btn>
            </v-col>
            <v-col class="text-center" cols="12">
              <!-- <span> Marquez les bons de livraison sélectionnés comme une seule facture </span> -->
              <v-tooltip bottom>
                <template v-slot:activator="{ on, attrs }">
                  <v-btn
                    v-bind="attrs"
                    v-on="on"
                    outlined
                    color="primary"
                    @click="createInvoice"
                    :loading="loading"
                    :disabled="loading"
                  >
                    AIO (All In One)
                  </v-btn>
                </template>
                <span>Marquez les bons de livraison sélectionnés comme une seule facture</span>
              </v-tooltip>
              <!-- <v-btn class="mx-2" outlined color="success" @click="markAsPaidAndShipped"> Marque Comme Payé </v-btn> -->
            </v-col>
          </template>
          <!-- Client -->
          <template v-slot:[`item.client`]="{ item }">
            {{ item.sale?.concern?.companyName ? item.sale?.concern?.companyName:item.sale.concern?.name + ' ' + item.sale?.concern?.surname }}
          </template>
          <!-- Status -->
          <template v-slot:[`item.status`]="{ item }">
            <template v-if="item.invoice?.refunds.length">
              <v-chip class="mr-1 my-1" color="warning" dark>
                {{ `${item.invoice?.refunds.length} Avoirs` }}
              </v-chip>
            </template>
            <v-chip class="mr-l my-1" :color="getStatusColor(item)" dark>
              {{ getStatusText(item) }}
            </v-chip>
          </template>
          <!-- Total Price -->
          <template v-slot:[`item.sale.totalAmountDutyFree`]="{ item }">
            {{ item.sale.totalAmountDutyFree | formatPrice }}
          </template>
          <!-- VAT & Amount In VAT Price -->
          <template v-slot:[`item.sale.totalAmountInVAT`]="{ item }">
            {{ item.sale.totalAmountInVAT | formatPrice }}
            ({{ item.sale.vat | formatNumber }}%)
          </template>
          <!-- Total Amount TTC -->
          <template v-slot:[`item.sale.totalAmount`]="{ item }">
            {{ item.sale.totalAmountInVAT + item.sale.totalAmountDutyFree | formatPrice }}
          </template>
          <!-- Total Price -->
          <template v-slot:[`item.sale.totalUnPaidAmount`]="{ item }">
            <template v-if="item.sale.totalUnPaidAmount && parseFloat(item.sale.totalUnPaidAmount) >= 1">
              {{ item.sale.totalUnPaidAmount | formatPrice }}
            </template>
            <template v-else>
              <v-chip class="text-uppercase" color="success" dark>
                Payé
              </v-chip>
            </template>
          </template>
          <!-- Actions -->
          <template v-slot:[`item.actions`]="{ item }">
            <div class="text-center">
              <v-menu offset-y>
                <template v-slot:activator="{ on, attrs }">
                  <v-btn
                    color="primary"
                    icon
                    v-bind="attrs"
                    v-on="on"
                  >
                    <v-icon>fas fa-wrench</v-icon>
                  </v-btn>
                </template>
                <v-list dense>
                  <!-- Make Payment Button -->
                  <v-list-item v-if="(item.sale.totalUnPaidAmount > 1) && item.invoice" class="d-block" link @click="showPaymentForm(item)">
                    <v-list-item-title>
                      <v-btn
                        text
                        color="success"
                        :loading="loading"
                        :disabled="loading"
                      >
                        <v-icon left>fas fa-cash-register</v-icon> Effectuer un paiement
                      </v-btn>
                    </v-list-item-title>
                  </v-list-item>
                  <!-- Payments Button -->
                  <v-list-item class="d-block" link @click="showPayments(item)">
                    <v-list-item-title>
                      <v-btn
                        text
                        color="primary"
                        :loading="loading"
                        :disabled="loading"
                      >
                        <v-icon left>fas fa-cash-register</v-icon> Paiments
                      </v-btn>
                    </v-list-item-title>
                  </v-list-item>
                  <!-- Create Invoice -->
                  <v-list-item
                    link
                    class="d-block"
                    v-if="!item.invoice && !item.refunds?.length"
                    @click="createOneInvoice(item)"
                  >
                    <v-list-item-title>
                      <v-btn
                        text
                        color="success"
                        :loading="loading"
                        :disabled="loading"
                      >
                        <v-icon left>fas fa-file-invoice</v-icon> Créer la facture
                      </v-btn>
                    </v-list-item-title>
                  </v-list-item>
                  <!-- Show Invoice -->
                  <v-list-item
                    v-if="item.invoice"
                    class="d-block"
                    @click="showInvoice(item)"
                  >
                    <v-list-item-title>
                      <v-btn
                        text
                        color="primary"

                        :loading="loading"
                        :disabled="loading"
                      >
                        <v-icon left>fas fa-file-invoice</v-icon> Afficher la facture
                      </v-btn>
                    </v-list-item-title>
                  </v-list-item>
                  <!-- Show delivery form -->
                  <v-list-item class="d-block">
                    <v-list-item-title>
                      <v-btn
                        text
                        color="primary"
                        @click="showDeliveryForm(item)"
                        :loading="loading"
                        :disabled="loading"
                      >
                        <v-icon left>fas fa-file-invoice</v-icon> Afficher le bon de livraison
                      </v-btn>
                    </v-list-item-title>
                  </v-list-item>
                  <!-- Refund delivery form -->
                  <v-list-item class="d-block" v-if="!!item.invoice" link @click="showRefundWizard(item)">
                    <v-list-item-title>
                      <v-btn
                        text
                        color="warning"
                        :loading="loading"
                        :disabled="loading"
                      >
                        <v-icon left>mdi-credit-card-refund</v-icon> Avoir
                      </v-btn>
                    </v-list-item-title>
                  </v-list-item>
                  <!-- Show Refund -->
                  <v-list-item
                    class="d-block"
                    v-if="item.invoice && item.invoice.refunds?.length"
                    link
                    @click="showRefundInvoice(item)"
                  >
                    <v-list-item-title>
                      <v-btn
                        text
                        color="primary"
                        :loading="loading"
                        :disabled="loading"
                      >
                        <v-icon left>mdi-credit-card-refund</v-icon> Afficher L'Avoir
                      </v-btn>
                    </v-list-item-title>
                  </v-list-item>
                  <!-- Modify Delivery Form -->
                  <v-list-item
                    class="d-block"
                    v-if="$store.getters.hasPerm('sale-update') && !item.invoice && !item.refunds?.length"
                    link
                    @click="showEditDialog(item)"
                  >
                    <v-list-item-title>
                      <v-btn
                        text
                        color="primary"
                        :loading="loading"
                        :disabled="loading"
                      >
                        <v-icon left>mdi-pencil</v-icon> Modifier le BL
                      </v-btn>
                    </v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </div>
          </template>
        </v-data-table>
      </v-card>
    </v-col>
    <!-- Dialogs -->
    <v-dialog
      fullscreen
      transition="dialog-bottom-transition"
      v-model="invoiceGroupDialog"
    >
      <v-card>
        <InvoiceGroup
          v-if="invoiceGroupDialog"
          :sale="selectedInvoice"
          :clientInformation="clientInformation"
          :sellerInformation="sellerInformation"
          v-on:closed="invoiceGroupDialog = false"
        ></InvoiceGroup>
      </v-card>
    </v-dialog>
    <v-dialog
      fullscreen
      transition="dialog-bottom-transition"
      v-model="deliveryFormDialog"
    >
      <v-card>
        <DeliveryForm
          v-if="deliveryFormDialog"
          :sale="selectedDeliveryForm"
          :clientInformation="clientInformation"
          :sellerInformation="sellerInformation"
          v-on:closed="deliveryFormDialog = false"
        ></DeliveryForm>
      </v-card>
    </v-dialog>
    <v-dialog
      fullscreen
      transition="dialog-bottom-transition"
      v-model="refundDialog"
    >
      <v-card>
        <Refund
          v-if="refundDialog"
          :invoice="selectedInvoice"
          :clientInformation="clientInformation"
          :sellerInformation="sellerInformation"
          v-on:closed="refundDialog = false"
        ></Refund>
      </v-card>
    </v-dialog>
    <!-- Add Product to Quotation Dialog -->
    <v-dialog
      transition="dialog-bottom-transition"
      v-model="addProductDialog"
      max-width="640"
      persistent
    >
      <v-card>
        <v-toolbar class="text-center" color="primary" dark >
          <v-spacer></v-spacer>
          <h2 class="text-uppercase">Ajouter un produit a vente</h2>
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
                @change="getProductInformation(editedSaleProduct.productId)"
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
            <!-- Buy Price -->
            <v-col lg="6" sm="12">
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
                :rules="quantityRules"
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
    <!-- Payments Dialog -->
    <v-dialog
      persistent
      fullscreen
      transition="dialog-bottom-transition"
      v-model="paymentsDialog"
    >
      <v-card tile>
        <v-toolbar
          dark
          color="primary"
        >
          <!-- Close Dialog Button -->
          <v-btn
            icon
            dark
            @click="paymentsDialog = false"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
          <v-spacer></v-spacer>
          <v-toolbar-title>Gestion des paiements pour BL N°{{paymentsSale.count}}</v-toolbar-title>
          <v-spacer></v-spacer>
        </v-toolbar>
        <v-card-text class="mt-5">
          <h2 class="text-uppercase text-center my-2">
            Liste des paiements pour le bon de livraison N°{{paymentsSale.count}}
          </h2>
          <!--  -->
          <v-btn
            tile
            color="success"
            @click="showPaymentForm()"
          >
            Ajouter un nouveau paiement
            <v-icon right>fa-cash-register</v-icon>
          </v-btn>
          <v-simple-table
            dense
            class="mt-5"
          >
          <template v-if="payments.length > 0">
            <thead>
              <tr>
                <th>Date</th>
                <th>Montant</th>
                <th>Methode de paiment</th>
                <th>Référence</th>
                <th>Documents</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(payment, index) in payments"
                :key="'paymentsTable' + index"
              >
                <td>{{ payment.date | formatDate }}</td>
                <td>{{ payment.amount | formatPrice }}</td>
                <td>{{ payment.paymentMethod | formatPaymentMethod }}</td>
                <td>{{ payment.description ?? '---' }}</td>
                <td>
                  <v-btn
                    v-if="payment.documents?.length > 0"
                    color="primary"
                    x-small
                  >
                    Télécharger <v-icon right>mdi-download</v-icon>
                  </v-btn>
                </td>
                <td>
                  <v-btn
                    color="primary"
                    @click="editPayment(payment)"
                    x-small
                    icon
                    dark
                  >
                    <v-icon>mdi-pencil</v-icon>
                  </v-btn>
                </td>
              </tr>
            </tbody>
          </template>
          <template v-else>
            <thead>
              <tr>
                <th>Montant</th>
                <th>Methode de paiment</th>
                <th>Référence</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              <td colspan="5">
                <v-alert
                  class="white--text text-center"
                  color="warning darken-1"
                  border="bottom"
                  dense
                  tile
                  icon="fa-triangle-exclamation"
                >
                  Aucun paiement n'a été effectué pour ce bon de livraison
                </v-alert>
              </td>
            </tbody>
          </template>
          </v-simple-table>
        </v-card-text>
      </v-card>
    </v-dialog>
    <!-- Payment Form -->
    <v-dialog
      transition="dialog-bottom-transition"
      v-model="showPaymentDialog"
      max-width="640"
      persistent
    >
    <v-card>
        <v-toolbar class="text-center" color="primary" dark >
          <v-spacer></v-spacer>
          <h2 class="text-uppercase">Ajouter un paiment a BL N°{{paymentsSale.count}}</h2>
          <v-spacer></v-spacer>
        </v-toolbar>
        <v-card-text class="my-5 py-5">
          <v-row justify-sm="center">
            <!-- Payment Method Input -->
            <v-col lg="6" sm="12">
              <v-autocomplete
                label="Methode de paiment"
                v-model="selectedPayment.paymentMethod"
                :items="paymentMethods"
                item-text="name"
                item-value="value"
              ></v-autocomplete>
            </v-col>
            <!-- Payment Amount Input -->
            <v-col lg="6" sm="12">
              <v-text-field
                label="Montant"
                v-model="selectedPayment.amount"
                type="number"
              ></v-text-field>
            </v-col>
            <!-- Reference or Description input -->
            <v-col lg="6" sm="12">
              <v-text-field
                label="Référence"
                v-model="selectedPayment.description"
              ></v-text-field>
            </v-col>
            <!-- Date of payment input -->
            <v-col lg="6" sm="12">
              <DatePicker label="Date de paiment" v-model="selectedPayment.date" :value="selectedPayment.date"></DatePicker>
            </v-col>
            <!-- Upload files -->
            <v-col lg="11" sm="12">
              <v-file-input
                ref="fileInput"
                v-model="files"
                label="Drag and drop files or click to browse"
                accept=".pdf, .doc, .docx, .xls, .xlsx, .png, .jpg, .jpeg"
                outlined
                multiple
                show-size
                small-chips
              >
                <template v-slot:prepend>
                  <v-icon>
                    mdi-upload
                  </v-icon>
                </template>
              </v-file-input>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn
            color="error"
            tile
            @click="closePaymentDialog()"
          >
            Fermer
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            tile
            @click="createPayment()"
          >
            Effectuer
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!-- Edit DeliveryForm Dialog -->
    <v-dialog
      persistent
      fullscreen
      transition="dialog-bottom-transition"
      v-model="editDialog"
    >
    <v-card tile>
        <v-toolbar
          dark
          color="primary"
        >
          <!-- Close Dialog Button -->
          <v-btn
            icon
            dark
            @click="editDialog = false"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
          <v-spacer></v-spacer>
          <v-toolbar-title>Modifier BL N°{{editedDeliveryForm.count}}</v-toolbar-title>
          <v-spacer></v-spacer>
        </v-toolbar>
        <v-card-text class="mt-5">
          <EditForm :deliveryForm="editedDeliveryForm"/>
        </v-card-text>
      </v-card>
    </v-dialog>
    <!-- Dialog Refund -->
    <v-dialog
      persistent
      fullscreen
      transition="dialog-bottom-transition"
      v-model="dialogRefundWizard"
    >
      <v-card tile>
        <v-toolbar
          dark
          color="primary"
        >
          <v-btn
            v-if="refundByProduct || refundBySale"
            icon
            dark
            @click="() => { refundByProduct = refundBySale = false }"
          >
            <v-icon>mdi-arrow-left</v-icon>
          </v-btn>
          <v-spacer></v-spacer>
          <h4>Assistant de l'avoir pour la facture N°: {{selectedInvoice.count}}</h4>
          <v-toolbar-title></v-toolbar-title>
          <v-spacer></v-spacer>
          <!-- Close Dialog Button -->
          <v-btn
            icon
            dark
            @click="dialogRefundWizard = false"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar>
        <v-card-text class="mt-5">
          <v-overlay :value="refundOverLayed"></v-overlay>
          <!-- Choose Here -->
          <v-container v-if="!refundByProduct && !refundBySale">
            <v-row justify="center">
              <!-- Refund full invoice -->
              <v-col cols="4">
                <div class="text-center">
                  <p>
                    En cliquant sur le bouton ci-dessous, vous créez un remboursement complet pour la facture numéro {{ selectedInvoice.count }}
                  </p>
                  <v-btn :loading="refundOverLayed" @click="issueRefundForInvoice(selectedInvoice)" color="primary">Avoir complète (N# {{ selectedInvoice.count }})</v-btn>
                </div>
              </v-col>
              <v-col cols="4">
                <div class="text-center">
                  <p>
                    Pour faire une avoir partiellement pour la facture #{{ selectedInvoice.count }} par les ventes, cliquez sur le bouton ci-dessous et sélectionnez les formulaires de vente ou de livraison que vous souhaitez faire l'avoir.
                  </p>
                  <v-btn color="primary">Avoir Par BL/Vente (N# {{ selectedInvoice.count }})</v-btn>
                </div>
              </v-col>
              <v-col cols="4">
                <div class="text-center">
                  <p>
                    Pour émettre un avoir basé sur les produits pour la facture #{{ selectedInvoice.count }}, cliquez sur le bouton ci-dessous.
                  </p>
                  <v-btn @click="refundByProduct = true" color="primary">Avoir Par Produits (N# {{ selectedInvoice.count }})</v-btn>
                </div>
              </v-col>
            </v-row>
          </v-container>
          <!-- Refund Wizard Here -->
          <RefundWizard
            v-if="refundByProduct || refundBySale"
            :Invoice="selectedInvoice"
            v-on:closed="dialogRefundWizard = false"
          />
        </v-card-text>
      </v-card>
    </v-dialog>
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
  </v-row>
</template>
<script>
import DatePicker from "../../components/DatePicker.vue";
import InvoiceGroup from '../../components/sales/Invoice.vue'
import DeliveryForm from "../../components/sales/DeliveryForm.vue";
import Refund from "../../components/sales/refund/Invoice.vue";
import EditForm from "@/components/sales/EditDeliveryForm.vue";
import RefundWizard from "@/components/sales/refund/Wizard.vue";
import Vue from 'vue';
export default {
  components: { DatePicker, InvoiceGroup, DeliveryForm, Refund, EditForm, RefundWizard },
  data: () => {
    return {
      refundOverLayed: false,
      selectedProduct: {},
      dialogRefundWizard: false,
      refundByProduct: false,
      refundBySale: false,
      refundDialog: false,
      files: [],
      loadingDialog: false,
      clients: [],
      loadingData: false,
      editedSaleProductIndex: -1,
      sellMethods: [
        { name: 'Gros', value: 'wholesale_price' },
        { name: 'Detail', value: 'retail_price' },
      ],
      selectedSellMethod: 'wholesale_price',
      paymentMethods: [
        { name: 'Effet', value: 'PromissoryNote' },
        { name: 'Virement', value: 'BankTransfer' },
        { name: 'Chèque', value: 'Check' },
        { name: 'Espèces', value: 'Cash' },
      ],
      editedSaleProduct: {},
      editedDeliveryForm: {},
      products: [],
      addProductDialog: false,
      saleProducts: [],
      discountPercent: 0.00,
      discount: 0.00,
      selectedItem: {},
      selectedDeliveryForm: {},
      deliveryFormDialog: false,
      selectedInvoice: {},
      loading: false,
      sellerInformation: {},
      clientInformation: {},
      invoiceGroupDialog: false,
      selectedDeliveryForms: [],
      selectedConcern: -1,
      selectedStatus: -1,
      selectedStartDate: null,
      selectedEndDate: null,
      concerns: [],
      purchaseOrderListTitle: "List des bons de livraison",
      deliveryForms: [],
      invoices: [],
      columns: [
        { text: "#", value: "saleId", align: "start" },
        { text: "N° F", value: "invoice.count", align: "start" },
        { text: "Client", value: "client", align: "center" },
        { text: "Status", value: "status", align: "center" },
        { text: "Total HT", value: "sale.totalAmountDutyFree" },
        { text: "TVA", value: "sale.totalAmountInVAT" },
        { text: "Total TTC", value: "sale.totalAmount" },
        { text: "Total Impayé", value: "sale.totalUnPaidAmount" },
        { text: "Actions", value: "actions", sortable: false },
      ],
      payments: [],
      paymentsSale: {},
      showPaymentDialog: false,
      selectedPayment: {},
      paymentsDialog: false,
      editDialog: false,
    };
  },
  watch: {
    dialogRefundWizard(newValue) {
      !newValue && (
        this.selectedInvoice = Object.assign({}, {}),
        this.refundByProduct = false,
        this.refundBySale = false,
        this.loadItems()
      );
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
    addProductDialog() {
      if ( !this.addProductDialog )
        this.editedSaleProduct = {}
    },
    selectedConcern() {
      this.getDeliveryForms();
    },
    selectedStartDate() {
      this.getDeliveryForms();
    },
    selectedEndDate() {
      this.getDeliveryForms();
    },
  },
  computed: {
    totalUnPaidAmount() {
      return this.deliveryForms.reduce((acc, deliveryForm) => acc + parseFloat(deliveryForm.sale?.totalUnPaidAmount), 0);
    },
    totalAmount() {
      return this.deliveryForms.reduce((acc, deliveryForm) => acc + parseFloat(deliveryForm.sale?.totalAmountInVAT) + parseFloat(deliveryForm.sale?.totalAmountDutyFree), 0);
    },
    totalPaid() {
      return this.totalAmount - this.totalUnPaidAmount;
    },
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
        total += parseFloat(saleProduct.price) * parseFloat(saleProduct.quantity)
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
    showCreateOrUpdateCard() {
      return this.selectedItem.id
    },
    showCreateOrUpdateCardText() {
      return (this.showCreateOrUpdateCard < 0) ? `Nouveau BL`:`Modification de BL #${this.selectedItem?.id}`;
    },
    deliveryFormsFiltered() {
      if ( this.selectedStatus == 1 )
        return this.deliveryForms.filter(delivery => delivery.invoice?.id > 0)
      else if ( this.selectedStatus == 2 )
        return this.deliveryForms.filter(delivery => !delivery.invoice?.id)
      return this.deliveryForms;
    },
    quantityRules() {
      return [
        (v) => (!v || v <= this.selectedProduct?.quantity) || `Devrait être inférieur ou égal à ${this.selectedProduct?.quantity}`,
      ];
    }
  },
  methods: {
    async issueRefundForInvoice(selectedInvoice) {
      const confirmationStatus = await this.$swal({
        title: `Confirmer la création de l'avoir`,
        text: `Êtes-vous sûr de vouloir créer une avoir pour la facture n° ${selectedInvoice.count}? Cette action ne pourra pas être annulée.`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: `Oui, créer l'avoir`,
        cancelButtonText: "Annuler",
      });
      if( !confirmationStatus.isConfirmed ) return;
      this.refundOverLayed = true;
      const response = await this.axios.post(`${process.env.VUE_APP_API_URL}/sale/invoice/${selectedInvoice.id}/refund`)
        .catch((err) => { console.log(err.response.data); this.refundOverLayed = false; })
      this.refundOverLayed = false;
      if ( response.status == 200 )
        return ( this.$swal( "L'avoir a été créé", `L'avoir a été créée avec succès`, 'success' ), this.dialogRefundWizard = false );
      return this.$swal( '500 Erreur de serveur!', `Erreur de serveur`, 'warning' );
    },
    async getProductInformation(productId) {
      if ( !productId ) return 0;
      const product = (await this.axios.get(`${process.env.VUE_APP_API_URL}/movements/${productId}`)).data
      product.quantity = product.in - product.out;
      return this.selectedProduct = product;
    },
    showRefundWizard(deliveryForm) {
      this.selectedInvoice = deliveryForm.invoice;
      this.dialogRefundWizard = true;
      console.log(deliveryForm);
    },
    showEditDialog(item) {
      this.editDialog = true;
      this.editedDeliveryForm = item;
    },
    createPayment() {
      if ( this.selectedPayment?.amount <= 0 )
        return this.$swal( 'Montant non valide!', `Veuillez entrer un montant positif`, 'warning' );
      if ( Vue.filter('formatPaymentMethod')(this.selectedPayment?.paymentMethod) ==  this.selectedPayment?.paymentMethod )
        return this.$swal( 'méthode de paiement non valide!', `Veuillez sélectionner une méthode de paiement valide`, 'warning' );
      /** Errors handled */
      this.loadingDialog = true;
      const formData = new FormData();
      for (let i = 0; i < this.files.length; i++) {
        const file = this.files[i];
        formData.append('file', file);
      }
      for (const key in this.selectedPayment) {
        formData.append(key, this.selectedPayment[key]);
      }
      var method = `POST`
      var url = `${process.env.VUE_APP_API_URL}/sale/deliveryForm/${this.paymentsSale.deliveryForms[0].id}/payment`;
      if ( this.selectedPayment.id > 0) {
        method = `PUT`
        url = `${process.env.VUE_APP_API_URL}/sale/deliveryForm/payment/${this.selectedPayment.id}`
      }
      this.axios({
        url: url,
        method: method,
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      }).then(() => {
        this.$swal({
          title: 'Paiement effectué avec succès',
          text: `Un paiement d'un montant de ${Vue.filter("formatPrice")(this.selectedPayment.amount) } a été effectué pour le bon de livraison N°${this.paymentsSale.count}.`,
          icon: 'success',
          confirmButtonText: 'Ok',
        });
        this.loadingDialog = false;
        this.closePaymentDialog();
        this.loadPayments();
        this.loadItems();
      }).catch((err) => {
        this.$swal({
          title: 'Erreur',
          text: `Une erreur s'est produite. Veuillez réessayer ultérieurement ou contacter l'assistance si le problème persiste`,
          icon: 'error',
          confirmButtonText: 'Ok',
        });
        console.log(err);
        this.loadingDialog = false;
      });
    },
    closePaymentDialog() {
      this.showPaymentDialog = false;
      this.selectedPayment = Object.assign({}, {});
    },
    async showPaymentForm(deliveryForm = null) {
      if ( deliveryForm?.id ) {
        this.loadingDialog = true;
        await this.axios.get(`${process.env.VUE_APP_API_URL}/sale/deliveryForm/${deliveryForm.id}`).then(res => {
          this.paymentsSale = res.data;
        });
        this.loadingDialog = false;
      }
      this.showPaymentDialog = true;
      this.selectedPayment = Object.assign({}, {});
    },
    async editPayment(payment) {
      this.showPaymentDialog = true;
      payment.date = Vue.filter("formatDateForDatePicker")(payment.date)
      this.selectedPayment = Object.assign({}, payment);
    },
    loadPayments() {
      this.loadingDialog = true;
      this.axios.get(`${process.env.VUE_APP_API_URL}/sale/deliveryForm/${this.paymentsSale.deliveryForms[0].id}/payments`).then(res => {
        this.payments = res.data;
        this.loadingDialog = false;
        this.paymentsDialog = true;
      }).catch(() => { this.loadingDialog = false; });
    },
    async showPayments(deliveryForm) {
      this.loadingDialog = true;
      await this.axios.get(`${process.env.VUE_APP_API_URL}/sale/deliveryForm/${deliveryForm.id}`).then(res => {
        this.paymentsSale = res.data;
      });
      this.axios.get(`${process.env.VUE_APP_API_URL}/sale/deliveryForm/${deliveryForm.id}/payments`).then(res => {
        this.payments = res.data;
        this.loadingDialog = false;
        this.paymentsDialog = true;
      }).catch(() => { this.loadingDialog = false; });
      console.log(deliveryForm);
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
    refundSale(item) {
      this.$swal({
        title: 'Êtes-vous sûr?',
        text: "Vous ne pourrez pas revenir en arrière!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Oui, rembourser-le!'
      }).then((result) => {
        if (result.isConfirmed) {
          this.axios({
            method: 'post',
            url: `${process.env.VUE_APP_API_URL}/sale/refund`,
            data: {
              deliveryFormId: item.saleId,
            }
          }).then(() => {
            this.$swal(
              'Rembourser!',
              'Bon de livraison rembourser.',
              'success'
            );
            this.getDeliveryForms()
          }).catch(() => {
            this.$swal(
              'Erreur!',
              "Une erreur s'est produite lors de la remboursement de bon de livraison",
              'error'
            )
          })
        }
      })
    },
    markAsPaidAndShipped() {
      this.axios.put(`${process.env.VUE_APP_API_URL}/paySales`, { data: this.selectedDeliveryForms }).then(() => {
        this.getDeliveryForms();
        this.selectedDeliveryForms = []
      })
    },
    showInvoice(deliveryForm) {
      this.loadingDialog = true;
      this.axios({
        url: `${process.env.VUE_APP_API_URL}/sale/deliveryForm/${deliveryForm.id}/invoice`,
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
        const client = res.data.deliveryForms[0].sale.concern;
        this.clientInformation = {
          name: client.companyName,
          address: client.address,
          zip: client.zip,
          city: client.city,
          ice: client.ice,
          country: "Maroc"
        }
        this.selectedInvoice = res.data
        this.invoiceGroupDialog = true;
        this.loadingDialog = false;
      }).catch((err) => { console.log(err); this.loadingDialog = false; })
    },
    async showRefundInvoice(deliveryForm) {
      this.loading = true;
      try {
        const results = await this.axios.get(`${process.env.VUE_APP_API_URL}/sale/invoice/${deliveryForm.invoiceId}/refunds`);
        if ( results.status != 200 )
          return this.loading = false;
        // Define the seller's information
        this.sellerInformation = {
          name: this.$store.getters.getCompany.name,
          address: this.$store.getters.getCompany.address,
          zip: this.$store.getters.getCompany.zip,
          city: this.$store.getters.getCompany.city,
          country: "Maroc"
        }
        // Define the client's information
        const deliveryFormInformation = (await this.axios.get(`${process.env.VUE_APP_API_URL}/sale/deliveryForm/${deliveryForm.id}`)).data
        const client = deliveryFormInformation.concern;
        this.clientInformation = {
          name: client.companyName,
          address: client.address,
          zip: client.zip,
          city: client.city,
          ice: client.ice,
          country: "Maroc"
        }
        this.selectedInvoice = results.data
        this.refundDialog = true;
        this.loading = false;
      } catch (error) {
        console.log(error);
        this.loading = false;
      }
      // this.axios({
      //   url: `${process.env.VUE_APP_API_URL}/sale/invoice/${deliveryForm.invoiceId}/refunds`,
      //   method: 'GET',
      // }).then((res) => {
      //   this.sellerInformation = {
      //     name: this.$store.getters.getCompany.name,
      //     address: this.$store.getters.getCompany.address,
      //     zip: this.$store.getters.getCompany.zip,
      //     city: this.$store.getters.getCompany.city,
      //     country: "Maroc"
      //   }
      //   const client = deliveryForm.concern;
      //   this.clientInformation = {
      //     name: client.companyName,
      //     address: client.address,
      //     zip: client.zip,
      //     city: client.city,
      //     ice: client.ice,
      //     country: "Maroc"
      //   }
      //   this.selectedDeliveryForm = res.data
      //   this.refundDialog = true;
      //   this.loading = false;
      // }).catch((err) => { console.log(err); this.loading = false; })
    },
    showDeliveryForm(deliveryForm) {
      this.loading = true;
      this.axios({
        url: `${process.env.VUE_APP_API_URL}/sale/deliveryForm/${deliveryForm.id}`,
        method: 'GET',
      }).then((res) => {
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
        this.selectedDeliveryForm = res.data
        this.deliveryFormDialog = true;
        this.loading = false;
      }).catch((err) => { console.log(err); this.loading = false; })
    },
    async createOneInvoice(deliveryForm) {
      const userConfirmation = await this.$swal({
        title: 'Confirmer la création de la facture',
        text: `Êtes-vous sûr de vouloir créer une facture pour le formulaire de livraison n° ${deliveryForm.id}? Cette action ne pourra pas être annulée.`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Oui, créer la facture',
        cancelButtonText: "Annuler",
      });

      if ( userConfirmation.isConfirmed ) {
        this.loadingDialog = true;
        let deliveries = [];
        deliveries.push(deliveryForm.id);
        this.axios({
          url: `${process.env.VUE_APP_API_URL}/sale/deliveryForm/invoice`,
          method: 'POST',
          data: {
            deliveries: deliveries,
          }
        }).then(() => {
          this.$swal({
            title: 'Facture créée avec succès',
            text: `La facture pour le bon de livraison n° ${deliveryForm.id} a été créée avec succès.`,
            icon: 'success',
            confirmButtonText: 'Ok',
          });
          this.loadingDialog = false;
          this.getDeliveryForms();
        }).catch((err) => {
          console.log(err);
          this.loadingDialog = false;
        });
      }
    },
    async createInvoice() {
      if ( this.selectedDeliveryForms.length < 0 ) {
        this.loading = false;
        return this.$swal(
          'Aucun bon de livraison sélectionné!',
          `Vous devez choisir au moins un bon de livraison`,
          'warning'
        )
      }
      for (const deliveryForm of this.selectedDeliveryForms) {
        if ( deliveryForm.invoice?.id ) {
          this.loading = false;
          return this.$swal(
            'Un ou plusieurs B.L ont déjà été facturés!',
            `Un ou plusieurs bons de livraison ont déjà été facturés, veuillez vous assurer d'avoir sélectionné uniquement des bons de livraison non facturés`,
            'warning'
          )
        }
      }
      for (const deliveryForm of this.selectedDeliveryForms) {
        if ( this.selectedDeliveryForms[0].sale.concernId != deliveryForm.sale.concernId ) {
          this.loading = false;
          return this.$swal(
            'L\'action ne peut pas être effectuée sur différents clients!',
            `Vous ne pouvez pas faire une facture pour deux clients différents.`,
            'warning'
          )
        }
      }
      const userConfirmation = await this.$swal({
        title: 'Confirmer la création de la facture',
        text: `Êtes-vous sûr de vouloir créer une facture pour les formulaires de livraison sélectionné? Cette action ne pourra pas être annulée.`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Oui, créer la facture',
        cancelButtonText: "Annuler",
      });
      if ( !userConfirmation.isConfirmed )
        return;
      // Confirmed
      this.loadingDialog = true;
      let deliveries = [];
      for (const deliveryForm of this.selectedDeliveryForms) {
        deliveries.push(deliveryForm.id)
      }
      this.axios({
        url: `${process.env.VUE_APP_API_URL}/sale/deliveryForm/invoice`,
        method: 'POST',
        data: {
          deliveries: deliveries,
        }
      }).then(() => {
        this.getDeliveryForms();
        this.loadingDialog = false;
      }).catch((err) => { console.log(err); this.loadingDialog = false; });
    },
    getStatusColor(delivery) {
      // if (delivery.refunds.length > 0)
      //   return "warning";
      if (delivery.invoice?.id)
        return "success";
      else
        return "primary";
    },
    getStatusText(delivery) {
      // if (delivery.refunds.length > 0)
      //   return "Retour";
      if (delivery.invoice?.id)
        return "Facturé";
      else
        return "Non Facturé";
    },
    getDeliveryForms() {
      this.loadingData = true;
      const searchQuery = {};
      if ( this.selectedConcern > 0 )
        searchQuery.concern = this.selectedConcern;
      if ( this.selectedEndDate )
        searchQuery.endDate = this.selectedEndDate;
      if ( this.selectedStartDate )
        searchQuery.startDate = this.selectedStartDate;
      this.axios.get(`${process.env.VUE_APP_API_URL}/sale/deliveryForms`, { params: searchQuery }).then(res => {
        this.deliveryForms = res.data;
        this.loadingData = false;
      }).catch(() => { this.loadingData = false; });
    },
    getInvoices() {
      this.axios.get(`${process.env.VUE_APP_API_URL}/invoices`).then(res => {
        this.invoices = res.data;
      });
    },
    getClients() {
      this.axios.get(`${process.env.VUE_APP_API_URL}/concerns?type=Client`).then(res => {
        this.clients = Object.assign([], res.data);
        this.concerns = res.data;
        this.concerns.unshift({ companyName: 'Tous', id: -1 })
      });
    },
    showCreateCard() {
      this.selectedItem = {
        id: -1,
        vat: 20,
        shipped: 1
      };
    },
    async createOrUpdate() {
      this.loading = true;
      /** data to send through the request */
      // const { id } = this.selectedItem;
      /** Method will be put or create */
      const method = 'POST'
      /** URL changes depends if your modifying or creating a new record */
      const url = `${process.env.VUE_APP_API_URL}/sale/quotation`;
      let createOrUpdateData = {};
      let productOutOfStock = false;
      for (const saleProduct of this.saleProducts) {
        const productQuantity = this.products.find(p => p.id == saleProduct.productId ).quantity;
        if ( productQuantity < saleProduct.quantity ) {
          productOutOfStock = true;
        }
      }
      for (const key in this.selectedItem) {
        createOrUpdateData[key] =  this.selectedItem[key];
      }
      createOrUpdateData['products'] = this.saleProducts;
      createOrUpdateData['discount'] = this.discount;
      if ( productOutOfStock ) {
        await this.$swal({
          title: 'Rupture de stock!',
          text: "Il semble que vous soyez en rupture de stock, confirmez-vous que vous ignorez les alertes de stock et que vous continuez à créer le bon de livraison ?",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Oui',
          cancelButtonText: "Non, abandonner l'opération",
        }).then((result) => {
          if (result.isConfirmed) {
            createOrUpdateData.forceCreate = true;
          }
        });
        if ( !createOrUpdateData.forceCreate )
          return this.loading = false;
        /** Now send the request */
        this.axios({
          url: url,
          method: method,
          data: createOrUpdateData
        }).then(async (res) => {
          this.transferToDeliveryForm(res.data);
          // this.resetAll();
          // this.loadItems();
          // this.$swal(
          //   'Succès!',
          //   'Les modifications ont été effectuées avec succès.',
          //   'success'
          // )
          this.loading = false;
        }).catch(err => {
          this.$swal(
            'Champs obligatoires manquants!',
            'Assurez-vous de remplir toutes les entrées obligatoires avant de soumettre votre demande.',
            'warning'
          )
          this.loading = false;
          console.log(err);
        });
      } else {
        this.axios({
          url: url,
          method: method,
          data: createOrUpdateData
        }).then(async (res) => {
          this.transferToDeliveryForm(res.data);
          // this.createDeliveryForm(createOrUpdateData.forceCreate, res.data.id);
          // this.resetAll();
          // this.loadItems();
          // this.$swal(
          //   'Succès!',
          //   'Les modifications ont été effectuées avec succès.',
          //   'success'
          // )
          this.loading = false;
        }).catch(err => {
          this.$swal(
            'Champs obligatoires manquants!',
            'Assurez-vous de remplir toutes les entrées obligatoires avant de soumettre votre demande.',
            'warning'
          )
          this.loading = false;
          console.log(err);
        });
      }
    },
    resetAll() {
      this.selectedItem = { id: 0 }
      this.discount = 0
      this.discountPercent = 0
    },
    showEditCard(item) {
      this.selectedItem = item;
      this.saleProducts = item.saleProducts
      this.discount = item.discount
      this.discountChanged(item.discount)
    },
    editProduct(product) {
      this.editedSaleProductIndex = this.saleProducts.indexOf(product);
      this.editedSaleProduct = product;
      this.addProductDialog = true
    },
    removeProduct(product) {
      const indexOfProduct = this.saleProducts.indexOf(product)
      this.saleProducts.splice(indexOfProduct, 1)
    },
    closeAddProductDialog() {
      this.editedSaleProduct = {}
      this.editedSaleProductIndex = -1;
      this.addProductDialog = false
    },
    addProduct() {
      if (!this.editedSaleProduct.productId) {
        return this.$swal(
          'Champs Obligatoires Manquants!',
          'Veuillez sélectionner un produit.',
          'warning'
        )
      }
      if (!this.editedSaleProduct.quantity || this.editedSaleProduct.quantity < 1) {
        return this.$swal(
          'Champs Obligatoires Manquants!',
          'La quantité est manquante ou a une entrée négative.',
          'warning'
        )
      }
      this.editedSaleProduct.priceType = this.selectedSellMethod;
      this.editedSaleProduct.discount = 0;
      this.editedSaleProduct.type = this.selectedSellMethod;
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
      const url = `${process.env.VUE_APP_API_URL}/sale/quotation/${quotation.id}/deliveryForm`;
      const data = {
        forceCreate: forceCreate,
        saleId: quotation.id,
      }
      this.axios({
        url: url,
        method: method,
        data: data
      }).then(async () => {
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
    createDeliveryForm(forceCreate, saleId) {
      const method = 'post';
      const url = `${process.env.VUE_APP_API_URL}/sale/deliveryForm/`;
      const data = {
        forceCreate: forceCreate,
        saleId: saleId,
      }
      this.axios({
          url: url,
          method: method,
          data: data
        }).then(async () => {
          // this.createDeliveryForm(forceCreate, res.data.id);
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
    loadItems() {
      this.getDeliveryForms();
      // this.axios.get(`${process.env.VUE_APP_API_URL}/sale/deliveryForms`).then(res => {
      //   this.items = res.data;
      // });
      this.axios.get(`${process.env.VUE_APP_API_URL}/products`).then(res => {
        this.products = res.data;
      });
    },
  },
  created() {
    this.getClients();
  },
  mounted() {
    this.loadItems();
  }
}
</script>
