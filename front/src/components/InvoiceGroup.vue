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
    <div ref="invoice" class="invoice-box">
			<table ref="invoice-table" cellpadding="0" cellspacing="0">
				<tr class="top">
					<td colspan="2">
						<table>
							<tr>
								<td class="title">
									<img ref="logoLink" :src="company.logoLink" style="width: 100%; max-width: 300px" />
								</td>
								<td>
									Facture N°: <b> {{ new Date().getFullYear() + '.' + invoice.count }} </b> <br />
                  Date:<b> {{ new Date(invoice.createdAt).toISOString().split('T')[0] | formatDate }}</b><br />
                  Date d'échéance:<b> {{ new Date(new Date(invoice.createdAt).setDate(+60)).toISOString().split('T')[0] | formatDate }} </b>
								</td>
							</tr>
						</table>
					</td>
				</tr>
        <tr>
          <td colspan="2">
            <div class="divider"></div>
          </td>
        </tr>
				<tr class="information">
					<td colspan="2">
						<table>
							<tr>
                <td style="width: 50%;">
                  <b>Client :</b> <br />
									{{ clientInformation.name }} <br />
                  {{ clientInformation.address }} <br />
                  <template v-if="clientInformation.zip && clientInformation.city">
                    {{ clientInformation.zip }}, {{ clientInformation.city }} <br />
                  </template>
                  {{ clientInformation.country }} <br />
								</td>
								<td style="width: 50%;">
                  {{ sellerInformation.name }} <br />
                  {{ sellerInformation.address }} <br />
                  {{ sellerInformation.zip }}, {{ sellerInformation.city }} <br />
                  {{ sellerInformation.country }} <br />
								</td>
							</tr>
						</table>
					</td>
				</tr>
        <tr>
          <td class="no-border">
            <table cellpadding="0" cellspacing="0">
              <tr class="heading">
                <td>Designation</td>
              </tr>
            </table>
          </td>
          <td class="no-border">
            <table cellpadding="0" cellspacing="0">
              <tr class="fixedTds">
                <td class="heading">Prix</td>
                <td class="heading left">Quantité</td>
                <td v-if="productsHasDiscount" class="heading">Remise</td>
                <td class="heading">Total</td>
              </tr>
            </table>
          </td>
        </tr>
        <template v-for="(df, dfIndex) of invoice.deliveryForms">
          <tr class="item" v-for="(saleProduct, index) of df.sale.saleProducts" :key="'saleProduct_' + saleProduct.id + '_' + df.id">
            <td class="no-border">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    {{ saleProduct.product?.productCodes[0]?.code }} {{saleProduct.product?.productCodes[1]?.code}} <br />
                    BL-{{ df.count }} <br>
                  </td>
                </tr>
              </table>
            </td>
            <td class="no-border">
              <table cellpadding="0" cellspacing="0">
                <tr class="fixedTds">
                  <td>{{ saleProducts[dfIndex + index]?.price ?? saleProducts[dfIndex + index]?.productPrice | formatPrice }}</td>
                  <td class="left">
                    {{ Intl.NumberFormat().format(saleProduct.quantity) }} {{ saleProduct.product?.unity }}
                  </td>
                  <td v-if="productsHasDiscount">{{ parseFloat(saleProduct.price) - parseFloat(saleProducts[dfIndex + index]?.productPrice) | formatPrice }}</td>
                  <td>{{ saleProducts[dfIndex + index].price * saleProduct.quantity | formatPrice }}</td>
                </tr>
              </table>
            </td>
          </tr>
        </template>
        <td colspan="2">
          <table cellpadding="0" cellspacing="0">
            <tr class="heading">
              <td>Total HT</td>
              <td class="left" v-if="discount">Remise </td>
              <td class="left">TVA {{vatPercent}}%</td>
              <td class="left">Total TTC</td>
            </tr>
            <tr>
              <td >{{totalDF | formatPrice}}</td>
              <td class="left" v-if="discount">-{{discount | formatPrice}} </td>
              <td class="left">{{vat | formatPrice}}</td>
              <td class="left">{{parseFloat(totalPrice) | formatPrice}}</td>
            </tr>
          </table>
        </td>
			</table>
      <img class="invoice-footer" :src="company.footerLink" style="width: 19cm;" />
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
      let total = parseFloat(this.totalDF) - parseFloat(this.discount);
      vat = (parseFloat(total * this.vatPercent) / 100)
      return vat;
    },
    totalPrice() {
      const total = parseFloat(this.totalDF) - parseFloat(this.discount) + this.vat
      return total;
    }
  },
  props: {
    invoice: Object,
    clientInformation: Object,
    sellerInformation: Object,
  },
  methods: {
    async downloadInvoice() {
      if (this.$refs['invoice-table'].clientHeight > 1040) {
        this.$refs['invoice'].style.height = "2080px";
      }
      html2pdf(this.$refs.invoice, {
        margin: 1,
        filename: `invoice-${this.invoice.count}.pdf`,
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
  background: #fff!important;
  max-width: 800px;
  margin: auto;
  padding: 30px;
  /* border: 1px solid #fff;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.15); */
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
  
/* .invoice-box table tr.heading td {
  background: #eee;
  border-bottom: 1px solid #ddd;
  font-weight: bold;
} */
  
.heading {
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
  
.invoice-box table tr.total {
  border-bottom: 2px solid #eee;
  font-weight: bold;
}

/* tr.total td:nth-child(2) {
  text-align: left!important;
} */
  
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

tr td.tdTotal:nth-child(1) {
  width: 80%;
  text-align: right;
}

tr td.tdTotal:nth-child(2) {
  width: min-content;
  text-align: right!important;;
}

.left {
  text-align: left!important;
}

.no-border {
  border: none!important;
}

.invoice-box img.invoice-footer {
  position: absolute;
  bottom: 0;
}

.invoice-box{
  position: relative;
  min-height: 1080px;
}

.fixedTds td {
  width: 105px;
}
</style>