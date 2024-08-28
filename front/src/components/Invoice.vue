<template>
  <div>
    <div class="text-center my-3">
      <h3> Facture N° {{ invoiceInformation.count }}</h3>
      <v-row justify="center" class="my-3">
        <v-col md="2">
          <v-btn outlined color="primary" style="margin: auto;" @click="downloadInvoice">
            <v-icon class="mr-2">mdi-download</v-icon>
            Telecharger
          </v-btn>
        </v-col>
        <v-col md="2">
          <v-btn outlined color="primary" style="margin: auto;" @click="isDeliveryForm = !isDeliveryForm">
            <v-icon class="mr-2">mdi-repeat</v-icon>
            {{ switchDeliveryFormButtonText }}
          </v-btn>
        </v-col>
      </v-row>
    </div>
    <div
      ref="invoice"
      class="invoice-div"
      :style="{ 'background-image': `url(${company.invoiceLink})` }"
    >
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
        <td class="invoice-information">
          <p><b>{{ invoiceName }} N°:</b> {{ invoiceInformation.number }}</p>
          <p><b>Date:</b> {{ invoiceInformation.date | formatDate }}</p>
          <p><b>Date d'échéance:</b> {{ invoiceInformation.date | formatDate }}</p>
        </td>
      </table>
      <div class="products">
        <v-simple-table dense>
          <thead>
            <tr>
              <th>Description</th>
              <th>Designation</th>
              <th>Unité</th>
              <th>Quantité</th>
              <th>Prix</th>
              <th v-if="productsHasDiscount">Remise</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="saleProduct of saleProducts" :key="'saleProduct_' + saleProduct.id">
              <td>{{ saleProduct.description }}</td>
              <td>{{ saleProduct.product.productCodes[0].code }}</td>
              <td>{{ saleProduct.product?.unity }}</td>
              <td>{{ Intl.NumberFormat().format(saleProduct.quantity) }}</td>
              <td>{{ saleProduct.productPrice | formatPrice }}</td>
              <td v-if="productsHasDiscount">{{ parseFloat(saleProduct.price) - parseFloat(saleProduct.productPrice) | formatPrice }}</td>
              <td>{{ saleProduct.price * saleProduct.quantity | formatPrice }}</td>
            </tr>
          </tbody>
        </v-simple-table>
        <v-simple-table class="my-4" dense style="max-width: 100mm;float: right">
          <tbody>
            <tr>
              <td class="text-right text-bold">Total HT:</td>
              <td>{{ totalDF | formatPrice }}</td>
            </tr>
            <tr v-if="sale.discount">
              <td class="text-right text-bold">Remise:</td>
              <td>{{ sale.discount | formatPrice }}</td>
            </tr>
            <tr>
              <td class="text-right text-bold">TVA {{sale.vat}}%:</td>
              <td>{{ vat | formatPrice }}</td>
            </tr>
            <tr>
              <td class="text-right text-bold">Total:</td>
              <td>{{ totalPrice | formatPrice }}</td>
            </tr>
            <tr v-if="sale.paid < totalPrice">
              <td class="text-right text-bold">Payé:</td>
              <td>{{ parseFloat(sale.paid) | formatPrice }}</td>
            </tr>
            <tr v-if="sale.paid < totalPrice">
              <td class="text-right text-bold">Reste:</td>
              <td>{{ parseFloat(totalPrice - sale.paid) | formatPrice }}</td>
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
  created() {
    this.company = this.$store.getters.getCompany;
  },
  data: () => {
    return {
      company: {},
      isDeliveryForm: false,
    }
  },
  computed: {
    switchDeliveryFormButtonText() {
      return !this.isDeliveryForm ? 'Afficher la bon de livraison':'Afficher la facture';
    },
    invoiceName() {
      return this.isDeliveryForm ? 'Bon de livraison':'Facture';
    },
    productsHasDiscount() {
      let hasDiscount = false
      for (const saleProduct of this.saleProducts) {
        if ( saleProduct.price < saleProduct.productPrice )
          hasDiscount = true;
      }
      return hasDiscount;
    },
    totalDF() {
      let total = 0;
      for (const saleProduct of this.saleProducts) {
        total += parseFloat(saleProduct.price * saleProduct.quantity)
      }
      return total;
    },
    vat() {
      let vat = 0;
      vat = (parseFloat(this.totalDF * this.sale.vat) / 100)
      return vat;
    },
    totalPrice() {
      const total = this.totalDF + this.vat
      return total;
    }
  },
  props: {
    sellerInformation: Object,
    clientInformation: Object,
    invoiceInformation: Object,
    saleProducts: Array,
    sale: Object,
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
  background-size: contain!important;;
  background-repeat: no-repeat!important;;
  height: 297mm;
  width: 210mm;
}
</style>