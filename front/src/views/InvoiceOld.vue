<template>
  <v-row justify="center">
    <v-col cols="12">
      <div class="text-center my-3 text-uppercase">
        <h3> Système de gestion des factures </h3>
      </div>
    </v-col>
    <v-col cols="9">
      <v-row justify="center">
        <v-col cols="5">
          <DatePicker label="Date de début" v-model="selectedStartDate"></DatePicker>
        </v-col>
        <v-col cols="5">
          <DatePicker label="Date de fin" v-model="selectedEndDate"></DatePicker>
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
            :items="[{ text: 'Tous', value: -1 }, { text: 'Payé', value: 1 }, { text: 'Non Payé', value: 2 }]"
            prepend-icon="fa-solid fa-list-check"
          ></v-select>
        </v-col>
      </v-row>
    </v-col>
    <v-col cols="9">
      <v-card>
        <v-toolbar flat color="primary" dark>
          <v-spacer></v-spacer>
          <v-toolbar-title class="text-center text-uppercase" v-text="purchaseOrderListTitle"></v-toolbar-title>
          <v-spacer></v-spacer>
        </v-toolbar>
        <v-data-table
          show-select
          :footer-props="{ 'items-per-page-options': [15, 30, 50, 100, -1] }"
          :items-per-page="30"
          :headers="columns"
          :items="purchaseOrdersFiltered"
          v-model="selectedPurchaseOrders"
        >
          <!-- Top Actions -->
          <template v-slot:top>
            <v-col class="text-center" cols="12">
              <v-btn class="mr-2" text outlined color="primary" @click="showInvoiceGroup"> Télécharger en une seule facture </v-btn>
              <v-btn text outlined color="success" @click="markAsPaidAndShipped"> Marque Comme Payé </v-btn>
            </v-col>
          </template>
          <!-- Client -->
          <template v-slot:[`item.client`]="{ item }">
            {{ item.concern?.companyName ? item.concern?.companyName:item.concern?.name + ' ' + item.concern?.surname }}
          </template>
          <!-- Status -->
          <template v-slot:[`item.status`]="{ item }">
            <v-chip :color="getStatusColor(item)" dark>
              {{ getStatusText(item) }}
            </v-chip>
          </template>
          <!-- Total Price -->
          <template v-slot:[`item.totalPrice`]="{ item }">
            {{ item.totalPrice | formatPrice }}
          </template>
          <!-- Total Paid -->
          <template v-slot:[`item.paid`]="{ item }">
            {{ item.paid | formatPaidPrice }}
          </template>
          <!-- Rest -->
          <template v-slot:[`item.rest`]="{ item }">
            {{ (item.totalPrice - item.paid) | formatPrice }}
          </template>
        </v-data-table>
      </v-card>
    </v-col>
    <v-dialog v-model="invoiceGroupDialog">
      <v-card>
        <v-card-text>
          <InvoiceGroup
            :invoices="selectedPurchaseOrders"
            :clientInformation="clientInformation"
            :sellerInformation="sellerInformation"
          ></InvoiceGroup>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-row>
</template>
<script>
import DatePicker from "../components/DatePicker.vue";
import InvoiceGroup from '../components/InvoiceGroup.vue'
export default {
  components: { DatePicker, InvoiceGroup },
  data: () => {
    return {
      sellerInformation: {},
      clientInformation: {},
      invoiceGroupDialog: false,
      selectedPurchaseOrders: [],
      selectedConcern: -1,
      selectedStatus: -1,
      selectedStartDate: null,
      selectedEndDate: null,
      concerns: [],
      purchaseOrderListTitle: "List des bon de commandes",
      purchaseOrders: [],
      invoices: [],
      columns: [
        { text: "#", value: "id", align: "start" },
        { text: "Client", value: "client", align: "center" },
        { text: "Status", value: "status", align: "center" },
        { text: "Total TTC (MAD)", value: "totalPrice" },
        { text: "Payé (MAD)", value: "paid" },
        { text: "Reste (MAD)", value: "rest" },
        { text: "Actions", value: "actions", sortable: false },
      ]
    };
  },
  watch: {
    selectedConcern() {
      this.getPurchaseOrders();
    },
    selectedStartDate() {
      this.getPurchaseOrders();
    },
    selectedEndDate() {
      this.getPurchaseOrders();
    },
  },
  computed: {
    purchaseOrdersFiltered() {
      if ( this.selectedStatus == 1 )
        return this.purchaseOrders.filter(po => (po.totalPrice - po.paid) == 0)
      else if ( this.selectedStatus == 2 )
        return this.purchaseOrders.filter(po => (po.totalPrice - po.paid) > 0)
      return this.purchaseOrders;
    }
  },
  methods: {
    markAsPaidAndShipped() {
      this.axios.put(`${process.env.VUE_APP_API_URL}/paySales`, { data: this.selectedPurchaseOrders }).then(() => {
        this.getPurchaseOrders();
        this.selectedPurchaseOrders = []
      })
    },
    showInvoiceGroup() {
      this.sellerInformation = {
        name: this.$store.getters.getCompany.name,
        address: this.$store.getters.getCompany.address,
        zip: this.$store.getters.getCompany.zip,
        city: this.$store.getters.getCompany.city,
        country: "Maroc"
      }
      const client = this.concerns.find(c => c.id == this.selectedConcern);
      this.clientInformation = {
        name: client.companyName,
        address: client.address,
        zip: client.zip,
        city: client.city,
        country: "Maroc"
      }
      this.invoiceGroupDialog = true;
    },
    getStatusColor(sale) {
      if (sale.paid == 0)
        return "red";
      else if ((sale.paid - sale.totalPrice) == 0)
        return "green";
      else
        return "orange";
    },
    getStatusText(sale) {
      if (sale.paid == 0)
        return "Non Payé";
      else if ((parseFloat(sale.paid) - parseFloat(sale.totalPrice)) == 0)
        return "Payé";
      else
        return "Partiellement Payé";
    },
    getPurchaseOrders() {
      const searchQuery = {};
      if ( this.selectedConcern > 0 )
        searchQuery.concern = this.selectedConcern;
      if ( this.selectedEndDate )
        searchQuery.endDate = this.selectedEndDate;
      if ( this.selectedStartDate )
        searchQuery.startDate = this.selectedStartDate;
      this.axios.get(`${process.env.VUE_APP_API_URL}/purchaseOrders`, { params: searchQuery }).then(res => {
        this.purchaseOrders = res.data;
      });
    },
    getInvoices() {
      this.axios.get(`${process.env.VUE_APP_API_URL}/invoices`).then(res => {
        this.invoices = res.data;
      });
    },
    getClients() {
      this.axios.get(`${process.env.VUE_APP_API_URL}/concerns?type=Client`).then(res => {
        this.concerns = res.data;
        this.concerns.unshift({ companyName: 'Tous', id: -1 })
      });
    }
  },
  created() {
    this.getInvoices();
    this.getPurchaseOrders();
    this.getClients();
  },
}
</script>
