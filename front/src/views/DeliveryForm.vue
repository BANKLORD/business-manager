<template>
  <v-row justify="center">
    <v-col cols="12">
      <div class="text-center my-3 text-uppercase">
        <h3> Système de gestion des bons de livraison et factures </h3>
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
          :items="deliveryFormsFiltered"
          v-model="selectedDeliveryForms"
        >
          <!-- Top Actions -->
          <template v-slot:top>
            <v-col class="text-center" cols="12">
              <!-- <span> Marquez les bons de livraison sélectionnés comme une seule facture </span> -->
              <v-tooltip bottom>
                <template v-slot:activator="{ on, attrs }">
                  <v-btn
                    v-bind="attrs"
                    v-on="on"
                    outlined
                    color="primary"
                    @click="showInvoiceGroup"
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
            <v-chip :color="getStatusColor(item)" dark>
              {{ getStatusText(item) }}
            </v-chip>
          </template>
          <!-- Total Price -->
          <template v-slot:[`item.totalPrice`]="{ item }">
            {{ item.sale.totalPrice | formatPrice }}
          </template>
          <!-- Total Paid -->
          <template v-slot:[`item.paid`]="{ item }">
            {{ item.sale.paid | formatPaidPrice }}
          </template>
          <!-- Rest -->
          <template v-slot:[`item.rest`]="{ item }">
            {{ (item.sale.totalPrice - item.sale.paid) | formatPrice }}
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
                <v-list>
                  <v-list-item class="d-block">
                    <v-list-item-title>
                      <v-btn
                        text
                        color="success"
                        @click="showInvoice(item)"
                        :loading="loading"
                        :disabled="loading"
                      >
                        <v-icon class="mr-2">fas fa-file-invoice</v-icon> Afficher la facture
                      </v-btn>
                    </v-list-item-title>
                    <v-list-item-title>
                      <v-btn
                        text
                        color="primary"
                        @click="showDeliveryForm(item)"
                        :loading="loading"
                        :disabled="loading"
                      >
                        <v-icon class="mr-2">fas fa-file-invoice</v-icon> Afficher le bon de livraison
                      </v-btn>
                    </v-list-item-title>
                    <v-list-item-title v-if="!item.refunds?.length">
                      <v-btn
                        text
                        color="warning"
                        @click="refundDeliveryForm(item)"
                        :loading="loading"
                        :disabled="loading"
                      >
                        <v-icon class="mr-2">fas fa-times</v-icon> Rembourser
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
    <v-dialog v-model="deliveryFormDialog">
      <v-card>
        <v-card-text>
          <DeliveryForm
            :deliveryFormInformation="selectedDeliveryForm"
            :clientInformation="clientInformation"
            :sellerInformation="sellerInformation"
          ></DeliveryForm>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-row>
</template>
<script>
import DatePicker from "../components/DatePicker.vue";
import InvoiceGroup from '../components/InvoiceGroup.vue'
import DeliveryForm from "../components/DeliveryForm.vue";
export default {
  components: { DatePicker, InvoiceGroup, DeliveryForm },
  data: () => {
    return {
      actionsItems: [
        { title: 'Click Me' },
        { title: 'Click Me' },
        { title: 'Click Me' },
        { title: 'Click Me 2' },
      ],
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
        { text: "#", value: "id", align: "start" },
        { text: "N° F", value: "invoice.count", align: "start" },
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
    deliveryFormsFiltered() {
      if ( this.selectedStatus == 1 )
        return this.deliveryForms.filter(delivery => delivery.invoice?.id > 0)
      else if ( this.selectedStatus == 2 )
        return this.deliveryForms.filter(delivery => !delivery.invoice?.id)
      return this.deliveryForms;
    }
  },
  methods: {
    refundDeliveryForm(item) {
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
            url: `${process.env.VUE_APP_API_URL}/refund`,
            data: {
              deliveryFormId: item.id,
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
        const client = this.concerns.find(c => c.id == this.selectedConcern);
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
    showDeliveryForm(deliveryForm) {
      this.loading = true;
      this.axios({
        url: `${process.env.VUE_APP_API_URL}/deliveryForm/${deliveryForm.id}`,
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
        const client = this.concerns.find(c => c.id == this.selectedConcern);
        this.clientInformation = {
          name: client.companyName,
          address: client.address,
          zip: client.zip,
          city: client.city,
          country: "Maroc"
        }
        this.selectedDeliveryForm = res.data
        this.deliveryFormDialog = true;
        this.loading = false;
      }).catch((err) => { console.log(err); this.loading = false; })
    },
    showInvoiceGroup() {
      this.loading = true;
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

      let deliveries = [];
      for (const deliveryForm of this.selectedDeliveryForms) {
        deliveries.push(deliveryForm.id)
      }
      this.axios({
        url: `${process.env.VUE_APP_API_URL}/deliveryForm/invoice`,
        method: 'POST',
        data: {
          deliveries: deliveries,
        }
      }).then((res) => {
        // this.deliveryForm = res.data;
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
        this.selectedInvoice = res.data
        this.invoiceGroupDialog = true;
        this.loading = false;
        this.getDeliveryForms()
      }).catch((err) => { console.log(err); this.loading = false; })
    },
    getStatusColor(delivery) {
      if (delivery.refunds.length > 0)
        return "warning";
      if (delivery.invoice?.id)
        return "success";
      else
        return "primary";
    },
    getStatusText(delivery) {
      if (delivery.refunds.length > 0)
        return "Remboursé";
      if (delivery.invoice?.id)
        return "Facturé";
      else
        return "Non Facturé";
    },
    getDeliveryForms() {
      const searchQuery = {};
      if ( this.selectedConcern > 0 )
        searchQuery.concern = this.selectedConcern;
      if ( this.selectedEndDate )
        searchQuery.endDate = this.selectedEndDate;
      if ( this.selectedStartDate )
        searchQuery.startDate = this.selectedStartDate;
      this.axios.get(`${process.env.VUE_APP_API_URL}/deliveryForms`, { params: searchQuery }).then(res => {
        this.deliveryForms = res.data;
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
    this.getDeliveryForms();
    this.getClients();
  },
}
</script>
