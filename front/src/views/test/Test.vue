<template>
  <div>
    <iframe ref="frame" src="" style="width: 100%;height: 650px;">

    </iframe>
  </div>
</template>

<script>
import pdfMake from 'pdfmake';
import pdfFonts from "pdfmake/build/vfs_fonts";
pdfMake.vfs = pdfFonts.pdfMake.vfs;
export default {
  data() {
    return {
      invoiceData: {
        info: {
          title: 'FACTURE-142.2022',
          author: 'Oussama LTD',
          creator: 'Oussama',
          producer: 'Oussama',
        },
        content: [
          {
            canvas: [ { type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1 } ],
            margin: [0, 55],
            alignment: "center"
          },
          // { text: '', marginTop: 45, width: 800, height: 3, background: "#838383" }
        ],
        styles: {
          tableExample: {
            width: "100%"
          }
        }
      }
    }
  },
  methods: {
    generatePDFHeader(currentPage) {
      const company = this.$store.getters.getCompany;
      return [
        { image: company.logoLink, alignment: (currentPage % 2) ? 'center' : 'right', margin: [0, 15], fit: [150, 150] },
        { text: 'dasdasd', alignment: 'right', margin: 15, width: 150, height: 100 },
      ]
    },
    generateHeader() {
      return {
        table: {
          widths: ["*"],
          body: [
            [
              {
                border: [true, true, true, false],
                fillColor: '#eeeeee',
                text: 'Oussama',
                bold: true
              },
            ],
            [
              {
                border: [true, false, true, true],
                fillColor: '#eeeeff',
                text: 'something else'
              },
            ],
          ]
        },
      }
    },
    async generatePDF(){
      const generatePDFHeader = this.generatePDFHeader;
      this.invoiceData.header = await function (currentPage) {
        return generatePDFHeader(currentPage);
      }
      this.invoiceData.content.push(this.generateHeader())
      // pdfMake.createPdf(this.invoiceData).print();
      // pdfMake.createPdf(this.invoiceData).download();
      var doc = pdfMake.createPdf(this.invoiceData);
      var f = this.$refs["frame"];
      console.log(f);
      var callback = function(url) { f.setAttribute('src', url); }
      doc.getDataUrl(callback, doc);
    },
  },
  mounted() {
    this.generatePDF();
  }
};
</script>

<style>
</style>