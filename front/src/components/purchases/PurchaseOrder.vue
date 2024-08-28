<template>
  <div>
    <v-toolbar
      dark
      color="primary"
    >
      <!-- Close Dialog Button -->
      <v-btn
        icon
        dark
        @click="closeDialog"
      >
        <v-icon>mdi-close</v-icon>
      </v-btn>
      <v-toolbar-title>Bon de commande N° {{purchase.count}}</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-toolbar-items>
        <v-menu offset-y>
          <template v-slot:activator="{ on, attrs }">
            <v-btn
              icon
              v-bind="attrs"
              v-on="on"
              :loading="loading"
              :disabled="loading"
            >
              <v-icon>fa-ellipsis-v</v-icon>
            </v-btn>
          </template>
          <v-list
            nav
            dense
          >
            <v-list-item class="d-block" link @click="downloadPurchaseOrder">
              <v-list-item-title>
                <v-btn
                  text 
                  color="primary" 
                  :loading="loading"
                  :disabled="loading"
                >
                  <v-icon class="mr-2">mdi-download</v-icon>
                  Télécharger en format PDF
                </v-btn>
              </v-list-item-title>
            </v-list-item>
            <v-list-item class="d-block">
              <v-list-item-title>
                <v-switch
                  v-model="toggleHeader"
                  label="Basculer l'en-tête/Pied de page"
                >
                </v-switch>
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </v-toolbar-items>
    </v-toolbar>
    <div class="text-center my-3"></div>
    <div style="width: fit-content;margin: auto;">
      <iframe ref="invoice"></iframe>
    </div>
  </div>
</template>
<script>
import pdfMake from 'pdfmake';
import pdfFonts from "pdfmake/build/vfs_fonts";
import Vue from 'vue';
pdfMake.vfs = pdfFonts.pdfMake.vfs;
export default {
  data: () => {
    return {
      toggleHeader: true,
      loading: false,
      company: {},
      vatPercent: 20,
      defaultInvoiceData: {
        pageMargins: [40, 100, 40, 150],
        info: {
          title: 'PO-2022.',
          author: 'Oussama LTD',
          creator: 'Oussama',
          producer: 'Oussama',
        },
        content: [],
        styles: {
          "col-12": {
            width: '100%',
          },
          companyInformation: {
            width: '50%',
            lineHeight: 1.2,
            height: 1,
            color: "#363636"
          },
          invoiceInformation: {
            margin: [15, 15, 0, 0],
            lineHeight: 1.2,
            color: "#363636"
          },
          alingRight: { alignment: "right" },
          bold: { bold: true },
          bordered: { border: "1px solid black" }
        },
      }, 
      invoiceData: {},
    }
  },
  watch: {
    toggleHeader() {
      this.reGeneratePurchaseOrder();
    }
  },
  computed: {
    totalDF() {
      let total = 0;
      for (const purchaseProduct of this.purchase.purchaseProducts) {
        total += parseFloat(purchaseProduct.price * purchaseProduct.quantity)
      }
      return total;
    },
    vat() {
      let vat = 0;
      let total = parseFloat(this.totalDF);
      vat = (parseFloat(total * this.vatPercent) / 100)
      return vat;
    },
    totalPrice() {
      const total = parseFloat(this.totalDF) + this.vat
      return total;
    }
  },
  props: {
    purchase: Object,
    clientInformation: Object,
    sellerInformation: Object,
  },
  methods: {
    closeDialog() {
      this.$emit('closed', true);
    },
    async downloadPurchaseOrder() {
      await pdfMake.createPdf(this.invoiceData).download(`BC-2022.${this.purchase.count}.pdf`);
    },
    async generatePDF(){
      var doc = pdfMake.createPdf(this.invoiceData);
      var f = this.$refs["invoice"];
      var callback = function(url) { f.setAttribute('src', url); }
      doc.getDataUrl(callback, doc);
    },
    generateInvoiceInformation() {
      this.invoiceData.content.push({
        columns: [
          { text: "FOURNISSEUR", bold: true, alignment: 'center', marginBottom: 5, color: '#666'},
          { text: "CLIENT", bold: true, alignment: 'center', marginBottom: 5, color: '#666' }
        ]
      })
      this.invoiceData.content.push({
        columns: [
        {
            table: {
              widths: ['*'],
              body: [
                /** Company Information Row */
                [
                  {
                    border: [true, true, true, true],
                    text: [
                      { text: `${this.clientInformation.name ?? '-'}\n`, bold: true },
                      `${this.clientInformation.address ?? '-'}\n`,
                      (this.clientInformation.zip && this.clientInformation.city) ? `${this.clientInformation.zip ?? '-'}, ${this.clientInformation.city ?? '-'}\n`: '\n',
                      `${this.clientInformation.country ?? '-'}\n`,
                      `ICE: ${this.clientInformation.ice ?? '-'}\n`,
                    ],
                    margin: 15,
                  },
                ],
              ]
            },
            style: [ 'companyInformation', "alingRight" ]
          },
          {
            table: {
              widths: ['*'],
              body: [
                /** Company Information Row */
                [
                  {
                    border: [true, true, true, true],
                    text: [
                      { text: `${this.sellerInformation.name}\n`, bold: true },
                      `${this.sellerInformation.address}\n`,
                      `${this.sellerInformation.zip}, ${this.sellerInformation.city}\n`,
                      `${this.sellerInformation.country}\n`,
                      `ICE: ${this.company.ICE}\n`,
                    ],
                    margin: 15
                  },
                ],
              ]
            },
            style: [ 'companyInformation']
          },
        ],
        columnGap: 10,
      })
      this.invoiceData.content.push({
        text: [
          "Bon de commande N°: ",
          { text: `${new Date().getFullYear() + '.' + this.purchase.count}\n`, style: [ 'bold' ] },
          "Date: ",
          { text: `${Vue.filter('formatDate')(new Date(this.purchase.createdAt).toISOString().split('T')[0])}`, style: [ 'bold' ] },
        ],
        style: [ 'invoiceInformation' ]
      })
    },
    generatePurchasesTable() {
      /** Building the headers */
      var purchasesHeader = [
        { text: 'Designation', bold: true, color: "#666" },
        { text: 'Prix HT', bold: true, color: "#666" },
        { text: 'Quantité', bold: true, color: "#666" },
      ]
      purchasesHeader.push({ text: 'Total HT', bold: true, color: "#666" });
      /** Distributing columns widths .. */
      var purchasesHeaderWidths = [150, '*', '*', '*'];
      /** Add purchases now */
      var purchases = [];
      purchases.push(purchasesHeader)
      for (const purchaseProduct of this.purchase.purchaseProducts) {
        var purchaseP = [
          purchaseProduct.product?.productCodes[0]?.code,
          Vue.filter('formatPrice')(purchaseProduct.price),
          Intl.NumberFormat().format(purchaseProduct.quantity) + ' ' + purchaseProduct.product?.unity,
        ]
        purchaseP.push(Vue.filter('formatPrice')((purchaseProduct.price * purchaseProduct.quantity)))
        purchases.push(purchaseP);
      }
      /** Pushing into invoiceData content */
      this.invoiceData.content.push({
        margin: [0, 20, 0, 0],
        table: {
          widths: purchasesHeaderWidths,
          body: purchases
        },
      });
      /** Generating sub-total, VAT & Total TTC */
      var purchasesTotalTable = [];
      // Total Duty Free
      purchasesTotalTable.push([
        { text: 'Total HT', bold: true },
        { text: Vue.filter('formatPrice')(this.totalDF), color: '#212121' },
      ]);
      // VAT
      purchasesTotalTable.push([
        { text: `TVA ${this.vatPercent}%`, bold: true },
        { text: Vue.filter('formatPrice')(this.vat), color: '#212121' },
      ]);
      // TTC
      purchasesTotalTable.push([
        { text: 'Total TTC', bold: true },
        { text: Vue.filter('formatPrice')(this.totalPrice), color: '#212121' },
      ]);
      /** Push all into invoice data */
      this.invoiceData.content.push({
        columns: [
          { text: '' },
          {
            margin: [0, 5, 0, 0],
            width: '40.8%',
            alignment: 'right',
            table: {
              widths: [80, 120],
              body: purchasesTotalTable
            },
          }
        ]
      });
    },
    async getBase64ImageFromLink(link) {
      const response = await fetch(link);
      const blob = await response.blob();
      return await new Promise((resolve, reject) => {
        let reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend=() => {
          resolve('data:image/png;base64,'+reader.result.split(',')[1]);
          // resolve(reader.result);
        };
        reader.onerror=() => {
          reject('Error while reading the image file.');
        };
      });
    },
    async generateHeaderAndFooter() {
      var company = this.company;
      const logoLink = await this.getBase64ImageFromLink(company.logoLink);
      // console.log(logoLink);
      this.invoiceData.header = function(currentPage, pageCount) {
        return [
          {
            columns: [
              { text: currentPage.toString() + '/' + pageCount, alignment: 'left', margin: [10, 5] },
              { 
                image: logoLink,
                alignment: 'center', margin: [0, 5],
                fit: [150, 50],
              },
              { text: currentPage.toString() + '/' + pageCount, alignment: 'right', margin: [10, 5] },
            ],
          },
          {
            canvas: [ { type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1 } ],
            margin: [0, 10],
            alignment: 'center',
            width: "100%"
          }
        ]
      }
      const footerLink = await this.getBase64ImageFromLink(company.footerLink);
      this.invoiceData.footer = [
        { 
          image: footerLink,
          alignment: 'center', margin: [0, 0],
          fit: [650, 400],
          width: "100%",
        },
      ]
    },
    generatePriceToLetters() {
      // Transform total price into letters
      const totalInLetters = Vue.filter('numToDirhams')(parseFloat(this.totalPrice));
      // console.log(this.totalPrice);
      this.invoiceData.content.push([
        { text: 'Arrêtée la présente bon de commande à la somme de: \n', bold: true },
        { text: totalInLetters.toUpperCase() },
      ]);
    },
    generateDescription() {
      this.invoiceData.content.push([
        { text: '\n\n Note:', bold: true },
        { text: this.purchase.description + '\n' },
      ]);
    },
    async reGeneratePurchaseOrder() {
      this.invoiceData = Object.assign({}, this.defaultInvoiceData);
      if ( this.toggleHeader ) {
        await this.generateHeaderAndFooter();
      }
      this.generatePDF();
    },
    async generatePurchaseOrder() {
      this.invoiceData.content = [];
      this.invoiceData = Object.assign({}, this.defaultInvoiceData);
      this.invoiceData.info.title = `BC-2022.${this.purchase.count}`;
      /** Generating Items starting from Invoice information through purchases table to the footer */
      this.generateInvoiceInformation();
      this.generatePurchasesTable();
      this.generatePriceToLetters();
      if ( this.purchase?.description )
        this.generateDescription();
      if ( this.toggleHeader ) {
        await this.generateHeaderAndFooter();
      }
      this.generatePDF();
    }
  },
  created() {
    this.company = this.$store.getters.getCompany;
    for (const purchaseProduct of this.purchase.purchaseProducts) {
      if ( !purchaseProduct.price ) {
        purchaseProduct.price = parseFloat(purchaseProduct.product[purchaseProduct.type])
      } 
    }
  },
  mounted() {
    this.generatePurchaseOrder();
  }
}
</script>

<style>
iframe {
  margin: auto;
  width: 1080px;
  height: 85vh;
}
</style>