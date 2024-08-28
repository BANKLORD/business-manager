<template>
  <v-container fill-height fluid max-width="1444px">
    <!-- Modify or Create new one -->
    <v-expand-transition>
      <v-row v-show="showCreateOrUpdateCard" class="text-center my-10" align="center" justify="center" max-width="1444px">
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
                  <v-select
                    label="Client"
                    v-model="selectedItem.concernId"
                    :items="clients"
                    item-text="name"
                    item-value="id"
                  >
                    <template slot="selection" slot-scope="data"> {{ data.item.companyName ?? data.item.name + ' ' + data.item.surname }} </template>            
                    <template slot="item" slot-scope="data"> {{ data.item.companyName ?? data.item.name + ' ' + data.item.surname }} </template>            
                  </v-select>
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
                <v-col cols="6">
                  <v-text-field
                    label="Remise (%)"
                    v-model="discountPercent"
                    @change="discountPercentChanged(discountPercent)"
                    type="number"
                    :append-icon="'fas fa-percentage'"
                  ></v-text-field>
                </v-col>
                <!-- Paid -->
                <v-col cols="6">
                  <v-text-field
                    label="Payé"
                    v-model="selectedItem.paid"
                    type="number"
                    :rules="[v => ( v && v <= (priceWithVAT ?? 0) ) || `Devrait être inférieur ou égal à ${(priceWithVAT)}`]"
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
                <v-col class="text-center d-none" cols="6">
                  <v-switch
                    v-model="selectedItem.shipped"
                    flat
                    :label="selectedItem.shipped ? 'Expédié':'Non expédié'"
                  ></v-switch>
                </v-col>
              </v-row>
              <!-- Products -->
              <v-divider class="my-5"></v-divider>
              <!-- Products -->
              <v-row justify="center">
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
                        <th></th>
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
                        <td> {{ products.find(p => p.id == product.productId)[product.type] | formatPrice }} </td>
                        <td> {{ parseFloat(products.find(p => p.id == product.productId)[product.type]) - parseFloat(product.price) | formatPrice }} </td>
                        <td> {{ product.price | formatPrice }} </td>
                        <td> {{ product.quantity | formatNumber }} </td>
                        <td> {{ Intl.NumberFormat().format(product.price * product.quantity) }} MAD </td>
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
              <v-divider class="my-5"></v-divider>
              <v-row justify="center">
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
    <v-row class="text-center" justify="center" max-width="1444px">
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
            <DatePicker label="Date de début" v-model="selectedStartDate"></DatePicker>
          </v-col>
          <v-col>
            <DatePicker label="Date de début" v-model="selectedEndDate"></DatePicker>
          </v-col>
        </v-row>
        <v-row class="mx-3 my-2" justify="center">
          <v-col>
            <v-select
              prepend-icon="fa-handshake"
              label="Filtrer par des Clients"
              :items="clientsFilter"
              v-model="selectedClient"
              item-text="companyName"
              item-value="id"
            >
              <template slot="selection" slot-scope="data"> {{ data.item.companyName ?? data.item.name + ' ' + data.item.surname }} </template>            
              <template slot="item" slot-scope="data"> {{ data.item.companyName ?? data.item.name + ' ' + data.item.surname }} </template>            
            </v-select>
          </v-col>
          <v-col>
            <v-select
              prepend-icon="mdi-inbox-multiple"
              label="Filtrer par des produits"
              :items="productsFilter"
              v-model="selectedProduct"
              item-text="productCodes[0].code"
              item-value="id"
            ></v-select>
          </v-col>
          <!-- <v-col>
            <v-text-field
              v-model.lazy="searchTerm"
              @change="searchTermChanged"
              label="Rechercher"
              append-icon="mdi-magnify"
              @click:append="searchTermChanged"
              v-on:keyup.enter="searchTermChanged"
            ></v-text-field>
          </v-col> -->
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
            <ul v-for="sp in item.saleProducts" :key="'sp' + sp.id">
              <li>{{ sp.product.productCodes[0].code }}</li>
            </ul>
          </template>
          <template v-slot:[`item.concern.companyName`]="{ item }" >
            {{ (item.concern?.companyName ?? (item.concern?.name + ' ' + item.concern?.surname)) }}
          </template>
          <template v-slot:[`item.vat`]="{ item }">
            {{ item.vat }}%
          </template>
          <template v-slot:[`item.total`]="{ item }">
            {{ Intl.NumberFormat().format(parseFloat(item.total ?? 0)) }}
          </template>
          <template v-slot:[`item.paid`]="{ item }">
            {{ Intl.NumberFormat().format(parseFloat(item.paid)) }}
          </template>
          <template v-slot:[`item.total_ttc`]="{ item }">
            {{ Intl.NumberFormat().format(parseFloat(item.totalPrice ?? 0)) }}
          </template>
          <template v-slot:[`item.createdAt`]="{ item }">
            {{ item.createdAt | formatDate }}
          </template>
          <template
            v-if="$store.getters.hasPerm('concern-update') || $store.getters.hasPerm('concern-delete')"
            v-slot:[`item.actions`]="{ item }"
          >
            <v-btn
              color="success"
              icon
              @click="getSale(item)"
            >
              <v-icon small>fa-file-invoice</v-icon>
            </v-btn>
            <v-btn
              v-if="item.invoices?.length > 0"
              color="success"
              icon
              @click="getInvoice(item)"
            >
              <v-icon small>fa-file-invoice</v-icon>
            </v-btn>
            <v-btn
              color="primary"
              icon
              v-if="$store.getters.hasPerm('concern-update')"
              @click="showEditCard(item)"
            >
              <v-icon
                small
              >
                mdi-pencil
              </v-icon>
            </v-btn>
            <v-btn
              color="red"
              class="mr-2"
              icon
              v-if="$store.getters.hasPerm('concern-delete')"
              @click="showDeleteConfirm(item)"
            >
              <v-icon
                small
              >
                mdi-delete
              </v-icon>
            </v-btn>
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
          <v-row justify="center">
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
            <v-col lg="5" sm="12" v-if="products.find(p => p.id == editedSaleProduct.productId)">
              <v-text-field
                readonly
                label="Prix normal de vente / Unité"
                v-model="products.find(p => p.id == editedSaleProduct.productId).sell_price"
                type="number"
              ></v-text-field>
            </v-col>
            <!-- Buy Price -->
            <v-col lg="5" sm="12" v-if="products.find(p => p.id == editedSaleProduct.productId)">
              <v-text-field
                readonly
                @change="priceChanged"
                label="Prix D'achat"
                v-model="products.find(p => p.id == editedSaleProduct.productId).buy_price"
                type="number"
              ></v-text-field>
            </v-col>
            <!-- Sell Price -->
            <v-col lg="5" sm="12">
              <v-text-field
                @change="priceChanged"
                label="Prix / Unité"
                v-model="editedSaleProduct.price"
                type="number"
              ></v-text-field>
            </v-col>
            <!-- Profit Margin -->
            <v-col lg="5" sm="12">
              <v-text-field
                @change="profitMarginChanged"
                label="Marge bénéficiaire"
                v-model="editedSaleProduct.profit_margin"
                append-icon="fas fa-percent"
                type="number"
              ></v-text-field>
            </v-col>
            <!-- Quantity -->
            <v-col lg="7" sm="12">
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
      v-model="invoiceDialog"
      fullscreen
      hide-overlay
      scrollable
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
              @click="invoiceDialog = false"
            >
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-toolbar>
          <v-card-text>
            <Invoice
              v-if="invoiceDialog"
              :sellerInformation="selectedInvoice.sellerInformation"
              :clientInformation="selectedInvoice.clientInformation"
              :invoiceInformation="selectedInvoice.invoiceInformation"
              :saleProducts="selectedInvoice.saleProducts"
              :sale="selectedInvoice.sale"
            ></Invoice>
          </v-card-text>  
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
  </v-container>
</template>

<script>
import DatePicker from '../components/DatePicker.vue'
import Invoice from '../components/Invoice.vue'
import Sale from '../components/Sale.vue';
export default {
  components: { Invoice, Sale, DatePicker },
  watch: {
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
      return this.showCreateOrUpdateCard ? `nouvelle vente`:`Modification de la vente N°: ${this.selectedItem?.id}`;
    },
  },
  data: () => {
    return {
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
      listTitle: 'Liste des ventes',
      addNewButtonText: 'Nouvelle vente',
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
        // { text: 'Payé (MAD)', value: 'paid' },
        // { text: 'Reste', value: 'rest' },
        { text: 'Date', value: 'createdAt' },
        { text: 'Actions', value: 'actions', sortable: false },
      ], 
      items: [],
    }
  },
  created() {
    this.loadItems();
  },
  methods: {
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
        this.saleProducts[this.editedSaleProductIndex] = this.editedSaleProduct;
      /** Close dialog */
      
      this.closeAddProductDialog()
    },
    getSale(item) {
      // Invoice Information
      this.axios.get(`${process.env.VUE_APP_API_URL}/sale/${item.id}`).then(res => {
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
    getInvoice(item) {
      this.selectedInvoice.id = item.id
      // Invoice Information
      this.selectedInvoice.invoiceInformation = {
        id: item.invoices[0]?.id,
        number: new Date().getFullYear() + '.' + item.invoices[0]?.id,
        date: new Date(item.invoices[0]?.createdAt).toISOString().split('T')[0],
        dueDate: new Date(new Date(item.invoices[0]?.createdAt).setDate(+60)).toISOString().split('T')[0]
      }
      // Seller information
      this.selectedInvoice.sellerInformation = {
        name: 'Nova Deal Company',
        address: `Rue Oued Ziz N°6 Residence Oued Ziz Rdc N°1`,
        zip: "90060",
        city: "Tanger",
        country: "Maroc"
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
      this.selectedInvoice.sale = {
        discount: parseFloat(item.discount),
        paid: parseFloat(item.paid),
        vat: parseFloat(item.vat),
      }
      this.invoiceDialog = true;
    },
    searchTermChanged() {
      this.loadSales();
    },
    loadSales() {
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
      this.axios.get(`${process.env.VUE_APP_API_URL}/sales`, { params: searchParams }).then(res => {
        this.items = res.data;
      });
    },
    loadItems() {
      this.axios.get(`${process.env.VUE_APP_API_URL}/sales`).then(res => {
        this.items = res.data;
      });
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
        `${process.env.VUE_APP_API_URL}/sale`:(id > 0) ? 
        `${process.env.VUE_APP_API_URL}/sale/${id}`:null
      let createOrUpdateData = {}
      for (const key in this.selectedItem) {
        createOrUpdateData[key] =  this.selectedItem[key]
      }
      createOrUpdateData['products'] = this.saleProducts
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
          this.axios.delete(`${process.env.VUE_APP_API_URL}/sale/${item.id}`).then(() => {
            this.$swal(
              'Supprimé!',
              'vente a été supprimé.',
              'success'
            );
            this.loadItems();
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