<template>
  <v-container>
    <h3 class="primary--text text-uppercase text-cetner">
      Les documents d'achat
    </h3>
    <v-data-table
      dense
      :headers="documentsColumns"
      :items="documents"
    >
      <template v-slot:[`item.id`]="{ item }">
        P-{{ item.purchase.id }}
      </template>
      <template v-slot:[`item.concern`]="{ item }">
        {{ item.purchase.concern.companyName }}
      </template>
      <template v-slot:[`item.totalPrice`]="{ item }">
        {{ item.totalPrice | formatPrice }}
      </template>
      <template v-slot:[`item.actions`]="{ item }">
        <v-tooltip bottom>
          <template v-slot:activator="{ on, attrs }">
            <a ref="download" style="display: none;"></a>
            <v-btn
              v-bind="attrs"
              v-on="on"
              icon
              color="primary"
              @click="downloadDocument(item)"
              :loading="loading"
              :disabled="loading"
            >
              <v-icon>fas fa-download</v-icon>
            </v-btn>
          </template>
          <span>Télécharger les document</span>
        </v-tooltip>
      </template>
    </v-data-table>
    <h3 class="primary--text text-uppercase text-cetner">
      Les documents de vente
    </h3>
    <v-row justify="center">
      <v-col cols="9">
        <v-row justify="center">
          <v-col cols="5">
            <DatePicker label="Date de début" :bound="-1" v-model="selectedInvoiceStartDate"></DatePicker>
          </v-col>
          <v-col cols="5">
            <DatePicker label="Date de fin" :bound="1" v-model="selectedInvoiceEndDate"></DatePicker>
          </v-col>
          <v-col cols="5">
            <v-autocomplete
              label="Client"
              v-model="selectedClient"
              :items="clients"
              item-value="id"
              item-text="companyName"
              prepend-icon="fas fa-handshake"
            ></v-autocomplete>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
    <v-data-table
      :footer-props="{ 'items-per-page-options': [15, 30, 50, 100, -1] }"
      :items-per-page="30"
      :headers="invoiceColumns"
      :items="invoices"
    >
      <!-- Top Actions -->
      <template v-slot:top>
        <v-col class="text-center" cols="12"></v-col>
      </template>
      <!-- Client -->
      <template v-slot:[`item.client`]="{ item }">
        {{ item.deliveryForms[0].sale?.concern?.companyName ? item.deliveryForms[0].sale?.concern?.companyName:item.deliveryForms[0].sale.concern?.name + ' ' + item.deliveryForms[0].sale?.concern?.surname }}
      </template>
      <!-- Total Price -->
      <template v-slot:[`item.paid`]="{ item }">
        {{ item.paid | formatPrice }}
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
              @click="showInvoice(item.deliveryForms[0])"
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
    <v-dialog v-model="invoiceGroupDialog">
      <v-card>
        <v-card-text>
          <InvoiceGroup
            :invoice="selectedInvoice"
            :clientInformation="clientInformation"
            :sellerInformation="sellerInformation"
          ></InvoiceGroup>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import InvoiceGroup from '../components/InvoiceGroup.vue'
import DatePicker from "../components/DatePicker.vue";
export default {
  components: { DatePicker, InvoiceGroup },
  data: () => {
    return {
      clients: [],
      selectedClient: -1,
      selectedInvoiceStartDate: null,
      selectedInvoiceEndDate: null,
      selectedInvoice: {},
      loading: false,
      sellerInformation: {},
      clientInformation: {},
      invoiceGroupDialog: false,
      documents: [],
      documentsColumns: [
        { text: 'Ref', value: 'id', align: 'start' },
        { text: 'Fournisseur', value: 'concern' },
        { text: 'Prix en document', value: 'totalPrice' },
        { text: 'Nom de document', value: 'name' },
        { text: 'Actions', value: 'actions' },
      ],
      invoices: [],
      invoiceColumns: [
        { text: "#", value: "count", align: "start" },
        { text: "Client", value: "client", align: "center" },
        { text: "Total TTC (MAD)", value: "paid" },
        { text: "Actions", value: "actions", sortable: false },
      ],
    }
  },
  watch: {
    selectedClient() {
      this.getInvoices();
    },
    selectedInvoiceStartDate() {
      this.getInvoices();
    },
    selectedInvoiceEndDate() {
      this.getInvoices();
    },
  },
  created() {
    this.axios.get(`${process.env.VUE_APP_API_URL}/documents`).then(res => {
      this.documents = res.data;
    });
    this.getInvoices();
    this.getClients();
  },
  methods: {
    getClients() {
      this.axios.get(`${process.env.VUE_APP_API_URL}/concerns?type=Client`).then(res => {
        this.clients = res.data;
        this.clients.unshift({ companyName: 'Tous', id: -1 })
      });
    },
    showInvoice(deliveryForm) {
      this.loading = true;
      this.axios({
        url: `${process.env.VUE_APP_API_URL}/deliveryForm/${deliveryForm.id}/invoice`,
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
        const client = res.data.deliveryForms[0].sale.concern
        this.clientInformation = {
          name: client.companyName,
          address: client.address,
          zip: client.zip,
          city: client.city,
          country: "Maroc"
        }
        this.selectedInvoice = res.data
        this.invoiceGroupDialog = true;
        this.loading = false;
      }).catch((err) => { console.log(err); this.loading = false; })
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
    getInvoices() {
      const searchQuery = {};
      if ( this.selectedClient > 0 )
        searchQuery.concern = this.selectedClient;
      if ( this.selectedInvoiceEndDate )
        searchQuery.endDate = this.selectedInvoiceEndDate;
      if ( this.selectedInvoiceStartDate )
        searchQuery.startDate = this.selectedInvoiceStartDate;
      this.axios.get(`${process.env.VUE_APP_API_URL}/invoices`, { params: searchQuery }).then(res => {
        this.invoices = res.data;
      });
    }
  }
}
</script>
