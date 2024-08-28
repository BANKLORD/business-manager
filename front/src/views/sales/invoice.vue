<template>
  <v-row justify="center">
    <v-col cols="12">
      <div class="text-center my-3 text-uppercase">
        <h3> Gestion des factures </h3>
      </div>
    </v-col>
    <v-col cols="9">
      <v-row justify="center">
        <v-col cols="5">
          <DatePicker label="Date de début" :bound="-1" v-model="selectedStartDate"></DatePicker>
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
          :loading="loadingData"
          :footer-props="{ 'items-per-page-options': [15, 30, 50, 100, -1] }"
          :items-per-page="30"
          :headers="columns"
          :items="invoices"
        >
          <!-- Top Actions -->
          <template v-slot:top>
            <v-col class="text-center" cols="12">
              <v-btn
                color="primary"
                outlined
                @click="exportData"
              >
                <v-icon class="mr-2">far fa-file-excel</v-icon>
                Export Data
              </v-btn>
            </v-col>
          </template>
          <!-- Client -->
          <template v-slot:[`item.client`]="{ item }">
            {{ item.deliveryForms[0].sale?.concern?.companyName ? item.deliveryForms[0].sale?.concern?.companyName:item.deliveryForms[0].sale.concern?.name + ' ' + item.deliveryForms[0].sale?.concern?.surname }}
          </template>
          <!-- Total Price -->
          <template v-slot:[`item.totalAmountDutyFree`]="{ item }">
            {{ item.totalAmountDutyFree | formatPrice }}
          </template>
          <!-- VAT & Amount In VAT Price -->
          <template v-slot:[`item.totalAmountInVAT`]="{ item }">
            {{ item.totalAmountInVAT | formatPrice }}
            ({{ item.vat | formatNumber }}%)
          </template>
          <!-- Total Amount TTC -->
          <template v-slot:[`item.totalAmount`]="{ item }">
            {{ item.totalAmountInVAT + item.totalAmountDutyFree | formatPrice }}
          </template>
          <!-- Actions -->
          <template v-slot:[`item.actions`]="{ item }">
            <v-tooltip bottom>
              <template v-slot:activator="{ on, attrs }">
                <v-btn
                  v-bind="attrs"
                  v-on="on"
                  text
                  color="success"
                  @click="showInvoice(item.id)"
                  :loading="loading"
                  :disabled="loading"
                >
                  <v-icon>fas fa-file-invoice</v-icon>
                </v-btn>
              </template>
              <span>Afficher la facture</span>
            </v-tooltip>
          </template>
        </v-data-table>
      </v-card>
    </v-col>
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
import { json2excel } from 'js2excel';

export default {
  components: { DatePicker, InvoiceGroup },
  data: () => {
    return {
      loadingData: false,
      loadingDialog: false,
      selectedInvoice: {},
      loading: false,
      sellerInformation: {},
      clientInformation: {},
      invoiceGroupDialog: false,
      selectedConcern: -1,
      selectedStartDate: null,
      selectedEndDate: null,
      concerns: [],
      purchaseOrderListTitle: "List des factures",
      invoices: [],
      columns: [
        { text: "#", value: "count", align: "start" },
        { text: "Client", value: "client", align: "center" },
        { text: "Total HT", value: "totalAmountDutyFree" },
        { text: "TVA", value: "totalAmountInVAT" },
        { text: "Total TTC", value: "totalAmount" },
        { text: "Actions", value: "actions", sortable: false },
      ]
    };
  },
  watch: {
    selectedConcern() {
      this.getInvoices();
    },
    selectedStartDate() {
      this.getInvoices();
    },
    selectedEndDate() {
      this.getInvoices();
    },
  },
  computed: {
    invoicesFiltered() {
      return this.invoices;
    }
  },
  methods: {
    showInvoice(invoiceId) {
      this.loadingDialog = true;
      this.axios({
        url: `${process.env.VUE_APP_API_URL}/sale/invoice/${invoiceId}`,
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
    getInvoices() {
      this.loadingData = true;
      const searchQuery = {};
      if ( this.selectedConcern > 0 )
        searchQuery.concern = this.selectedConcern;
      if ( this.selectedEndDate )
        searchQuery.endDate = this.selectedEndDate;
      if ( this.selectedStartDate )
        searchQuery.startDate = this.selectedStartDate;
      this.axios.get(`${process.env.VUE_APP_API_URL}/sale/invoices`, { params: searchQuery }).then(res => {
        this.invoices = res.data;
        console.log(...res.data.map(invoice => invoice.refunds));
        this.loadingData = false;
      }).catch(() => { this.loadingData = false; });
    },
    getClients() {
      this.axios.get(`${process.env.VUE_APP_API_URL}/concerns?type=Client`).then(res => {
        this.concerns = res.data;
        this.concerns.unshift({ companyName: 'Tous', id: -1 })
      });
    },
    exportData() {
      let data = [];
      for (const item of this.invoices) {
        data.push({
          '#': item.count,
          'Client': item.deliveryForms[0].sale?.concern?.companyName ? item.deliveryForms[0].sale?.concern?.companyName:item.deliveryForms[0].sale.concern?.name + ' ' + item.deliveryForms[0].sale?.concern?.surname,
          'Total TTC (MAD)': this.$options.filters.formatPrice(item.paid),
          'Date': this.$options.filters.formatDate(item.createdAt),
        })
      }
      try {
        json2excel({
          data,
          name: 'invoices',
          formateDate: 'yyyy/mm/dd'
        });
      } catch (e) {
        console.error('export error');
      }
    }
  },
  created() {
    this.getClients();
  },
  mounted() {
    this.getInvoices();
  }
}
</script>
