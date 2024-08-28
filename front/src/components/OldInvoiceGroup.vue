<template>
  <div>
    <div class="text-center my-3">
      <h3> Facture N° {{invoice.count}}</h3>
      <v-row justify="center" class="my-3">
        <v-col md="3" v-if="invoice?.id">
          <v-btn outlined color="primary" style="margin: auto;" @click="downloadInvoice">
            <v-icon class="mr-2">mdi-download</v-icon>
            Telecharger la facture
          </v-btn>
        </v-col>
      </v-row>
    </div>
    <div
      style="display: none;"
      ref="invoice"
    >
      <div
        v-if="invoice?.id > 0"
        class="invoice-div"
        :style="css.invoiceDiv"
      >
        <div :style="css.sellerInformation" class="seller-information">
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
                <th>Designation</th>
                <th>Unité</th>
                <th>Quantité</th>
                <th>Prix</th>
                <th v-if="productsHasDiscount">Remise</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="df of invoice.deliveryForms">
                <tr v-for="(saleProduct, index) of df.sale.saleProducts" :key="'saleProduct_' + saleProduct.id + '_' + df.id">
                  <td style="max-width: 30mm;">{{ saleProduct.product?.productCodes[0]?.code }} <br> BL-{{ df.count }}</td>
                  <td style="max-width: 30mm;">{{ saleProduct.product.categoryId + '' + saleProduct.product.productCodes[0].code + '' + saleProduct.quantity + '' + saleProduct.quantity }}</td>
                  <td style="max-width: 30mm;">{{ saleProduct.product?.unity }}</td>
                  <td style="max-width: 30mm;">{{ Intl.NumberFormat().format(saleProduct.quantity) }}</td>
                  <td style="max-width: 30mm;">{{ saleProducts[index].productPrice | formatPriceWithoutCurrency }}</td>
                  <td style="max-width: 30mm;" v-if="productsHasDiscount">{{ parseFloat(saleProduct.price) - parseFloat(saleProducts[index].productPrice) | formatPrice }}</td>
                  <td style="max-width: 30mm;">{{ saleProducts[index].price * saleProducts[index].quantity | formatPrice }}</td>
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
              <tr v-if="discount">
                <td class="text-right text-bold">Remise:</td>
                <td>{{ discount | formatPrice }}</td>
              </tr>
              <tr>
                <td class="text-right text-bold">TVA {{vatPercent}}%:</td>
                <td>{{ vat | formatPrice }}</td>
              </tr>
              <tr>
                <td class="text-right text-bold">Total:</td>
                <td>{{ parseFloat(totalPrice) | formatPrice }}</td>
              </tr>
              <!-- <tr v-if="invoice.paid < totalPrice">
                <td class="text-right text-bold">Payé:</td>
                <td>{{ parseFloat(ionvoice.paid) | formatPrice }}</td>
              </tr>
              <tr v-if="invoice.paid < totalPrice">
                <td class="text-right text-bold">Reste:</td>
                <td>{{ parseFloat(totalPrice - invoice.paid) | formatPrice }}</td>
              </tr> -->
            </tbody>
          </v-simple-table>
        </div>
      </div>
    </div>
    <div ref="invoic" class="invoice-box">
			<table cellpadding="0" cellspacing="0">
				<tr class="top">
					<td colspan="2">
						<table>
							<tr>
								<td class="title">
									<img src="https://www.sparksuite.com/images/logo.png" style="width: 100%; max-width: 300px" />
								</td>

								<td>
									Invoice #: 123<br />
									Created: January 1, 2015<br />
									Due: February 1, 2015
								</td>
							</tr>
						</table>
					</td>
				</tr>

				<tr class="information">
					<td colspan="2">
						<table>
							<tr>
								<td>
									Sparksuite, Inc.<br />
									12345 Sunny Road<br />
									Sunnyville, CA 12345
								</td>

								<td>
									Acme Corp.<br />
									John Doe<br />
									john@example.com
								</td>
							</tr>
						</table>
					</td>
				</tr>

				<tr class="heading">
					<td>Payment Method</td>

					<td>Check #</td>
				</tr>

				<tr class="details">
					<td>Check</td>

					<td>1000</td>
				</tr>

				<tr class="heading">
					<td>Item</td>

					<td>Price</td>
				</tr>

				<tr class="item">
					<td>Website design</td>

					<td>$300.00</td>
				</tr>

				<tr class="item">
					<td>Hosting (3 months)</td>

					<td>$75.00</td>
				</tr>

				<tr class="item last">
					<td>Domain name (1 year)</td>

					<td>$10.00</td>
				</tr>

				<tr class="total">
					<td></td>

					<td>Total: $385.00</td>
				</tr>
			</table>
		</div>
  </div>
</template>
<script>
import html2pdf from "html2pdf.js";
import { jsPDF } from "jspdf";
import html2Canvas from 'html2canvas'
export default {
  data: () => {
    return {
      css: {
        sellerInformation: {
          paddingTop: "25mm",
          textAlign: "right",
          paddingRight: "9mm",
          lineHeight: "2.3mm",
        },
        invoiceDiv: {
          margin: 'auto',
          backgroundSize: 'contain!important',
          backgroundRepeat: 'no-repeat!important',
          height: '297mm',
          width: '210mm',
        }
      },
      company: {},
      saleProducts: [],
      discount: 0,
      vatPercent: 20,
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
      vat = (parseFloat(this.totalDF * this.vatPercent) / 100)
      return vat;
    },
    totalPrice() {
      const total = this.totalDF + this.vat
      return total;
    }
  },
  props: {
    invoice: Object,
    clientInformation: Object,
    sellerInformation: Object,
  },
  methods: {
    downloadInvoice() {
      // html2Canvas(this.$refs.invoice, {
      //   useCORS: true,
      // }).then(canvas => {
      //   var imgData = canvas.toDataURL('image/png');              
      // })
      html2pdf(this.$refs.invoic, {
        margin: 1,
        filename: "i-was-html.pdf",
      });
    },
    OldDownloadInvoice() {
      html2Canvas(this.$refs.invoice, {
        useCORS: true,
      }).then(canvas => {
        var imgData = canvas.toDataURL('image/png');              
        var doc = new jsPDF('p', 'mm');
        doc.addImage(imgData, 'PNG', 0, 0);
        doc.save('invoice.pdf');
      })
    },
  },
  created() {
    this.company = this.$store.getters.getCompany;
    this.css.invoiceDiv.backgroundImage = `url(https://i.imgur.com/cE5smdq.png)`;
    for (const deliveryForm of this.invoice.deliveryForms) {
      if ( deliveryForm.sale.discount )
        this.discount += parseFloat(deliveryForm.sale.discount);
      for (const saleProduct of deliveryForm.sale.saleProducts) {
        saleProduct.productPrice = parseFloat(saleProduct.product[saleProduct.type])
        this.saleProducts.push(saleProduct);
      }
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
  background-size: contain!important;
  background-repeat: no-repeat!important;
  height: 297mm;
  width: 210mm;
  /* width: 250mm; */
}

.invoice-box {
  max-width: 800px;
  margin: auto;
  padding: 30px;
  background: #fff;
  /* border: 1px solid #eee; */
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.15);
  font-size: 16px;
  line-height: 24px;
  font-family: 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif;
  color: #555;
}

.invoice-box table {
  width: 100%;
  line-height: inherit;
  text-align: left;
}

.invoice-box table td {
  padding: 5px;
  vertical-align: top;
}

.invoice-box table tr td:nth-child(2) {
  text-align: right;
}

.invoice-box table tr.top table td {
  padding-bottom: 20px;
}

.invoice-box table tr.top table td.title {
  font-size: 45px;
  line-height: 45px;
  color: #333;
}

.invoice-box table tr.information table td {
  padding-bottom: 40px;
}

.invoice-box table tr.heading td {
  background: #eee;
  border-bottom: 1px solid #ddd;
  font-weight: bold;
}

.invoice-box table tr.details td {
  padding-bottom: 20px;
}

.invoice-box table tr.item td {
  border-bottom: 1px solid #eee;
}

.invoice-box table tr.item.last td {
  border-bottom: none;
}

.invoice-box table tr.total td:nth-child(2) {
  /* border-top: 2px solid #eee; */
  font-weight: bold;
}

@media only screen and (max-width: 600px) {
  .invoice-box table tr.top table td {
    width: 100%;
    display: block;
    text-align: center;
  }

  .invoice-box table tr.information table td {
    width: 100%;
    display: block;
    text-align: center;
  }
}

/** RTL **/
.invoice-box.rtl {
  direction: rtl;
  font-family: Tahoma, 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif;
}

.invoice-box.rtl table {
  text-align: right;
}

.invoice-box.rtl table tr td:nth-child(2) {
  text-align: left;
}

.no-border {
  border: unset;
}
</style>