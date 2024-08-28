<template>
  <div>
    <div class="text-center my-3">
      <h3> Vente N° {{sale.id}}</h3>
      <v-row justify="center" class="my-3">
        <v-col md="3" v-if="deliveryForm?.id && isDeliveryForm">
          <v-btn outlined color="primary" style="margin: auto;" @click="downloadDeliveryForm">
            <v-icon class="mr-2">mdi-download</v-icon>
            Telecharger B.L
          </v-btn>
        </v-col>
        <v-col md="3" v-else-if="isDeliveryForm">
          <v-btn outlined color="primary" @click="createDeliveryForm">
            <v-icon class="mr-2">mdi-plus</v-icon>
            Générer un nouveau B.L
          </v-btn>
        </v-col>
        <v-col md="3" v-if="invoice?.id && !isDeliveryForm">
          <v-btn outlined color="primary" style="margin: auto;" @click="downloadInvoice">
            <v-icon class="mr-2">mdi-download</v-icon>
            Telecharger la facture
          </v-btn>
        </v-col>
        <v-col md="3" v-else-if="deliveryForm?.id && !invoice?.id">
          <v-btn outlined color="primary" @click="createInvoice">
            <v-icon class="mr-2">mdi-plus</v-icon>
            Générer la facture
          </v-btn>
        </v-col>
      </v-row>
      <v-row justify="center" class="my-3">
        <v-col md="3" v-if="deliveryForm?.id && invoice?.id">
          <v-btn outlined color="primary" @click="isDeliveryForm = !isDeliveryForm">
            <v-icon class="mr-2">fas fa-exchange</v-icon>
            {{ isDeliveryForm ? 'Afficher la facture':'Afficher le B.L' }}
          </v-btn>
        </v-col>
      </v-row>
    </div>
    <div ref="deliveryForm" class="invoice-div" v-if="(deliveryForm?.id > 0) && isDeliveryForm">
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
          <p><b>Bon de livraison N°:</b> {{ new Date().getFullYear() + '.' + deliveryForm.count }}</p>
          <p><b>Date:</b> {{ new Date(deliveryForm.createdAt).toISOString().split('T')[0] | formatDate }}</p>
          <p><b>Date d'échéance:</b> {{ new Date(new Date(deliveryForm.createdAt).setDate(+60)).toISOString().split('T')[0] | formatDate }}</p>

          <!-- <p><b>Bon de livraison N°:</b> {{ invoiceInformation.number }}</p>
          <p><b>Date:</b> {{ invoiceInformation.date | formatDate }}</p>
          <p><b>Date d'échéance:</b> {{ invoiceInformation.date | formatDate }}</p> -->
        </td>
      </table>
      <div class="products">
        <v-simple-table dense>
          <thead>
            <tr>
              <th>Description</th>
              <th>Quantité</th>
              <th>Prix</th>
              <th v-if="productsHasDiscount">Remise</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="saleProduct of saleProducts" :key="'saleProduct_' + saleProduct.id">
              <td>{{ saleProduct.description }}</td>
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
    <div ref="invoice" class="invoice-div" v-if="(invoice?.id > 0) && !isDeliveryForm">
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
          <p><b>Facture N°:</b> {{ new Date().getFullYear() + '.' + invoice.count }}</p>
          <p><b>Date:</b> {{ new Date(invoice.createdAt).toISOString().split('T')[0] | formatDate }}</p>
          <p><b>Date d'échéance:</b> {{ new Date(new Date(invoice.createdAt).setDate(+60)).toISOString().split('T')[0] | formatDate }}</p>
        </td>
      </table>
      <div class="products">
        <v-simple-table dense>
          <thead>
            <tr>
              <th>Description</th>
              <th>Quantité</th>
              <th>Prix</th>
              <th v-if="productsHasDiscount">Remise</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="df of invoice.deliveryForms">
              <tr v-for="saleProduct of df.sale.saleProducts" :key="'saleProduct_' + saleProduct.id + '_' + df.id">
                <td>{{ saleProduct.product?.productCodes[0]?.code }}</td>
                <td>{{ Intl.NumberFormat().format(saleProduct.quantity) }}</td>
                <td>{{ saleProduct.productPrice | formatPrice }}</td>
                <td v-if="productsHasDiscount">{{ parseFloat(saleProduct.price) - parseFloat(saleProduct.productPrice) | formatPrice }}</td>
                <td>{{ saleProduct.price * saleProduct.quantity | formatPrice }}</td>
              </tr>
            </template>
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
  data: () => {
    return {
      deliveryForm: {},
      invoice: {},
      isDeliveryForm: true,
    }
  },
  computed: {
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
    downloadDeliveryForm() {
      html2Canvas(this.$refs.deliveryForm, {
        useCORS: true,
      }).then(canvas => {
        var imgData = canvas.toDataURL('image/png');              
        var doc = new jsPDF('p', 'mm');
        doc.addImage(imgData, 'PNG', 0, 0);
        doc.save('deliveryForm.pdf');
      })
    },
    createDeliveryForm() {
      this.axios({
        url: `${process.env.VUE_APP_API_URL}/deliveryForm`,
        method: 'POST',
        data: {
          saleId: this.sale.id
        }
      }).then((res) => {
        this.deliveryForm = res.data;
        this.$swal(
          'Succès!',
          'Les modifications ont été effectuées avec succès.',
          'success'
        )
      }).catch(err => {
        this.$swal(
          'Champs obligatoires manquants!',
          'Assurez-vous de remplir toutes les entrées obligatoires avant de soumettre votre demande.',
          'warning'
        )
        console.log(err);
      })
    },
    createInvoice() {
      this.axios({
        url: `${process.env.VUE_APP_API_URL}/deliveryForm/${this.deliveryForm.id}/invoice`,
        method: 'POST',
        data: {
          deliveryFormId: this.deliveryForm.id
        }
      }).then(() => {
        this.loadInvoice();
        this.$swal(
          'Succès!',
          'Les modifications ont été effectuées avec succès.',
          'success'
        )
      }).catch(err => {
        this.$swal(
          'Champs obligatoires manquants!',
          'Assurez-vous de remplir toutes les entrées obligatoires avant de soumettre votre demande.',
          'warning'
        )
        console.log(err);
      })
    },
    downloadInvoice() {
      html2Canvas(this.$refs.invoice, {
        useCORS: true,
      }).then(canvas => {
        var imgData = canvas.toDataURL('image/png');              
        var doc = new jsPDF('p', 'mm');
        doc.addImage(imgData, 'PNG', 0, 0);
        doc.save('invoice.pdf');
      })
    },
    loadInvoice() {
      this.axios.get(`${process.env.VUE_APP_API_URL}/deliveryForm/${this.deliveryForm.id}/invoice`).then(res => {
        this.invoice = res.data;
      })
    }
  },
  created() {
    this.axios({
      url: `${process.env.VUE_APP_API_URL}/sale/${this.sale.id}/deliveryForm`,
      method: 'GET',
    }).then((res) => {
      this.deliveryForm = res.data;
      this.loadInvoice()
    }).catch((err) => { console.log(err); })
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