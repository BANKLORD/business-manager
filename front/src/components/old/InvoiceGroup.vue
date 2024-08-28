<template>
  <div>
    <div class="text-center my-3">
      <v-row justify="center" class="my-3">
        <v-col md="2">
          <v-btn outlined color="primary" style="margin: auto;" @click="downloadInvoice">
            <v-icon class="mr-2">mdi-download</v-icon>
            Telecharger
          </v-btn>
        </v-col>
      </v-row>
    </div>
    <div ref="invoice" class="invoice-div">
      <div class="seller-information">
        <p><b>{{ sellerInformation.name }}</b></p>
        <p>{{ sellerInformation.address }}</p>
        <p>{{ sellerInformation.zip }}, {{ sellerInformation.city }}</p>
        <p>{{ sellerInformation.country }}</p>
      </div>
      <div class="divider"></div>
      <table style="width: 100%">
        <td class="client-information" style="text-align: left;">
          <p><b>{{ clientInformation.name }}</b></p>
          <p>{{ clientInformation.address }}</p>
          <p>{{ clientInformation.zip }}, {{ clientInformation.city }}</p>
          <p>{{ clientInformation.country }}</p>
        </td>
        <!-- <td class="invoice-information d-none">
          <p><b>{{ invoiceName }} N°:</b> {{ invoiceInformation.number }}</p>
          <p><b>Date:</b> {{ invoiceInformation.date | formatDate }}</p>
          <p><b>Date d'échéance:</b> {{ invoiceInformation.date | formatDate }}</p>
        </td> -->
      </table>
      <div class="products">
        <v-simple-table dense>
          <thead>
            <tr>
              <th>Facture N°</th>
              <th>Prix Total TTC</th>
              <th>Total Payé</th>
              <th>Total a Payé</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="invoice of invoices" :key="'invoice_' + invoice.id">
              <td v-if="invoice.invoices.length">{{ new Date().getFullYear() + '.' + invoice.invoices[0]?.id }}</td>
              <td v-else>{{ new Date().getFullYear() + '.' + invoice.id }} (Provisoire)</td>
              <td>{{ invoice.totalPrice | formatPrice }}</td>
              <td>{{ invoice.paid | formatPrice }}</td>
              <td>{{ invoice.totalPrice - invoice.paid | formatPrice }}</td>
            </tr>
          </tbody>
        </v-simple-table>
        <v-simple-table class="my-4" dense style="max-width: 100mm;float: right">
          <tbody>
            <tr>
              <td class="text-right text-bold">Total TTC:</td>
              <td>{{ totalPrice | formatPrice }}</td>
            </tr>
            <tr>
              <td class="text-right text-bold">Total Payé:</td>
              <td>{{ paid | formatPrice }}</td>
            </tr>
            <tr>
              <td class="text-right text-bold">Le reste TTC:</td>
              <td>{{ rest | formatPrice }}</td>
            </tr>
          </tbody>
        </v-simple-table>
      </div>
    </div>
  </div>
</template>
<script>
import { jsPDF } from "jspdf";
import html2Canvas from 'html2canvas'
export default {
  computed: {
    totalDF() {
      let total = 0;
      return total;
    },
    vatPercentage() {
      return 20;
    },
    vat() {
      let vat = 0;
      return vat;
    },
    totalPrice() {
      let total = 0
      for (const invoice of this.invoices) {
        total += parseFloat(invoice.totalPrice)
      }
      return total;
    },
    paid() {
      let paid = 0;
      for (const invoice of this.invoices) {
        paid -= parseFloat(invoice.paid)
      }
      return paid;
    },
    rest() {
      return parseFloat(this.totalPrice) + parseFloat(this.paid);
    }
  },
  props: {
    sellerInformation: Object,
    clientInformation: Object,
    invoices: Array,
  },
  methods: {
    downloadInvoice() {
      html2Canvas(this.$refs.invoice, {
        useCORS: true,
      }).then(canvas => {
        var imgData = canvas.toDataURL('image/png');              
        var doc = new jsPDF('p', 'mm');
        doc.addImage(imgData, 'PNG', 0, 0);
        doc.save('invoice.pdf');
      })
    }
  }
}
</script>

<style>
.text-bold {
  font-weight: bold;
}
.products {
  margin: 10mm auto;
  max-width: 90%;
}

.divider {
  background: #838383;
  height: 3px;
  width: 90%;
  margin: 9mm auto;
}

.seller-information {
  padding-top: 25mm;
  text-align: right;
  padding-right: 9mm;
  line-height: 2.3mm;
}

.client-information {
  text-align: left;
  padding-left: 9mm;
  line-height: 2.3mm;
}

.invoice-information {
  text-align: right;
  padding-right: 9mm;
  line-height: 2.3mm;
}

.invoice-div {
  margin: auto;
  background: url('http://217.182.237.222:3000/invoice-template.png');
  background-size: contain;
  background-repeat: no-repeat;
  height: 297mm;
  width: 210mm;
}
</style>