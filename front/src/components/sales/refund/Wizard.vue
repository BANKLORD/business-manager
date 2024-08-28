<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="10">
        <v-card
          elevation="2"
        >
          <v-container fluid style="max-height: 80vh; overflow-y: auto;">
            <v-card-text>
              <v-simple-table dense>
                <thead>
                  <tr>
                    <th>V #</th>
                    <th>BL #</th>
                    <th>Des</th>
                    <th>Qté</th>
                    <th>Qté à rembourser</th>
                  </tr>
                </thead>
                <tbody>
                  <template v-if="isLoadingData">
                    <tr v-for="n in 7" :key="n" >
                      <td>
                        <v-skeleton-loader type="text" />
                      </td>
                      <td>
                        <v-skeleton-loader type="text" />
                      </td>
                      <td>
                        <v-skeleton-loader type="text" />
                      </td>
                      <td>
                        <v-skeleton-loader type="text" />
                      </td>
                      <td>
                        <v-skeleton-loader type="text" />
                      </td>
                    </tr>
                  </template>
                  <tr v-for="(saleProduct, index) in saleProducts" :key="'sp_' + index">
                    <td>{{ saleProduct.saleId }}</td>
                    <td>{{ getDeliveryForm(saleProduct.saleId).count }}</td>
                    <td>{{ saleProduct.product.productCodes[0].code }}</td>
                    <td>{{ saleProduct.quantity - (saleProduct.quantityRefunded ?? 0) }} (-<small>{{ saleProduct.quantityRefunded }}</small>) </td>
                    <td>
                      <v-text-field
                        dense
                        type="number"
                        v-model="saleProduct.refundedQuantity"
                        :rules="maxNumberRule(saleProduct.quantity - saleProduct.quantityRefunded)"
                      ></v-text-field>
                    </td>
                  </tr>
                </tbody>
              </v-simple-table>
            </v-card-text>
          </v-container>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn
              :disabled="isLoading"
              :loading="isLoading"
              tile
              color="success"
              @click="saveChanges()"
            >
              <v-icon left>mdi-plus</v-icon>
              Effectuer l'avoir
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  data: () => {
    return {
      deliveryForms: [],
      saleProducts: [],
      isLoading: false,
      isLoadingData: false,
    }
  },
  props: {
    Invoice: Object,
  },
  methods: {
    getDeliveryForm(saleId) {
      return this.deliveryForms.find(df => df.sale.id == saleId);
    },
    async saveChanges() {
      this.isLoading = true;
      if (
        this.saleProducts.filter(sp => sp.refundedQuantity > sp.quantity).length
        || this.saleProducts.filter(sp => sp.refundedQuantity < 0 ).length
      ) {
        this.$swal({ title: 'Quantité invalide!', text: `La quantité que vous avez saisie dépasse la quantité disponible pour l'article dans la facture. Veuillez entrer une quantité valide`, icon: 'warning' });
        return this.isLoading = false;
      }
      const refundedSaleProducts = this.saleProducts.filter(sp => sp.refundedQuantity > 0).map(
        sp => ({
          quantity: sp.refundedQuantity,
          saleProductId: sp.id
        })
      );
      const results = await this.$swal({
        title: 'Êtes-vous sûr?',
        text: "Vous ne pourrez pas revenir en arrière!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: `Oui, Effectuer l'avoir!`
      });
      if ( !results.isConfirmed ) return this.isLoading = false;
      const refund = {
        refundOperations: refundedSaleProducts,
        invoiceId: this.Invoice.id
      }
      const response = await this.axios.post(`${process.env.VUE_APP_API_URL}/sale/invoice/refund`, refund).catch((err) => {err.response; this.isLoading = false;});
      switch (response.status) {
        case 200:
          this.$swal({ title: 'Effectué!', text: `L'avoir a été effectué avec succès.`, icon: 'success' });
          this.isLoading = false;
          this.$emit('closed', true);
          break;
        case 422:
          this.$swal({ title: 'Champs obligatoires manquants!', text: response.data, icon: 'warning' });
          break;
        default:
          this.$swal({ title: 'Erreur serveur', text: `Internal Server Error`, icon: 'error' });
          break;
      }
      this.isLoading = false;
    },
    maxNumberRule(maxNumber) {
      return [
        (v) => (!v || v <= maxNumber) || `Le nombre maximum autorisé est ${maxNumber}`,
      ]
    } 
  },
  mounted() {
    this.isLoadingData= true;
    this.axios.get(`${process.env.VUE_APP_API_URL}/sale/invoice/${this.Invoice.id}`).then((res) => {
      this.deliveryForms = res.data.deliveryForms;
      this.saleProducts = [].concat(...res.data.deliveryForms.map(df => df.sale.saleProducts));
      console.log(this.saleProducts);
      this.saleProducts = this.saleProducts.map(sp => {
        return {
          ...sp,
          quantityRefunded: sp.refundOperations.reduce((acc, refundOperation) => acc + refundOperation.quantity, 0)
        }
      })
      // this.saleProducts = this.saleProducts.refundOperations.reduce((acc, refundOperation) => acc + refundOperation.quantity, 0);
      this.isLoadingData= false;
    }).catch(() => { this.isLoadingData= false });

    // this.axios.get(`${process.env.VUE_APP_API_URL}/sale/sale/${this.Invoice.id}`).then((res) => {
    //   this.deliveryForms = res.data.deliveryForms;
    //   this.saleProducts = [].concat(...res.data.deliveryForms.map(df => df.sale.saleProducts));
    //   this.isLoading= false;
    // }).catch(() => { this.isLoading= false });
  }
}
</script>