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
      <v-toolbar-title>Avoir N° {{sale.count}}</v-toolbar-title>
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
            <v-list-item class="d-block" link @click="downloadQuotation">
              <v-list-item-title>
                <v-btn
                  text 
                  color="primary" 
                  :loading="loading"
                  :disabled="loading"
                >
                  <v-icon class="mr-2">mdi-download</v-icon>
                  Telecharger le BL
                </v-btn>
              </v-list-item-title>
            </v-list-item>
            <v-list-item class="d-block">
              <v-list-item-title>
                <v-switch
                  v-model="toggleHeader"
                  label="Basculer l'en-tête/Pied de page du BL"
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
      discount: 0,
      vatPercent: 20,
      defaultInvoiceData: {
        pageMargins: [40, 150, 40, 150],
        info: {
          title: 'AVOIR-2024.',
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
      this.reGenerateQuotation();
    }
  },
  computed: {
    productsHasDiscount() {
      // let hasDiscount = false
      // for (const saleProduct of this.sale.saleProducts) {
      //   if ( saleProduct.price < saleProduct.productPrice )
      //     hasDiscount = true;
      // }
      return false;
    },
    totalDF() {
      let total = 0;
      for (const saleProduct of this.sale.saleProducts) {
        total -= parseFloat(saleProduct.price * saleProduct.quantity)
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
    sale: Object,
    clientInformation: Object,
    sellerInformation: Object,
  },
  methods: {
    closeDialog() {
      this.$emit('closed', true);
    },
    async downloadQuotation() {
      await pdfMake.createPdf(this.invoiceData).download(`AVOIR-2024.${this.sale.count}.pdf`);
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
        ],
        columnGap: 10,
      })
      this.invoiceData.content.push({
        text: [
          "Avoir N°: ",
          { text: `${new Date().getFullYear() + '.' + this.sale.count}\n`, style: [ 'bold' ] },
          "Date: ",
          { text: `${Vue.filter('formatDate')(new Date(this.sale.deliveryForms[0].createdAt).toISOString().split('T')[0])}`, style: [ 'bold' ] },
        ],
        style: [ 'invoiceInformation' ]
      })
    },
    generateSalesTable() {
      /** Building the headers */
      var salesHeader = [
        { text: 'Designation', bold: true, color: "#666" },
        { text: 'Prix HT', bold: true, color: "#666" },
        { text: 'Quantité', bold: true, color: "#666" },
      ]
      /** Checking if sales has discount if yes, add Discount column */
      if (this.productsHasDiscount) salesHeader.push({ text: 'Remise', bold: true, color: "#666" })
      salesHeader.push({ text: 'Total HT', bold: true, color: "#666" });
      /** Distributing columns widths depends on discount column wether it exists or not.. */
      var salesHeaderWidths = (this.productsHasDiscount) ? [150, '*', '*', '*', '*']:[150, '*', '*', '*'];
      /** Add sales now */
      var sales = [];
      sales.push(salesHeader)
      for (const saleProduct of this.sale.saleProducts) {
        var saleP = [
          saleProduct.product?.productCodes[0]?.code,
          Vue.filter('formatPrice')(saleProduct.price ?? saleProduct.productPrice),
          Intl.NumberFormat().format(saleProduct.quantity) + ' ' + saleProduct.product?.unity,
        ]
        if (this.productsHasDiscount && (parseFloat(saleProduct.price) < parseFloat(saleProduct.productPrice))) saleP.push(Vue.filter('formatPrice')(parseFloat(saleProduct.price) - parseFloat(saleProduct.productPrice)))
        else if (this.productsHasDiscount) saleP.push(Vue.filter('formatPrice')(parseFloat(0)))
        saleP.push(Vue.filter('formatPrice')((saleProduct.price * saleProduct.quantity)))
        sales.push(saleP);
      }
      /** Pushing into invoiceData content */
      this.invoiceData.content.push({
        margin: [0, 20, 0, 20],
        table: {
          widths: salesHeaderWidths,
          body: sales
        },
      });
      /** Generating sub-total and discount, VAT & Total TTC */
      var salesTotalTable = [];
      // Total Duty Free
      salesTotalTable.push([
        { text: 'Total HT', bold: true },
        { text: Vue.filter('formatPrice')(this.totalDF), color: '#212121' },
      ]);
      // Discount
      if ( this.discount ) {
        salesTotalTable.push([
          { text: 'Remise', bold: true },
          { text: Vue.filter('formatPrice')(-this.discount), color: '#212121' },
        ]);
      }
      // VAT
      salesTotalTable.push([
        { text: `TVA ${this.vatPercent}%`, bold: true },
        { text: Vue.filter('formatPrice')(this.vat), color: '#212121' },
      ]);
      // TTC
      salesTotalTable.push([
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
              widths: [80, '*'],
              body: salesTotalTable
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
        { text: 'Arrêtée la présente avoir à la somme de: \n', bold: true, fontSize: '10' },
        { text: totalInLetters.toUpperCase(),  fontSize: '10' },
      ]);
    },
    generateDescription() {
      this.invoiceData.content.push([
        { text: '\n\n Note:', bold: true },
        { text: this.sale.description + '\n' },
      ]);
    },
    async reGenerateQuotation() {
      this.invoiceData = Object.assign({}, this.defaultInvoiceData);
      if ( this.toggleHeader ) {
        await this.generateHeaderAndFooter();
      }
      this.generatePDF();
    },
    async generateQuotation() {
      this.invoiceData.content = [];
      this.invoiceData = Object.assign({}, this.defaultInvoiceData);
      this.invoiceData.info.title = `AVOIR-2024.${this.sale.count}`;
      /** Generating Items starting from Invoice information through sales table to the footer */
      this.generateInvoiceInformation();
      this.generateSalesTable();
      this.generatePriceToLetters();
      if ( this.sale?.description )
        this.generateDescription();
      if ( this.toggleHeader ) {
        await this.generateHeaderAndFooter();
      }
      this.generatePDF();
    }
  },
  created() {
    this.company = this.$store.getters.getCompany;
    for (const saleProduct of this.sale.saleProducts) {
      if ( !saleProduct.productPrice ) {
        saleProduct.productPrice = parseFloat(saleProduct.product[saleProduct.type])
      } 
    }
  },
  mounted() {
    this.generateQuotation();
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