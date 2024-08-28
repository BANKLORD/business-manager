<template>
  <v-dialog
      transition="dialog-bottom-transition"
      v-model="addServiceDialog"
      max-width="640"
      persistent
  >
    <v-card>
      <v-toolbar class="text-center" color="primary" dark >
        <v-spacer></v-spacer>
        <h2 class="text-uppercase">Ajouter un service supplémentaire</h2>
        <v-spacer></v-spacer>
      </v-toolbar>
      <v-card-text class="my-5 py-5">
        <v-row justify-sm="center">
          <!-- service -->
          <v-col lg="12" sm="12">
            <v-autocomplete
                label="Service"
                v-model="editedSaleService.serviceId"
                :items="services"
                item-text="name"
                item-value="id"
            ></v-autocomplete>
          </v-col>
<!--          quantity-->
          <v-col lg="12" sm="12">
            <v-text-field
                v-if="$store.getters.hasPerm('sale-update-sell-price')"
                label="Quantity"
                v-model="editedSaleService.quantity"
                type="number"
            ></v-text-field>
          </v-col>
          <!-- Base Price -->
          <v-col lg="12" sm="12">
            <v-text-field
                v-if="services.find(s => s.id === editedSaleService.serviceId)"
                readonly
                disabled
                label="Base price"
                v-model="services.find(s => s.id === editedSaleService.serviceId).sell_price"
                type="number"
            ></v-text-field>
          </v-col>
          <!-- sell price-->
          <v-col lg="12" sm="12">
            <v-text-field
                v-if="$store.getters.hasPerm('sale-update-sell-price')"
                label="prix"
                v-model="editedSaleService.price"
                type="number"
            ></v-text-field>
            <v-text-field
                v-else
                readonly
                disabled
                label="prix"
                v-model="editedSaleService.price"
                type="number"
            ></v-text-field>
          </v-col>
          <!-- prix TTC-->
          <v-col lg="12" sm="12">
            <v-col lg="3" sm="6">
              <slot name="ttc"></slot>
            </v-col>
          </v-col>
        </v-row>
      </v-card-text>
      <v-card-actions class="justify-end">
        <v-btn
            color="error"
            tile
            @click="closeAddServiceDialog"
        >
          Fermer
        </v-btn>
        <v-spacer></v-spacer>
        <v-btn
            color="primary"
            tile
            @click="addService()"
        >
          {{ `${(editedSaleServiceIndex >= 0) ? 'Modifier':'Ajouter'}` }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  props: {
    editedSaleService: Object,
    addServiceDialog: Boolean,
    isAdd: Boolean,
    services: Array,
    closeAddServiceDialog: Function,
    addService: Function,
    editedSaleServiceIndex: Number
  },
  watch : {

  }
}
</script>

<style scoped>

</style>
