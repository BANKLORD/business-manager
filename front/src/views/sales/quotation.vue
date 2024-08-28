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
                    <v-col class="text-right" cols="6" v-if="computedCompanyIndustryType === 'RETAIL'">
                      <v-btn
                          tile
                          color="success"
                          @click="addProductDialog = true"
                      >
                        <v-icon left>mdi-plus</v-icon>
                        Ajouter un nouvel article (Produit)
                      </v-btn>
                    </v-col>

                    <v-col class="text-right" cols="6" v-if="computedCompanyIndustryType === 'SERVICE'">
                      <v-btn
                          tile
                          color="success"
                          @click="addServiceDialog = true"
                      >
                        <v-icon left>mdi-plus</v-icon>
                        Ajouter un nouvel article (Service)
                      </v-btn>
                    </v-col>
                  </v-row>
                  <SaleProductsPresentationTable
                      v-if="computedCompanyIndustryType === 'RETAIL'"
                      :saleProducts="saleProducts"
                      :products="products"
                      :editProduct="editProduct"
                      :removeProduct="removeProduct"
                  />
                  <SaleServicesPresentationTable
                      v-if="computedCompanyIndustryType === 'SERVICE'"
                      :saleServices="saleServices"
                      :services="services"
                      :editService="editSaleService"
                      :removeService="removeSaleService"
                      :totalPrice="calcTotalSaleService"
                  />
                </v-col>
              </v-row>
              <!-- In this table you will show the useless information  -->
              <v-divider class="my-5"></v-divider>
              <v-row justify-sm="center">
                <v-simple-table dark class="max-width-320 mx-3">
                  <tbody style="width:320px">
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
    <!-- List -->
    <v-row class="text-center" justify-sm="center" max-width="1444px">
      <v-card>
        <v-toolbar
            flat
            color="primary"
            dark
        >
          <v-spacer></v-spacer>
          <v-toolbar-title class="text-center"> Management des devis </v-toolbar-title>
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
                  v-if="$store.getters.hasPerm('concern-create')"
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
                        <v-icon left>fas fa-receipt</v-icon> Afficher le devis
                      </v-btn>
                    </v-list-item-title>
                  </v-list-item>
                  <v-list-item class="d-block" link @click="showTransferToPurchaseOrderDialog(item)">
                    <v-list-item-title>
                      <v-btn
                          text
                          color="primary"
                          :loading="loading"
                          :disabled="loading"
                      >
                        <v-icon left>fas fa-cart-shopping</v-icon> Crée un bon de commande
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
    <!--     Add Product to Quotation Dialog -->
    <CreateOrModifySaleProductDialog
        :editedSaleProduct="editedSaleProduct"
        :addProductDialog="addProductDialog"
        :isAdd="editedSaleProductIndex<0"
        :products="filterUsedProducts(saleProducts, editedSaleProduct)"
        :isMethod="true"
        :sellMethods="sellMethods"
        :selectedSellMethod="selectedSellMethod"
        :priceChanged="priceChanged"
        :closeAddProductDialog="closeAddProductDialog"
        :addProduct="addProduct"
        :editedSaleProductIndex="editedSaleProductIndex"
    >
      <template v-slot:ttc>
        <v-text-field
            readonly
            disabled
            label="Prix TTC"
            v-model="computedProductPriceIncTVA"
            type="text"
        ></v-text-field>
      </template>
      <template v-slot:margin>
        <v-text-field
            @change="profitMarginChanged"
            label="Marge bénéficiaire"
            v-model="editedSaleProduct.profit_margin"
            append-icon="fas fa-percent"
            type="number"
        ></v-text-field>
      </template>
    </CreateOrModifySaleProductDialog>
    <!--    Add Service to Quotation Dialog-->
    <v-dialog
        transition="dialog-bottom-transition"
        v-model="addServiceDialog"
        max-width="1225"
        persistent
    >
      <AddServiceStepper :pSteps="serviceStepperSteps" @sale-service-closed="handleSaleServiceClosed" @sale-service-completed="addSaleService">
        <template v-slot:1>
          <v-card elevation="0">
            <v-card-text class="my-5 py-5 text-center" >
              <v-row justify-sm="center font-weight-bold">
                <!-- service -->
                <v-col class="mb-4" lg="12">
                  <v-autocomplete
                      label="Service"
                      v-model="editedSaleService.serviceId"
                      :items="filterUsedServices(saleServices, editedSaleService)"
                      item-text="name"
                      item-value="id"
                  ></v-autocomplete>
                </v-col>
<!--                quantity-->
                <v-col class="mb-4" cols="12">
                  <v-text-field
                      v-if="services.find(s => s.id === editedSaleService.serviceId)"
                      label="Quantity"
                      v-model="editedSaleService.quantity"
                      type="number"
                  ></v-text-field>
                </v-col>
                <!-- base Price -->
                <v-col class="mb-4" cols="12">
                  <v-text-field
                      v-if="services.find(s => s.id === editedSaleService.serviceId)"
                      readonly
                      disabled
                      label="Prix de base"
                      v-model="services.find(s => s.id === editedSaleService.serviceId).sell_price"
                      type="number"
                  ></v-text-field>
                </v-col>
                <!--                sell price-->
                <v-col class="mb-4" cols="12">
                  <v-text-field
                      v-if="$store.getters.hasPerm('sale-update-sell-price') && services.find(s => s.id === editedSaleService.serviceId)"
                      label="Prix de vente"
                      v-model="editedSaleService.price"
                      type="number"
                  ></v-text-field>
                  <v-text-field
                      v-else
                      readonly
                      disabled
                      label="Prix de vente"
                      v-model="editedSaleService.price"
                      type="number"
                  ></v-text-field>
                </v-col>
                <!--                TVA price-->
                <v-col class="mb-4" lg="12">
                  <v-text-field
                      readonly
                      disabled
                      label="Prix TTC"
                      v-model="computedServicePriceIncTVA"
                      type="text"
                  ></v-text-field>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </template>
        <template v-slot:2>
          <v-row :class="!editedSaleService.serviceId ? '':'mb-6'">
            <v-col class="text-center" cols="12">
              <v-btn
                  tile
                  color="success"
                  @click="addProductToServiceDialog = true"
                  :disabled="!editedSaleService.serviceId"
              >
                <v-icon left>mdi-plus</v-icon>
                Ajouter un nouvel article (Produit)
              </v-btn>
            </v-col>
            <v-col class="text-center mb-6" v-show="!editedSaleService.serviceId">
              <p class="red" style="color: #FFFFFF;">aucun service n'a été sélectionné</p>
            </v-col>
          </v-row>
          <CreateOrModifySaleProductDialog
              :editedSaleProduct="editedSaleServiceProduct"
              :addProductDialog="addProductToServiceDialog"
              :isAdd="editedSaleServiceProductIndex<0"
              :products="filterUsedProducts(editedSaleService.saleServiceProducts, editedSaleServiceProduct)"
              :isMethod="false"
              :priceChanged="()=>{}"
              :closeAddProductDialog="closeAddProductToServiceDialog"
              :addProduct="addProductToService"
              :editedSaleProductIndex="editedSaleServiceProductIndex"
          >
            <template v-slot:ttc>
              <v-text-field
                  readonly
                  disabled
                  label="Prix TTC"
                  v-model="computedProductServicePriceIncTVA"
                  type="text"
              ></v-text-field>
            </template>
            <template v-slot:margin>
              <v-text-field
                  @change="profitMarginProductServiceChanged"
                  label="Marge bénéficiaire"
                  v-model="computedProductServiceMargin"
                  append-icon="fas fa-percent"
                  type="number"
              ></v-text-field>
            </template>
          </CreateOrModifySaleProductDialog>
          <SaleProductsPresentationTable
              :saleProducts="editedSaleService.saleServiceProducts"
              :products="products"
              :editProduct="editSaleServiceProduct"
              :removeProduct="removeSaleProductFromService"
          />
        </template>
        <template v-slot:3>
          <v-row :class="!editedSaleService.serviceId ? '':'mb-6'">
            <v-col class="text-center" cols="12">
              <v-btn
                  tile
                  color="success"
                  @click="addServiceToServiceDialog = true"
                  :disabled="!editedSaleService.serviceId"
              >
                <v-icon left>mdi-plus</v-icon>
                Ajouter un nouvel article (Service)
              </v-btn>
            </v-col>
            <v-col class="text-center mb-6" v-show="!editedSaleService.serviceId">
              <p class="red" style="color: #FFFFFF;">aucun service n'a été sélectionné</p>
            </v-col>
          </v-row>
          <CreateOrModifySaleServiceDialog
              :editedSaleService="editedSaleServiceService"
              :addServiceDialog="addServiceToServiceDialog"
              :isAdd="editedSaleServiceServiceIndex<0"
              :services="filterUsedServices(editedSaleService.saleServiceServices, editedSaleServiceService)"
              :closeAddServiceDialog="closeAddServiceToServiceDialog"
              :addService="addServiceToService"
              :editedSaleServiceIndex="editedSaleServiceServiceIndex"
          >
            <template v-slot:ttc>
              <v-text-field
                  readonly
                  disabled
                  label="Prix TTC"
                  v-model="computedServiceServicePriceIncTVA"
                  type="text"
              ></v-text-field>
            </template>
          </CreateOrModifySaleServiceDialog>
          <SaleServicesPresentationTable
              :saleServices="editedSaleService.saleServiceServices"
              :services="services"
              :editService="editSaleServiceService"
              :removeService="removeSaleServiceFromService"
              :totalPrice="(service)=>service.price"
          />
        </template>
        <template v-slot:4>
          <v-card>
            <v-card-title>
              <h1 class="text-h1">Le relevé</h1>
            </v-card-title>
            <v-card-text class="purchase-summary" v-if="editedSaleService.serviceId">
              <v-simple-table>
                <template>
                  <tbody>
                  <tr>
                    <td>
                      <h1>Service {{ services.find(s => s.id === editedSaleService.serviceId).name }}</h1>
                    </td>
                    <td class="text-right">
                      <h1>{{ editedSaleService.price }} ({{editedSaleService.quantity}})</h1>
                    </td>
                  </tr>
                  <tr>
                    <td colspan="2">
                      <h2>Services supplémentaires:</h2>
                    </td>
                  </tr>
                  <tr v-for="ser in editedSaleService.saleServiceServices" :key="'saleservice' + ser.serviceId">
                    <td>
                      <h4>Service {{ services.find(s => s.id === ser.serviceId).name }}</h4>
                    </td>
                    <td class="text-right">
                      <h4>{{ ser.price }} ({{ ser.quantity }})</h4>
                    </td>
                  </tr>
                  <tr>
                    <td colspan="2">
                      <h2>Produits supplémentaires:</h2>
                    </td>
                  </tr>
                  <tr v-for="prod in editedSaleService.saleServiceProducts" :key="'saleproduct' + prod.productId">
                    <td>
                      <h4>{{ products.find(p => p.id === prod.productId).productCodes[0].code }}</h4>
                    </td>
                    <td class="text-right">
                      <h4>{{ prod.price }} ({{ prod.quantity }})</h4>
                    </td>
                  </tr>
                  </tbody>
                </template>
              </v-simple-table>
            </v-card-text>
            <v-simple-table>
              <template>
                <tbody>
                <tr>
                  <td>
                    <h1>Total: </h1>
                  </td>
                  <td class="text-right">
                    <h1>{{ calcTotalSaleService(editedSaleService) || 0 }}</h1>
                  </td>
                </tr>
                </tbody>
              </template>
            </v-simple-table>
          </v-card>
        </template>
      </AddServiceStepper>
    </v-dialog>
    <!-- Quotation Dialog -->
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
    <!-- List of products -->
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
            Affichage de la liste des produits pour le devis N°{{ selectedQuotation.id }}
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
                Pour créer un bon de commande pour le devis sélectionné <b>(#{{ purchaseOrder?.id }})</b>,
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
import Quotation from '../../components/Quotation.vue';
import Vue from 'vue'
import AddServiceStepper from "@/components/Stepper.vue";
import CreateOrModifySaleProductDialog from '../../components/CreateOrModifySaleProductDialog.vue'
import CreateOrModifySaleServiceDialog from '../../components/CreateOrModifySaleServiceDialog.vue'
import SaleProductsPresentationTable from '../../components/SaleProductsPresentationTable.vue'
import SaleServicesPresentationTable from '../../components/SaleServicesPresentationTable.vue'
import {color} from "chart.js/helpers";
export default {
  components: { DatePicker, Quotation, vueDropzone: vue2Dropzone, AddServiceStepper,
    CreateOrModifySaleProductDialog, CreateOrModifySaleServiceDialog, SaleProductsPresentationTable,
    SaleServicesPresentationTable
  },
  watch: {
    editedSaleService() {
      console.log(this.editedSaleService)
    },
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
      const product = this.products.find(p => p.id === this.editedSaleProduct.productId);
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
    'editedSaleService.serviceId'() {
      const service = this.services.find(s => s.id === this.editedSaleService.serviceId);
      let price = 0;
      if ( service ) {
        price = service.sell_price;
        this.editedSaleService.price = parseFloat(price);
      }
    },
    'editedSaleServiceProduct.productId'() {
      const product = this.products.find(p => p.id === this.editedSaleServiceProduct.productId);
      let price = 0;
      if ( product ) {
        price = product.retail_price;
        this.editedSaleServiceProduct.price = parseFloat(price);
      }
    },
    'editedSaleServiceService.serviceId'() {
      const service = this.services.find(s => s.id === this.editedSaleServiceService.serviceId);
      if (service) {
        this.editedSaleServiceService.price = service.sell_price
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
    computedProductPriceIncTVA() {
      return this.editedSaleProduct.price ? Vue.filter('formatPrice')(this.editedSaleProduct.price * 1.2) : Vue.filter('formatPrice')(0)
    },
    computedProductServicePriceIncTVA() {
      this.priceProductServiceChanged()
      return this.editedSaleServiceProduct.price ? Vue.filter('formatPrice')(this.editedSaleServiceProduct.price * 1.2) : Vue.filter('formatPrice')(0)
    },
    computedCompanyIndustryType() {
      return store.state.company.Settings.industryType
    },
    computedServicePriceIncTVA() {
      this.servicePriceChanged()
      return this.editedSaleService.price ? Vue.filter('formatPrice')(Number(this.editedSaleService.price) * 1.2) : Vue.filter('formatPrice')(0)
    },
    computedServiceServicePriceIncTVA() {
      this.priceServiceServiceChanged()
      return this.editedSaleServiceService.price ? Vue.filter('formatPrice')(Number(this.editedSaleServiceService.price) * 1.2) : Vue.filter('formatPrice')(0)
    },
    priceWithoutVATWithoutDiscount() {
      let total = 0;
      if (this.computedCompanyIndustryType === 'RETAIL' || this.computedCompanyIndustryType ==='WHOLESALE') {
        for (const saleProduct of this.saleProducts) {
          total += parseFloat(saleProduct.price) * parseFloat(saleProduct.quantity)
        }
      }else if(this.computedCompanyIndustryType === 'SERVICE') {
        for (const saleService of this.saleServices) {
          total += parseFloat(saleService.price)
          if (saleService.saleProducts) {
            for (const saleProduct of saleService.saleProducts) {
              total += parseFloat(saleProduct.price) * parseFloat(saleProduct.quantity)
            }
          }
          if (saleService.saleServices) {
            for (const saleServiceService of saleService.saleServices) {
              total += parseFloat(saleServiceService.price)
            }
          }
        }
      }

      return total
    },
    priceWithoutVAT() {
      let total = 0;
      if (this.computedCompanyIndustryType === 'RETAIL' || this.computedCompanyIndustryType ==='WHOLESALE') {
        for (const saleProduct of this.saleProducts) {
          total += parseFloat(saleProduct.price) * parseFloat(saleProduct.quantity);
        }
      }else if(this.computedCompanyIndustryType === 'SERVICE') {
        for (const saleService of this.saleServices) {
          total += parseFloat(saleService.price)
          if (saleService.saleProducts) {
            for (const saleProduct of saleService.saleProducts) {
              total += parseFloat(saleProduct.price) * parseFloat(saleProduct.quantity)
            }
          }
          if (saleService.saleServices) {
            for (const saleServiceService of saleService.saleServices) {
              total += parseFloat(saleServiceService.price)
            }
          }
        }
      }

      if (this.selectedItem && this.discount)
        total -= parseFloat(this.discount ?? 0)

      return total
    },
    priceWithVAT() {
      let total = 0;
      total = this.priceWithoutVAT + parseFloat(this.priceWithoutVAT * this.selectedItem.vat / 100)
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
      products.unshift({id: -1, productCodes: [{code: "Afficher tout"}]})
      return products;
    },
    clientsFilter() {
      let clients = Object.assign([], this.clients);
      clients.unshift({id: -1, companyName: "Afficher tout"})
      return clients;
    },
    showCreateOrUpdateCard() {
      return this.selectedItem.id
    },
    showCreateOrUpdateCardText() {
      return (this.showCreateOrUpdateCard < 0) ? `Nouveau devis` : `Modification de devis #${this.selectedItem?.id}`;
    },
    computedProductServiceMargin() {
      console.log("hello")
      let sellPrice = this.editedSaleServiceProduct.price;
      const product = this.products.find(p => p.id === this.editedSaleServiceProduct.productId);
      let profitMargin = null
      if (product) {
        let buyPrice = product.buy_price;
        profitMargin = parseFloat((parseFloat(sellPrice / buyPrice) - 1) * 100).toFixed(2)
      }
      return profitMargin
    },
  },
  data: () => {
    return {
      loadingData: false,
      /**/
      serviceStepperSteps: [
        'service',
        'produits supplémentaires',
        'services supplémentaires',
        'finalisation'
      ],
      /**/
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
      saleServices: [],
      editedSaleProduct: {},
      editedSaleService: {
        quantity: 1,
        saleServices : [],
        saleProducts : []
      },
      editedSaleServiceProduct: {},
      editedSaleServiceService: {},
      editedSaleProductIndex: -1,
      editedSaleServiceIndex: -1,
      editedSaleServiceProductIndex: -1,
      editedSaleServiceServiceIndex: -1,
      addProductDialog: false,
      addServiceDialog: false,
      addProductToServiceDialog: false,
      addServiceToServiceDialog: false,
      showStatistics: false,
      selectedInventory: -1,
      products: [],
      services: [],
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
    color,
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
    servicePriceChanged() {
      let newEditedSaleService = Object.assign({}, this.editedSaleService);
      this.editedSaleService = Object.assign({}, newEditedSaleService)
    },
    priceProductServiceChanged() {
      let newEditedSaleProduct = Object.assign({}, this.editedSaleServiceProduct);
      this.editedSaleServiceProduct = Object.assign({}, newEditedSaleProduct)
    },
    priceServiceServiceChanged() {
      let newEditedSaleService = Object.assign({}, this.editedSaleServiceService);
      this.editedSaleServiceService = Object.assign({}, newEditedSaleService)
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
    // priceProductServiceChanged(val) {
    //     this.editedSaleServiceProduct.profit_margin = val
    // },
    profitMarginProductServiceChanged(val) {
      let profitMargin = val;
      let newEditedSaleProduct = Object.assign({}, this.editedSaleServiceProduct);
      const product = this.products.find(p => p.id === this.editedSaleServiceProduct.productId);
      if ( product ) {
        let buyPrice = product.buy_price;
        let sellPrice = parseFloat(parseFloat(profitMargin / 100) + 1 ).toFixed(2) * buyPrice
        newEditedSaleProduct.price = sellPrice.toFixed(2);
        this.editedSaleServiceProduct = Object.assign({}, newEditedSaleProduct)
      } else
        this.editedSaleServiceProduct = Object.assign({}, newEditedSaleProduct)
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
    editSaleServiceProduct(product) {
      this.editedSaleServiceProductIndex = this.editedSaleService.saleServiceProducts.indexOf(product);
      this.editedSaleServiceProduct = product;
      this.addProductToServiceDialog = true
    },
    editSaleService(service) {
      this.editedSaleServiceIndex = this.saleServices.indexOf(service);
      this.editedSaleService = service;
      this.addServiceDialog = true
    },
    editSaleServiceService(service) {
      this.editedSaleServiceServiceIndex = this.editedSaleService.saleServiceServices.indexOf(service);
      this.editedSaleServiceService = service;
      this.addServiceToServiceDialog = true
    },
    removeProduct(product) {
      this.deletedSaleProducts.push(product);
      const indexOfProduct = this.saleProducts.indexOf(product)
      this.saleProducts.splice(indexOfProduct, 1)
    },
    removeSaleService(service) {
      if (!this.deletedSaleServices)
        this.deletedSaleServices = []
      this.deletedSaleServices.push(service);
      const indexOfService = this.saleServices.indexOf(service)
      this.saleServices.splice(indexOfService, 1)
      this.saleServices = [...this.saleServices]
    },
    removeSaleProductFromService(product) {
      if (!this.editedSaleService.deletedSaleProducts)
        this.editedSaleService.deletedSaleProducts = []
      this.editedSaleService.deletedSaleProducts.push(product);
      const indexOfProduct = this.editedSaleService.saleServiceProducts.indexOf(product)
      // this.editedSaleService.saleServiceProducts.splice(indexOfProduct, 1)
      this.editedSaleService.saleServiceProducts = this.editedSaleService.saleServiceProducts.filter(
          (product, index) => index !== indexOfProduct
      );
      // this.editedSaleService.saleServiceProducts = [...this.editedSaleService.saleServiceProducts]
      console.log(this.editedSaleService)
    },
    removeSaleServiceFromService(service) {
      if (!this.editedSaleService.deletedSaleServices)
        this.editedSaleService.deletedSaleServices = []
      this.editedSaleService.deletedSaleServices.push(service);
      const indexOfService = this.editedSaleService.saleServiceServices.indexOf(service)
      // this.editedSaleService.saleServiceProducts.splice(indexOfProduct, 1)
      this.editedSaleService.saleServiceServices = this.editedSaleService.saleServiceServices.filter(
          (service, index) => index !== indexOfService
      );
      // this.editedSaleService.saleServiceProducts = [...this.editedSaleService.saleServiceProducts]
      console.log(this.editedSaleService)
    },
    filterUsedProducts(usedProducts, editedSaleProduct) {
      const pp = this.products.filter(p => {
        return usedProducts ?
            !usedProducts.some(item => item.productId === p.id && item.productId !== editedSaleProduct.productId) :
            true;
      });
      return pp
    },
    filterUsedServices(usedServices, editedSaleService) {
      const ss = this.services.filter(s => {
        return usedServices ?
            !usedServices.some(item => item.serviceId === s.id && item.serviceId !== editedSaleService.serviceId) :
            true;
      });
      return ss
    },
    closeAddProductDialog() {
      this.editedSaleProduct = {}
      this.editedSaleProductIndex = -1;
      this.addProductDialog = false
    },
    closeAddProductToServiceDialog() {
      this.editedSaleServiceProduct = {}
      this.addProductToServiceDialog = false
    },
    closeAddServiceToServiceDialog() {
      this.editedSaleServiceService = {}
      this.addServiceToServiceDialog = false
    },
    handleSaleServiceClosed() {
      this.editedSaleService =  {
        quantity: 1,
        saleServices : [],
        saleProducts : []
      }
      this.addServiceDialog = false
    },
    addSaleService() {
      if (!this.editedSaleService.serviceId) {
        return this.$swal(
            'Champs Obligatoires Manquants!',
            'Veuiller choisir un service',
            'warning'
        )
      }
      if (!this.editedSaleService.quantity || this.editedSaleService.quantity < 1) {
        return this.$swal(
            'Champs Obligatoires Manquants!',
            'La quantité est manquante ou a une entrée négative.',
            'warning'
        )
      }

      if( !this.saleServices?.length )
        this.saleServices = [];
      /** Push Purchased Product to the selectedItem */
      if ( this.editedSaleServiceIndex < 0 )
        this.saleServices.push(this.editedSaleService);
      else
        Object.assign(this.saleServices[this.editedSaleServiceIndex], this.editedSaleService);
      // this.saleProducts[this.editedSaleProductIndex] = Object.assign({}, this.editedSaleProduct);
      /** Close dialog */
      this.handleSaleServiceClosed()
    },
    calcTotalSaleServices(saleService) {
      let initialValue = 0
      if (!saleService.saleServices) {
        return 0
      }
      return saleService.saleServices.reduce((accumulator, currentValue) => accumulator + parseFloat(currentValue.price)* parseFloat(currentValue.quantity), initialValue);
    },
    calcTotalSaleProducts(saleService) {
      let initialValue = 0
      if (!saleService.saleProducts) {
        return 0
      }
      return saleService.saleProducts.reduce((accumulator, currentValue) => accumulator + parseFloat(currentValue.price) * parseFloat(currentValue.quantity), initialValue);
    },
    calcTotalSaleService(saleService) {
      return parseFloat(saleService.quantity) * (this.calcTotalSaleProducts(saleService) + this.calcTotalSaleServices(saleService) + parseFloat(saleService.price));
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
    addProductToService() {
      if (!this.editedSaleServiceProduct.productId) {
        return this.$swal(
            'Champs Obligatoires Manquants!',
            'Veuillez sélectionner un produit.',
            'warning'
        )
      }
      if (!this.editedSaleServiceProduct.quantity || this.editedSaleServiceProduct.quantity < 1) {
        return this.$swal(
            'Champs Obligatoires Manquants!',
            'La quantité est manquante ou a une entrée négative.',
            'warning'
        )
      }
      this.editedSaleServiceProduct.discount = 0;
      const product = this.products.find(p => p.id === this.editedSaleServiceProduct.productId);
      if ( product && (product.retail_price > parseFloat(this.editedSaleServiceProduct.price)) ) {
        this.editedSaleServiceProduct.discount = parseFloat(product.retail_price - this.editedSaleServiceProduct.price).toFixed(2)
      }
      try {
        this.editedSaleService.saleServiceProducts.length
      }catch (err) {
        this.editedSaleService.saleServiceProducts = []
      }
      /** Push Purchased Product to the selectedItem */
      if ( this.editedSaleServiceProductIndex < 0 ){
        this.editedSaleServiceProduct.type = "RETAIL"
        this.editedSaleService.saleServiceProducts.push(this.editedSaleServiceProduct);
        this.editedSaleService.saleServiceProducts = [...this.editedSaleService.saleServiceProducts]
      }
      else {
        console.log(this.editedSaleService.saleServiceProducts[this.editedSaleServiceProductIndex])
        Object.assign(this.editedSaleService.saleServiceProducts[this.editedSaleServiceProductIndex], this.editedSaleServiceProduct);
      }
      // this.saleProducts[this.editedSaleProductIndex] = Object.assign({}, this.editedSaleProduct);
      /** Close dialog */
      console.log(this.editedSaleService)
      this.closeAddProductToServiceDialog()
    },
    addServiceToService() {
      if (!this.editedSaleServiceService.serviceId) {
        return this.$swal(
            'Champs Obligatoires Manquants!',
            'Veuillez sélectionner un service.',
            'warning'
        )
      }
      if (!this.editedSaleServiceService.quantity || this.editedSaleServiceService.quantity < 1) {
        return this.$swal(
            'Champs Obligatoires Manquants!',
            'La quantité est manquante ou a une entrée négative.',
            'warning'
        )
      }
      this.editedSaleServiceService.discount = 0;
      const service = this.services.find(s => s.id === this.editedSaleServiceService.serviceId);
      if ( service && (service.sell_price > parseFloat(this.editedSaleServiceService.price)) ) {
        this.editedSaleServiceService.discount = parseFloat(service.sell_price - this.editedSaleServiceService.price).toFixed(2)
      }
      try {
        this.editedSaleService.saleServiceServices.length
      }catch (err) {
        this.editedSaleService.saleServiceServices = []
      }
      /** Push Purchased Product to the selectedItem */
      if ( this.editedSaleServiceServiceIndex < 0 ){
        this.editedSaleService.saleServiceServices.push(this.editedSaleServiceService);
        this.editedSaleService.saleServiceServices = [...this.editedSaleService.saleServiceServices]
      }
      else{
        Object.assign(this.editedSaleService.saleServiceServices[this.editedSaleServiceServiceIndex], this.editedSaleServiceService);
      }
      // this.saleProducts[this.editedSaleProductIndex] = Object.assign({}, this.editedSaleProduct);
      /** Close dialog */
      this.closeAddServiceToServiceDialog()
    },
    getSale(item) {
      // Invoice Information
      this.axios.get(`${process.env.VUE_APP_API_URL}/sale/quotation/${item.id}`).then(res => {
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
      if ( this.selectedStartDate )
        searchParams.startDate = this.selectedStartDate;

      this.axios.get(`${process.env.VUE_APP_API_URL}/salesService`, { params: searchParams }).then(res => {
        this.items = res.data;
        this.loadingData = false;
      }).catch(() => { this.loadingData = false; })
      
      //** 

    },
    loadItems() {
      this.loadSales();
      this.axios.get(`${process.env.VUE_APP_API_URL}/concerns?type=Client`).then(res => {
        this.clients = res.data;
      });
      // fetch products
      this.axios.get(`${process.env.VUE_APP_API_URL}/products`).then(res => {
        this.products = res.data;
      });
      // fetch services
      this.axios.get(`${process.env.VUE_APP_API_URL}/services`).then(res => {
        this.services = res.data;
      });
    },
    showCreateCard() {
      this.selectedItem = {
        id: -1,
        vat: 20,
        shipped: 1
      };
      setTimeout(() => {
        window.scrollTo({top: 0, behavior: 'smooth'});
      }, 100);
    },
    createOrUpdate() {
      this.loading = true;
      /** data to send through the request */

      if (this.computedCompanyIndustryType === 'RETAIL' || this.computedCompanyIndustryType ==='WHOLESALE'){
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
        console.log(createOrUpdateData)
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
      } else if (this.computedCompanyIndustryType === 'SERVICE' ){
        const { id } = this.selectedItem;
        /** Method will be put or create */
        const method =
            (id < 0) ?
                'post':(id > 0) ?
                    'put':null
        /** URL changes depends if your modifying or creating a new record */
        const url =
            (id < 0) ?
                `${process.env.VUE_APP_API_URL}/saleService`:(id > 0) ?
                    `${process.env.VUE_APP_API_URL}/saleService/${id}`:null
        let createOrUpdateData = {}
        for (const key in this.selectedItem) {
          createOrUpdateData[key] =  this.selectedItem[key]
        }
          this.saleServices['description'] = this.selectedItem.description;
          this.saleServices['quantity'] = parseFloat(1);
          createOrUpdateData['services'] = this.saleServices
          createOrUpdateData['deletedSaleServices'] = this.deletedSaleServices;
        

        createOrUpdateData['discount'] = this.discount
        createOrUpdateData['saleType'] = "SERVICE"
        console.log(createOrUpdateData)
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
              'LLAH GHALEB',
              'warning'
          )
          this.loading = false;
          console.log(err);
        })

      }
    },
    resetAll() {
      this.selectedItem = { id: 0 };
      this.discount = 0;
      this.discountPercent = 0;
      this.deletedSaleProducts = Object.assign([], []);
      this.deletedSaleServices = Object.assign([], []);
    },
    showEditCard(item) {
      this.selectedItem = item;
      this.saleProducts = []
      this.saleServices = []
      if (this.computedCompanyIndustryType === 'RETAIL' || this.computedCompanyIndustryType === 'WHOLESALE') {
        this.saleProducts = item.saleProducts
      }else if (this.computedCompanyIndustryType === 'SERVICE') {
        this.saleServices = item.saleServices
      }
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
          this.axios.delete(`${process.env.VUE_APP_API_URL}/sale/quotation/${item.id}`).then(() => {
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
          })
        } else {
          this.loading = false;
          this.$swal(
              'Erreur!',
              "Une erreur s'est produite lors de la suppression de rôle",
              'error'
          )
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
  },
}
</script>
<style>
.max-width-320 {
  max-width: 320px;
}
.purchase-summary {
  max-height: 400px;
  overflow-y: auto;
}

</style>
